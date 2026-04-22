import { 
  ref, get, set, push, update, remove, query, orderByChild, limitToFirst
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getFirebaseAuth, getFirebaseDb } from './config.js';
import { showToast, getInitials, formatDateShort, formatTime, getMonthAbbr, getDay, truncate, getCategoryColor, isUpcoming } from './utils.js';

const eventsCache = {
  data: null,
  timestamp: 0,
  TTL: 60000
};

function getCachedEvents() {
  const now = Date.now();
  if (eventsCache.data && (now - eventsCache.timestamp) < eventsCache.TTL) {
    return eventsCache.data;
  }
  return null;
}

function setCachedEvents(events) {
  eventsCache.data = events;
  eventsCache.timestamp = Date.now();
}

export async function fetchEvents({ category = null, sort = 'upcoming', limit = 12, offset = 0, useCache = true } = {}) {
  if (useCache && getCachedEvents()) {
    const filtered = filterAndSortEvents(getCachedEvents(), category, sort);
    const paginatedEvents = filtered.slice(offset, offset + limit);
    return { data: paginatedEvents, error: null };
  }

  const db = getFirebaseDb();
  
  try {
    const eventsRef = ref(db, 'events');
    const snapshot = await get(eventsRef);
    
    if (!snapshot.exists()) {
      return { data: [], error: null };
    }
    
    let events = [];
    const eventsData = snapshot.val();
    
    for (const [id, event] of Object.entries(eventsData)) {
      events.push({ id, ...event });
    }
    
    const filtered = filterAndSortEvents(events, category, sort);
    const enriched = await enrichEventsWithCounts(filtered);
    
    if (useCache) {
      setCachedEvents(enriched);
    }
    
    const paginatedEvents = enriched.slice(offset, offset + limit);
    
    return { data: paginatedEvents, error: null };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { data: [], error };
  }
}

function filterAndSortEvents(events, category, sort) {
  const today = new Date().toISOString().split('T')[0];
  let filtered = [...events];
  
  switch (sort) {
    case 'upcoming':
      filtered = filtered
        .filter(e => e.date >= today)
        .sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
      break;
    case 'trending':
      filtered = filtered.filter(e => e.date >= today);
      filtered.sort((a, b) => {
        const aScore = (a.rsvpCount || 0) * 10;
        const bScore = (b.rsvpCount || 0) * 10;
        const daysUntilA = Math.abs(new Date(a.date) - new Date()) / (1000 * 60 * 60 * 24);
        const daysUntilB = Math.abs(new Date(b.date) - new Date()) / (1000 * 60 * 60 * 24);
        const aRecency = Math.max(0, 30 - daysUntilA);
        const bRecency = Math.max(0, 30 - daysUntilB);
        return (bScore + bRecency) - (aScore + aRecency);
      });
      break;
    case 'newest':
      filtered = filtered
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      break;
    case 'past':
      filtered = filtered
        .filter(e => e.date < today)
        .sort((a, b) => b.date.localeCompare(a.date));
      break;
  }
  
  if (category && category !== 'all') {
    filtered = filtered.filter(e => e.category === category);
  }
  
  return filtered;
}

async function enrichEventsWithCounts(events) {
  const db = getFirebaseDb();
  
  const enriched = await Promise.all(events.map(async (event) => {
    try {
      const rsvpsRef = ref(db, `events/${event.id}/rsvps`);
      const rsvpsSnap = await get(rsvpsRef);
      
      let rsvpCount = 0;
      if (rsvpsSnap.exists()) {
        const rsvpsData = rsvpsSnap.val();
        rsvpCount = Object.values(rsvpsData).filter(r => r.status === 'going').length;
      }
      event.rsvpCount = rsvpCount;
      
      if (event.created_by) {
        const creatorRef = ref(db, `users/${event.created_by}`);
        const creatorSnap = await get(creatorRef);
        if (creatorSnap.exists()) {
          event.profiles = { id: creatorSnap.key, ...creatorSnap.val() };
        }
      }
    } catch (e) {
      event.rsvpCount = 0;
    }
    return event;
  }));
  
  return enriched;
}

export async function fetchEvent(eventId) {
  const db = getFirebaseDb();
  
  try {
    const eventRef = ref(db, `events/${eventId}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      return { data: null, error: 'Event not found' };
    }
    
    const event = { id: snapshot.key, ...snapshot.val() };
    
    const rsvpsRef = ref(db, `events/${eventId}/rsvps`);
    const rsvpsSnap = await get(rsvpsRef);
    
    if (rsvpsSnap.exists()) {
      const rsvpsData = rsvpsSnap.val();
      const rsvps = Object.values(rsvpsData);
      event.going_count = rsvps.filter(r => r.status === 'going').length;
      event.interested_count = rsvps.filter(r => r.status === 'interested').length;
      event.total_rsvps = rsvps.length;
    } else {
      event.going_count = 0;
      event.interested_count = 0;
      event.total_rsvps = 0;
    }
    
    if (event.created_by) {
      const creatorRef = ref(db, `users/${event.created_by}`);
      const creatorSnap = await get(creatorRef);
      if (creatorSnap.exists()) {
        event.profiles = { id: creatorSnap.key, ...creatorSnap.val() };
      }
    }
    
    return { data: event, error: null };
  } catch (error) {
    console.error('Error fetching event:', error);
    return { data: null, error };
  }
}

export async function fetchFeaturedEvent() {
  const db = getFirebaseDb();
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const eventsRef = ref(db, 'events');
    const snapshot = await get(eventsRef);
    
    if (!snapshot.exists()) {
      return { data: null, error: null };
    }
    
    const eventsData = snapshot.val();
    let events = [];
    
    for (const [id, event] of Object.entries(eventsData)) {
      if (event.date >= today) {
        events.push({ id, ...event });
      }
    }
    
    events.sort((a, b) => a.date.localeCompare(b.date));
    
    if (events.length === 0) {
      return { data: null, error: null };
    }
    
    const event = events[0];
    
    const rsvpsRef = ref(db, `events/${event.id}/rsvps`);
    const rsvpsSnap = await get(rsvpsRef);
    event.rsvpCount = rsvpsSnap.exists() ? Object.keys(rsvpsSnap.val()).length : 0;
    
    return { data: event, error: null };
  } catch (error) {
    console.error('Error fetching featured event:', error);
    return { data: null, error };
  }
}

export async function createEvent(eventData) {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const user = auth.currentUser;
  
  try {
    const eventsRef = ref(db, 'events');
    const newEventRef = push(eventsRef);
    
    const eventPayload = {
      ...eventData,
      createdAt: Date.now()
    };
    
    if (user) {
      eventPayload.created_by = user.uid;
    }
    
    await set(newEventRef, eventPayload);
    
    eventsCache.data = null;
    eventsCache.timestamp = 0;
    
    const event = { id: newEventRef.key, ...eventPayload };
    
    showToast('Event created successfully!', 'success');
    return { data: event, error: null };
  } catch (error) {
    showToast(error.message || 'Failed to create event', 'error');
    return { data: null, error: error.message };
  }
}

export async function updateEvent(eventId, updates) {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const user = auth.currentUser;
  
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }
  
  try {
    const eventRef = ref(db, `events/${eventId}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      throw new Error('Event not found');
    }
    
    const eventData = snapshot.val();
    if (eventData.created_by !== user.uid) {
      throw new Error('You can only edit your own events');
    }
    
    await update(eventRef, {
      ...updates,
      updatedAt: Date.now()
    });
    
    const updatedEvent = { id: eventId, ...eventData, ...updates };
    
    showToast('Event updated!', 'success');
    return { data: updatedEvent, error: null };
  } catch (error) {
    showToast(error.message || 'Failed to update event', 'error');
    return { data: null, error: error.message };
  }
}

export async function deleteEvent(eventId) {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const user = auth.currentUser;
  
  if (!user) {
    return { error: 'Not authenticated' };
  }
  
  try {
    const eventRef = ref(db, `events/${eventId}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      throw new Error('Event not found');
    }
    
    const eventData = snapshot.val();
    if (eventData.created_by !== user.uid) {
      throw new Error('You can only delete your own events');
    }
    
    if (eventData.image_url) {
      import('./storage.js').then(({ deleteEventImage }) => {
        deleteEventImage(eventData.image_url);
      }).catch(console.error);
    }
    
    await remove(eventRef);
    
    showToast('Event deleted', 'success');
    return { error: null };
  } catch (error) {
    showToast(error.message || 'Failed to delete event', 'error');
    return { error: error.message };
  }
}

export async function fetchUserEvents(userId) {
  const db = getFirebaseDb();
  
  try {
    const eventsRef = ref(db, 'events');
    const snapshot = await get(eventsRef);
    
    if (!snapshot.exists()) {
      return { data: [], error: null };
    }
    
    const eventsData = snapshot.val();
    let events = [];
    
    for (const [id, event] of Object.entries(eventsData)) {
      if (event.created_by === userId) {
        events.push({ id, ...event });
      }
    }
    
    events.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    const enriched = await Promise.all(events.map(async (event) => {
      const rsvpsRef = ref(db, `events/${event.id}/rsvps`);
      const rsvpsSnap = await get(rsvpsRef);
      event.rsvpCount = rsvpsSnap.exists() ? Object.keys(rsvpsSnap.val()).length : 0;
      return event;
    }));
    
    return { data: enriched, error: null };
  } catch (error) {
    console.error('Error fetching user events:', error);
    return { data: [], error };
  }
}

export async function fetchCategories() {
  const categories = [
    { id: 'academic', name: 'Academic', icon: 'book', color: '#4F46E5' },
    { id: 'cultural', name: 'Cultural', icon: 'music', color: '#9333EA' },
    { id: 'sports', name: 'Sports', icon: 'trophy', color: '#059669' },
    { id: 'career', name: 'Career', icon: 'briefcase', color: '#EA580C' },
    { id: 'social', name: 'Social', icon: 'users', color: '#D97706' },
    { id: 'technology', name: 'Technology', icon: 'cpu', color: '#0D9488' },
    { id: 'health', name: 'Health', icon: 'heart', color: '#DC2626' },
    { id: 'art', name: 'Art', icon: 'palette', color: '#DB2777' }
  ];
  
  return categories.map(cat => ({
    ...cat,
    count: Math.floor(Math.random() * 20) + 1
  }));
}

export function renderEventCard(event, showDelete = false) {
  const categoryStyle = getCategoryColor(event.category);
  const eventDate = new Date(event.date);
  const upcoming = isUpcoming(event.date);
  const rsvpCount = event.rsvpCount || 0;
  
  const shareUrl = `${window.location.origin}/event.html?id=${event.id}`;
  const shareText = `Check out this event: ${event.title}`;
  
  return `
    <article class="card event-card ${!upcoming ? 'past-event' : ''}" data-event-id="${event.id}" style="position: relative;">
      <a href="/event.html?id=${event.id}" class="event-card-link">
        <div class="event-card-image-wrapper">
          ${event.image_url ? 
            (event.image_url.match(/\.(mp4|webm|mov|avi)$/i) || event.image_url.includes('video'))
              ? (() => {
                  let vUrl = event.image_url;
                  if (vUrl.includes('cloudinary.com') && !vUrl.includes('fl_video')) {
                    vUrl = vUrl.replace('/upload/', '/upload/fl_video/');
                  }
                  return '<video src="' + vUrl + '" class="card-image" loading="lazy" muted playsinline style="object-fit: cover;"></video>';
                })()
              : '<img src="' + event.image_url + '" alt="' + event.title + '" class="card-image" loading="lazy">'
            :
            '<div class="card-image skeleton skeleton-image"></div>'
          }
          ${event.image_url && (event.image_url.match(/\.(mp4|webm|mov|avi)$/i) || event.image_url.includes('video')) ? 
            '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none;"><i class="fa-solid fa-play-circle" style="font-size: 40px; color: white; opacity: 0.8;"></i></div>' : ''
          }
          <span class="badge event-card-category" style="background-color: ${categoryStyle.bg}; color: ${categoryStyle.text}">
            ${event.category}
          </span>
          <div class="event-card-date">
            <span class="event-card-date-month">${getMonthAbbr(event.date)}</span>
            <span class="event-card-date-day">${getDay(event.date)}</span>
          </div>
        </div>
        <div class="card-body event-card-body">
          <h3 class="card-title event-card-title">${event.title}</h3>
          <div class="event-card-meta">
            <div class="event-card-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>${formatTime(event.time)}</span>
            </div>
            <div class="event-card-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span>${truncate(event.location_name, 30)}</span>
            </div>
          </div>
          <div class="event-card-footer">
            <div class="event-card-rsvp-count">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>${rsvpCount} going</span>
            </div>
            ${event.profiles?.name ? `
              <div class="flex items-center gap-2">
                <span class="text-muted" style="font-size: 0.8125rem">by ${event.profiles.name}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </a>
      <div class="event-card-actions" style="position: absolute; bottom: 8px; right: 8px; display: flex; gap: 4px; z-index: 10;">
        ${showDelete ? `
          <a href="/create-event.html?id=${event.id}" class="btn btn-icon btn-edit-event" title="Edit event" style="background: rgba(0,0,0,0.6); border: none; width: 28px; height: 28px; padding: 0; opacity: 0.9; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="14" height="14">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </a>
          <button class="btn btn-icon btn-delete-event" data-id="${event.id}" title="Delete event" style="background: rgba(0,0,0,0.6); border: none; width: 28px; height: 28px; padding: 0; opacity: 0.9;">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="14" height="14">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        ` : ''}
        <div class="share-dropdown" style="position: relative;">
          <button class="btn btn-share-event" title="Share event" style="background: rgba(0,0,0,0.6); border: none; width: 28px; height: 28px; padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: var(--radius); opacity: 0.9;">
            <i class="fa-solid fa-share-nodes" style="color: white; font-size: 12px;"></i>
          </button>
          <div class="share-menu" style="position: absolute; top: 100%; right: 0; margin-top: 4px; background: white; border-radius: var(--radius); box-shadow: var(--shadow-lg); padding: 4px; display: none; min-width: 120px; z-index: 100;">
            <a href="https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}" target="_blank" class="share-option" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; color: #333; text-decoration: none; border-radius: var(--radius-sm); font-size: 14px;">
              <i class="fa-brands fa-whatsapp" style="color: #25D366; font-size: 16px;"></i>
              WhatsApp
            </a>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}" target="_blank" class="share-option" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; color: #333; text-decoration: none; border-radius: var(--radius-sm); font-size: 14px;">
              <i class="fa-brands fa-linkedin" style="color: #0A66C2; font-size: 16px;"></i>
              LinkedIn
            </a>
            <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}" target="_blank" class="share-option" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; color: #333; text-decoration: none; border-radius: var(--radius-sm); font-size: 14px;">
              <i class="fa-brands fa-x-twitter" style="color: #000; font-size: 16px;"></i>
              X
            </a>
          </div>
        </div>
      </div>
    </article>
  `;
}

export function renderEventCardSkeleton() {
  return `
    <article class="card event-card">
      <div class="skeleton skeleton-image" style="aspect-ratio: 16/9;"></div>
      <div class="card-body">
        <div class="skeleton skeleton-text" style="width: 80%; height: 1.5em;"></div>
        <div class="skeleton skeleton-text" style="width: 60%;"></div>
        <div class="skeleton skeleton-text" style="width: 40%;"></div>
      </div>
    </article>
  `;
}

export async function searchEvents(searchQuery) {
  const db = getFirebaseDb();
  
  try {
    const eventsRef = ref(db, 'events');
    const snapshot = await get(eventsRef);
    
    if (!snapshot.exists()) {
      return { data: [], error: null };
    }
    
    const eventsData = snapshot.val();
    const events = [];
    
    for (const [id, event] of Object.entries(eventsData)) {
      if (
        event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        events.push({ id, ...event });
      }
    }
    
    events.sort((a, b) => a.date.localeCompare(b.date));
    
    return { data: events, error: null };
  } catch (error) {
    console.error('Error searching events:', error);
    return { data: [], error };
  }
}

export async function getEventStats() {
  const db = getFirebaseDb();
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const eventsRef = ref(db, 'events');
    const snapshot = await get(eventsRef);
    
    let eventsCount = 0;
    let totalRsvps = 0;
    
    if (snapshot.exists()) {
      const eventsData = snapshot.val();
      
      for (const event of Object.values(eventsData)) {
        if (event.date >= today) {
          eventsCount++;
        }
        
        if (event.rsvpCount) {
          totalRsvps += event.rsvpCount;
        }
      }
    }
    
    const usersRef = ref(db, 'users');
    const usersSnap = await get(usersRef);
    const usersCount = usersSnap.exists() ? Object.keys(usersSnap.val()).length : 0;
    
    return {
      events: eventsCount,
      rsvps: totalRsvps,
      users: usersCount
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return { events: 0, rsvps: 0, users: 0 };
  }
}
