import { 
  ref, get, set, remove 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getFirebaseAuth, getFirebaseDb } from './config.js';
import { getCurrentUser } from './auth.js';
import { showToast } from './utils.js';

export async function getUserRSVP(eventId) {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const db = getFirebaseDb();
  
  try {
    const rsvpRef = ref(db, `events/${eventId}/rsvps/${user.id}`);
    const snapshot = await get(rsvpRef);
    
    if (snapshot.exists()) {
      return { id: snapshot.key, ...snapshot.val() };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching RSVP:', error);
    return null;
  }
}

export async function toggleRSVP(eventId, status) {
  const user = await getCurrentUser();
  if (!user) {
    showToast('Please sign in to RSVP', 'error');
    window.location.href = '/auth.html';
    return { error: 'Not authenticated' };
  }
  
  const db = getFirebaseDb();
  
  try {
    const rsvpRef = ref(db, `events/${eventId}/rsvps/${user.id}`);
    const existing = await get(rsvpRef);
    
    if (existing.exists() && existing.val().status === status) {
      await remove(rsvpRef);
      showToast(`Removed ${status}`, 'info');
      const counts = await getRSVPCounts(eventId);
      updateRSVPCountsUI(counts);
      updateRSVPButtonsUI(null);
      return { data: null, error: null, action: 'removed' };
    }
    
    await set(rsvpRef, {
      user_id: user.id,
      user_name: user.displayName || user.profile?.name || user.email,
      user_avatar: user.photoURL || user.profile?.avatar_url,
      status,
      createdAt: Date.now()
    });
    
    showToast(`You're ${status}!`, 'success');
    const counts = await getRSVPCounts(eventId);
    updateRSVPCountsUI(counts);
    updateRSVPButtonsUI(status);
    return { data: { status }, error: null, action: 'added' };
  } catch (error) {
    showToast(error.message || 'Failed to RSVP', 'error');
    return { data: null, error: error.message };
  }
}

function updateRSVPCountsUI(counts) {
  const goingCount = document.querySelector('.going-count');
  const interestedCount = document.querySelector('.interested-count');
  if (goingCount) goingCount.textContent = counts.going;
  if (interestedCount) interestedCount.textContent = counts.interested;
}

function updateRSVPButtonsUI(status) {
  document.querySelectorAll('.rsvp-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.status === status) {
      btn.classList.add('active');
    }
  });
}

export async function fetchEventRSVPs(eventId) {
  const db = getFirebaseDb();
  
  try {
    const rsvpsRef = ref(db, `events/${eventId}/rsvps`);
    const snapshot = await get(rsvpsRef);
    
    if (!snapshot.exists()) {
      return { data: [], error: null };
    }
    
    const rsvpsData = snapshot.val();
    const rsvps = Object.entries(rsvpsData).map(([id, data]) => ({ id, ...data }));
    
    rsvps.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    return { data: rsvps, error: null };
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    return { data: [], error };
  }
}

export async function getRSVPCounts(eventId) {
  const db = getFirebaseDb();
  
  try {
    const rsvpsRef = ref(db, `events/${eventId}/rsvps`);
    const snapshot = await get(rsvpsRef);
    
    if (!snapshot.exists()) {
      return { going: 0, interested: 0, total: 0 };
    }
    
    const rsvpsData = snapshot.val();
    const rsvps = Object.values(rsvpsData);
    
    return {
      going: rsvps.filter(r => r.status === 'going').length,
      interested: rsvps.filter(r => r.status === 'interested').length,
      total: rsvps.length
    };
  } catch (error) {
    console.error('Error getting RSVP counts:', error);
    return { going: 0, interested: 0, total: 0 };
  }
}

export async function fetchUserRSVPs(userId) {
  const db = getFirebaseDb();
  
  try {
    const eventsRef = ref(db, 'events');
    const eventsSnap = await get(eventsRef);
    const userRsvps = [];
    
    if (!eventsSnap.exists()) {
      return { data: [], error: null };
    }
    
    const eventsData = eventsSnap.val();
    
    for (const [eventId, event] of Object.entries(eventsData)) {
      const rsvpRef = ref(db, `events/${eventId}/rsvps/${userId}`);
      const rsvpSnap = await get(rsvpRef);
      
      if (rsvpSnap.exists()) {
        userRsvps.push({
          id: rsvpSnap.key,
          event_id: eventId,
          ...event,
          ...rsvpSnap.val()
        });
      }
    }
    
    userRsvps.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    return { data: userRsvps, error: null };
  } catch (error) {
    console.error('Error fetching user RSVPs:', error);
    return { data: [], error };
  }
}

export function renderRSVPButtons(currentStatus) {
  const goingActive = currentStatus === 'going' ? 'active' : '';
  const interestedActive = currentStatus === 'interested' ? 'active' : '';
  
  return `
    <button class="rsvp-btn rsvp-btn-going ${goingActive}" data-status="going">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      Going
    </button>
    <button class="rsvp-btn rsvp-btn-interested ${interestedActive}" data-status="interested">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      Interested
    </button>
  `;
}

export function renderRSVPCounts(counts) {
  return `
    <div class="rsvp-stats">
      <div class="rsvp-stat">
        <div class="rsvp-stat-value going-count">${counts.going}</div>
        <div class="rsvp-stat-label">Going</div>
      </div>
      <div class="rsvp-stat">
        <div class="rsvp-stat-value interested-count">${counts.interested}</div>
        <div class="rsvp-stat-label">Interested</div>
      </div>
    </div>
  `;
}

export function renderAttendee(attendee) {
  const name = attendee.user_name || attendee.profiles?.name || 'Unknown';
  const avatar = attendee.user_avatar || attendee.profiles?.avatar_url;
  
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return `
    <div class="attendee-item">
      <div class="avatar avatar-sm">
        ${avatar ? 
          `<img src="${avatar}" alt="${name}">` :
          `<span>${initials}</span>`
        }
      </div>
      <div class="attendee-info">
        <div class="attendee-name">${name}</div>
        <div class="attendee-role">${attendee.status === 'going' ? 'Going' : 'Interested'}</div>
      </div>
    </div>
  `;
}
