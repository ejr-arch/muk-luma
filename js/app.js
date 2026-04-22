import { initFirebase } from './config.js';
import { initAuth, getCurrentUser, signOut, signInWithGoogle } from './auth.js';
import { $, $$, showToast, debounce, getInitials } from './utils.js';
import { fetchEvents, fetchFeaturedEvent, renderEventCard, renderEventCardSkeleton, getEventStats, fetchCategories } from './events.js';
import { subscribeToEvents } from './realtime.js';

let initialized = false;

export async function initApp() {
  if (initialized) return;
  
  try {
    initFirebase();
    await initAuth();
    
    setupNavigation();
    setupMobileMenu();
    setupSearch();
    setupAuth();
    setupRealtime();
    
    const page = document.body.dataset.page;
    
    switch (page) {
      case 'home':
        await initHomePage();
        break;
      case 'events':
        await initEventsPage();
        break;
      case 'event-detail':
        await initEventDetailPage();
        break;
      case 'create-event':
        await initCreateEventPage();
        break;
      case 'profile':
        await initProfilePage();
        break;
      case 'auth':
        await initAuthPage();
        break;
    }
    
    initialized = true;
  } catch (error) {
    console.error('App initialization error:', error);
  }
  
  hidePageLoader();
}

function hidePageLoader() {
  const loader = $('.page-loader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 300);
  }
}

function setupNavigation() {
  const currentPath = window.location.pathname;
  const navLinks = $$('.navbar-nav a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (currentPath === href || (href !== '/' && currentPath.includes(href))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function setupMobileMenu() {
  const menuBtn = $('.mobile-menu-btn');
  const drawer = $('.mobile-drawer');
  const backdrop = $('.mobile-drawer-backdrop');
  const closeBtn = $('.mobile-drawer-close');
  
  if (!menuBtn || !drawer) return;
  
  const openMenu = () => {
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  
  const closeMenu = () => {
    drawer.classList.remove('active');
    document.body.style.overflow = '';
  };
  
  menuBtn.addEventListener('click', openMenu);
  backdrop?.addEventListener('click', closeMenu);
  closeBtn?.addEventListener('click', closeMenu);
  
  const mobileLinks = $$('.mobile-nav-links a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

function setupSearch() {
  const searchInput = $('#search-input');
  if (!searchInput) return;
  
  const performSearch = debounce(async (query) => {
    if (query.length < 2) return;
    
    const { searchEvents } = await import('./events.js');
    const { data } = await searchEvents(query);
    
    const eventGrid = $('.event-grid');
    if (eventGrid) {
      if (data.length === 0) {
        eventGrid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <h3 class="empty-state-title">No events found</h3>
            <p class="empty-state-text">Try a different search term</p>
          </div>
        `;
      } else {
        eventGrid.innerHTML = data.map(event => renderEventCard(event)).join('');
      }
    }
  }, 300);
  
  searchInput.addEventListener('input', (e) => {
    performSearch(e.target.value.trim());
  });
}

async function updateUserMenu() {
  const user = await getCurrentUser();
  const userMenu = $('.user-menu');
  const authButtons = $('.auth-buttons');
  
  if (!userMenu) return;
  
  const avatarEl = $('.user-avatar', userMenu);
  const nameEl = $('.user-name', userMenu);
  
  if (user) {
    if (authButtons) authButtons.classList.add('hidden');
    userMenu.classList.remove('hidden');
    
    const profile = user.profile;
    const displayName = profile?.name || user.displayName || user.email;
    const photoURL = profile?.avatar_url || user.photoURL;
    
    if (avatarEl) {
      if (photoURL) {
        avatarEl.innerHTML = `<img src="${photoURL}" alt="${displayName}">`;
      } else {
        const initials = getInitials(displayName);
        avatarEl.innerHTML = `<img src="https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=009900&textColor=ffffff" alt="${displayName}">`;
      }
    }
    
    if (nameEl) nameEl.textContent = displayName;
  } else {
    if (authButtons) authButtons.classList.remove('hidden');
    userMenu.classList.add('hidden');
  }
}

function setupAuth() {
  const signOutBtn = $('#sign-out-btn');
  const userMenu = $('.user-menu');
  const googleBtn = $('.btn-google-auth');
  
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await signOut();
      window.location.href = '/';
    });
  }
  
  const dropdown = userMenu?.querySelector('.dropdown');
  if (dropdown) {
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });
    
    document.addEventListener('click', () => {
      dropdown.classList.remove('active');
    });
  }
  
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      await signInWithGoogle();
    });
  }
}

function setupRealtime() {
  subscribeToEvents((update) => {
    if (document.body.dataset.page === 'home' || document.body.dataset.page === 'events') {
      refreshEventsList();
    }
  });
}

async function refreshEventsList() {
  const eventGrid = $('.event-grid');
  if (!eventGrid) return;
  
  eventGrid.innerHTML = Array(6).fill(renderEventCardSkeleton()).join('');
  
  const { fetchEvents: fetch } = await import('./events.js');
  const { data } = await fetch();
  
  if (data.length === 0) {
    eventGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <h3 class="empty-state-title">No events yet</h3>
        <p class="empty-state-text">Be the first to create an event!</p>
        <a href="/create-event.html" class="btn btn-primary">Create Event</a>
      </div>
    `;
  } else {
    eventGrid.innerHTML = data.map(event => renderEventCard(event)).join('');
  }
}

async function initHomePage() {
  try {
    await Promise.all([
      loadFeaturedEvent(),
      loadStats(),
      loadEvents(),
      loadCategories()
    ]);
  } catch (error) {
    console.error('Error loading home page:', error);
  }
}

let featuredEvents = [];
let currentEventIndex = 0;
let featuredEventInterval = null;

function renderFeaturedEvent(event, animated = false) {
  const featuredSection = $('.featured-event');
  if (!featuredSection || !event) return;
  
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
  
  const imageUrl = event.image_url || '';
  const bgStyle = imageUrl 
    ? `background-image: url('${imageUrl}'), linear-gradient(135deg, rgba(0,153,0,0.92) 0%, rgba(0,100,0,0.96) 100%); background-blend-mode: overlay; background-size: cover; background-position: center;`
    : `background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);`;
  
  const animationClass = animated ? 'featured-event-fade' : '';
  
  featuredSection.innerHTML = `
    <div class="hero-section featured-event-slide ${animationClass}" style="${bgStyle}; transition: opacity 0.5s ease-in-out;">
      <div class="container" style="position: relative; z-index: 1;">
        <div class="hero-content">
          <span class="badge badge-accent" style="background-color: var(--accent); color: #000; margin-bottom: var(--space-4);">Upcoming Event</span>
          <h1 class="hero-title">${event.title}</h1>
          <p class="hero-text">${event.description?.substring(0, 150)}${event.description?.length > 150 ? '...' : ''}</p>
          <div style="display: flex; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-4);">
            <div style="display: flex; align-items: center; gap: var(--space-2);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>${formattedDate}</span>
            </div>
            <div style="display: flex; align-items: center; gap: var(--space-2);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span>${event.location_name}</span>
            </div>
          </div>
          <a href="/event.html?id=${event.id}" class="btn btn-white btn-lg">View Event</a>
        </div>
      </div>
    </div>
  `;
}

function showNextFeaturedEvent() {
  if (featuredEvents.length <= 1) return;
  
  const featuredSection = $('.featured-event');
  const currentSlide = $('.featured-event-slide');
  
  if (currentSlide) {
    currentSlide.style.opacity = '0';
    currentSlide.style.transform = 'scale(1.05)';
  }
  
  setTimeout(() => {
    currentEventIndex = (currentEventIndex + 1) % featuredEvents.length;
    const event = featuredEvents[currentEventIndex];
    
    if (event) {
      renderFeaturedEventSlide(event);
    }
  }, 400);
}

function renderFeaturedEventSlide(event) {
  const featuredSection = $('.featured-event');
  if (!featuredSection || !event) return;
  
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
  
  const imageUrl = event.image_url || '';
  const bgStyle = imageUrl 
    ? `background-image: url('${imageUrl}'), linear-gradient(135deg, rgba(0,153,0,0.92) 0%, rgba(0,100,0,0.96) 100%); background-blend-mode: overlay; background-size: cover; background-position: center;`
    : `background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);`;
  
  featuredSection.innerHTML = `
    <div class="hero-section featured-event-slide" style="${bgStyle}; animation: featuredZoomFade 0.8s ease-out forwards;">
      <div class="container" style="position: relative; z-index: 1;">
        <div class="hero-content">
          <span class="badge badge-accent" style="background-color: var(--accent); color: #000; margin-bottom: var(--space-4);">Upcoming Event</span>
          <h1 class="hero-title">${event.title}</h1>
          <p class="hero-text">${event.description?.substring(0, 150)}${event.description?.length > 150 ? '...' : ''}</p>
          <div style="display: flex; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-4);">
            <div style="display: flex; align-items: center; gap: var(--space-2);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>${formattedDate}</span>
            </div>
            <div style="display: flex; align-items: center; gap: var(--space-2);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span>${event.location_name}</span>
            </div>
          </div>
          <a href="/event.html?id=${event.id}" class="btn btn-white btn-lg">View Event</a>
        </div>
      </div>
    </div>
  `;
}

async function loadFeaturedEvent() {
  const featuredSection = $('.featured-event');
  if (!featuredSection) return;
  
  try {
    const { fetchEvents } = await import('./events.js');
    const { data: events } = await fetchEvents({ sort: 'upcoming', limit: 5 });
    
    featuredEvents = events || [];
    
    if (featuredEvents.length === 0) {
      featuredSection.innerHTML = `
        <div class="hero-section">
          <div class="container">
            <div class="hero-content">
              <h1 class="hero-title">Discover Campus Events</h1>
              <p class="hero-text">Find and connect with amazing events happening at Makerere University.</p>
              <div class="hero-stats">
                <div>
                  <div class="hero-stat-value">0</div>
                  <div class="hero-stat-label">Upcoming Events</div>
                </div>
                <div>
                  <div class="hero-stat-value">0</div>
                  <div class="hero-stat-label">RSVPs</div>
                </div>
                <div>
                  <div class="hero-stat-value">0</div>
                  <div class="hero-stat-label">Community</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }
    
    currentEventIndex = 0;
    const featuredSection = $('.featured-event');
    renderFeaturedEventSlide(featuredEvents[0]);
    featuredSection.querySelector('.featured-event-slide').style.animation = 'featuredZoomFade 0.8s ease-out forwards';
    
    if (featuredEvents.length > 1) {
      if (featuredEventInterval) clearInterval(featuredEventInterval);
      featuredEventInterval = setInterval(showNextFeaturedEvent, 12000);
    }
  } catch (error) {
    console.error('Error loading featured event:', error);
  }
}

async function loadStats() {
  const statsGrid = $('.landing-stats');
  if (!statsGrid) return;
  
  try {
    const stats = await getEventStats();
    
    statsGrid.innerHTML = `
      <div class="landing-stat-card animate-in stagger-1">
        <div class="landing-stat-value">${stats.events}</div>
        <div class="landing-stat-label">Upcoming Events</div>
      </div>
      <div class="landing-stat-card animate-in stagger-2">
        <div class="landing-stat-value">${stats.rsvps}</div>
        <div class="landing-stat-label">Total RSVPs</div>
      </div>
      <div class="landing-stat-card animate-in stagger-3">
        <div class="landing-stat-value">${stats.users}</div>
        <div class="landing-stat-label">Community Members</div>
      </div>
      <div class="landing-stat-card animate-in stagger-4">
        <div class="landing-stat-value">8</div>
        <div class="landing-stat-label">Categories</div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadEvents() {
  const eventGrid = $('.event-grid');
  if (!eventGrid) return;
  
  try {
    eventGrid.innerHTML = Array(6).fill(renderEventCardSkeleton()).join('');
    
    const { data: events } = await fetchEvents({ sort: 'upcoming' });
    
    if (events.length === 0) {
      eventGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <h3 class="empty-state-title">No events yet</h3>
          <p class="empty-state-text">Be the first to create an event and bring the community together!</p>
          <a href="/create-event.html" class="btn btn-primary">Create Event</a>
        </div>
      `;
      return;
    }
    
    eventGrid.innerHTML = events.map(event => renderEventCard(event)).join('');
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

async function loadCategories() {
  const categoryGrid = $('.category-grid');
  if (!categoryGrid) return;
  
  try {
    const categories = await fetchCategories();
    
    const icons = {
      book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
      music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
      trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
      briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
      heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>'
    };
    
    categoryGrid.innerHTML = categories.map((cat, index) => `
      <a href="/events.html?category=${cat.id}" class="category-card animate-in stagger-${index + 1}">
        <div class="category-card-icon" style="background-color: ${cat.color}20; color: ${cat.color};">
          ${icons[cat.icon] || icons.book}
        </div>
        <div class="category-card-name">${cat.name}</div>
        <div class="category-card-count">${cat.count} events</div>
      </a>
    `).join('');
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

async function initEventsPage() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category') || 'all';
  const sort = params.get('sort') || 'upcoming';
  
  const categoryPills = $('.category-pills');
  if (categoryPills) {
    $$('.category-pill', categoryPills).forEach(pill => {
      pill.classList.toggle('active', pill.dataset.category === category);
    });
    
    categoryPills.addEventListener('click', async (e) => {
      const pill = e.target.closest('.category-pill');
      if (!pill) return;
      
      const newCategory = pill.dataset.category;
      params.set('category', newCategory);
      window.location.search = params.toString();
    });
  }
  
  const sortSelect = $('.sort-select');
  if (sortSelect) {
    sortSelect.value = sort;
    sortSelect.addEventListener('change', () => {
      params.set('sort', sortSelect.value);
      window.location.search = params.toString();
    });
  }
  
  await loadEventsWithFilters(category, sort);
}

async function loadEventsWithFilters(category, sort) {
  const eventGrid = $('.event-grid');
  if (!eventGrid) return;
  
  eventGrid.innerHTML = Array(6).fill(renderEventCardSkeleton()).join('');
  
  const { data: events } = await fetchEvents({ category, sort });
  
  if (events.length === 0) {
    eventGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <h3 class="empty-state-title">No events found</h3>
        <p class="empty-state-text">Try a different category or check back later.</p>
        <a href="/create-event.html" class="btn btn-primary">Create Event</a>
      </div>
    `;
    return;
  }
  
  eventGrid.innerHTML = events.map(event => renderEventCard(event)).join('');
}

async function initEventDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');
  
  if (!eventId) {
    window.location.href = '/events.html';
    return;
  }
  
  await loadEventDetails(eventId);
}

async function loadEventDetails(eventId) {
  const { fetchEvent } = await import('./events.js');
  const { getUserRSVP, fetchEventRSVPs, renderRSVPButtons, renderRSVPCounts, renderAttendee } = await import('./rsvp.js');
  const { fetchComments, addComment, renderCommentsList, renderCommentForm, subscribeToComments, deleteComment } = await import('./comments.js');
  const { subscribeToRSVPs, animateCounter } = await import('./realtime.js');
  const { getCurrentUser } = await import('./auth.js');
  const { formatDate, formatTime, getCategoryColor, isUpcoming } = await import('./utils.js');
  
  const { data: event, error } = await fetchEvent(eventId);
  
  if (error || !event) {
    $('.event-detail-content').innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3 class="empty-state-title">Event not found</h3>
        <p class="empty-state-text">This event may have been removed or doesn't exist.</p>
        <a href="/events.html" class="btn btn-primary">Browse Events</a>
      </div>
    `;
    return;
  }
  
  const categoryStyle = getCategoryColor(event.category);
  const upcoming = isUpcoming(event.date);
  const user = await getCurrentUser();
  const userRSVP = await getUserRSVP(eventId);
  
  document.title = `${event.title} | MUK Events`;
  
  const heroSection = $('.event-detail-hero');
  if (heroSection && event.image_url) {
    heroSection.innerHTML = `
      <img src="${event.image_url}" alt="${event.title}">
      <div class="event-detail-hero-overlay"></div>
    `;
  } else if (heroSection) {
    heroSection.style.background = `linear-gradient(135deg, ${categoryStyle.bg} 0%, ${categoryStyle.text}20 100%)`;
  }
  
  const contentSection = $('.event-detail-content');
  contentSection.innerHTML = `
    <div class="container">
      <nav class="breadcrumb">
        <a href="/">Home</a>
        <span class="breadcrumb-separator">/</span>
        <a href="/events.html">Events</a>
        <span class="breadcrumb-separator">/</span>
        <span>${event.title}</span>
      </nav>
      
      <div class="two-column-layout">
        <div class="main-column">
          <div class="event-detail-header">
            <span class="badge" style="background-color: ${categoryStyle.bg}; color: ${categoryStyle.text}; margin-bottom: var(--space-4);">
              ${event.category}
            </span>
            <h1 class="event-detail-title">${event.title}</h1>
            
            <div class="event-detail-meta">
              <div class="event-detail-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>${formatDate(event.date)}</span>
              </div>
              <div class="event-detail-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>${formatTime(event.time)}</span>
              </div>
              <div class="event-detail-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span>${event.location_name}</span>
              </div>
            </div>
          </div>
          
          <div class="event-detail-actions">
            <div class="rsvp-buttons" id="rsvp-buttons">
              ${user ? renderRSVPButtons(userRSVP?.status) : `
                <a href="/auth.html?redirect=/event.html?id=${eventId}" class="btn btn-primary">Sign in to RSVP</a>
              `}
            </div>
            ${renderRSVPCounts({ going: event.going_count || 0, interested: event.interested_count || 0 })}
          </div>
          
          <div class="event-tabs">
            <button class="event-tab active" data-tab="about">About</button>
            <button class="event-tab" data-tab="comments">Comments</button>
            <button class="event-tab" data-tab="attendees">Attendees</button>
          </div>
          
          <div class="event-tab-content active" id="tab-about">
            <h3 style="margin-bottom: var(--space-4);">About This Event</h3>
            <p style="white-space: pre-wrap; line-height: 1.8;">${event.description || 'No description provided.'}</p>
            
            ${event.organizations?.length ? `
              <div style="margin-top: var(--space-8);">
                <h4 style="margin-bottom: var(--space-3);">Organized by</h4>
                <div class="org-list">
                  ${event.organizations.map(org => `
                    <span class="org-tag">
                      ${org.logo_url ? `<img src="${org.logo_url}" alt="${org.name}" style="width: 20px; height: 20px; border-radius: 4px;">` : ''}
                      ${org.name}
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          
          <div class="event-tab-content" id="tab-comments">
            ${user ? renderCommentForm() : `
              <p style="text-align: center; padding: var(--space-6); background: var(--background); border-radius: var(--radius);">
                <a href="/auth.html?redirect=/event.html?id=${eventId}" style="color: var(--primary); font-weight: 500;">Sign in</a> to leave a comment.
              </p>
            `}
            <div class="comments-list" id="comments-list">
              Loading comments...
            </div>
          </div>
          
          <div class="event-tab-content" id="tab-attendees">
            <div class="attendee-grid" id="attendee-grid">
              Loading attendees...
            </div>
          </div>
        </div>
        
        <aside class="sidebar">
          <div class="sidebar-card">
            <h4 class="sidebar-title">Event Details</h4>
            <div style="display: flex; flex-direction: column; gap: var(--space-4);">
              ${event.capacity ? `
                <div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: var(--space-1);">Capacity</div>
                  <div>${event.capacity} people</div>
                </div>
              ` : ''}
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: var(--space-1);">Organizer</div>
                <div style="display: flex; align-items: center; gap: var(--space-2);">
                  ${event.profiles?.avatar_url ? 
                    `<div class="avatar avatar-sm"><img src="${event.profiles.avatar_url}" alt="${event.profiles.name}"></div>` :
                    event.organizer_name ? 
                      `<div class="avatar avatar-sm"><span>${event.organizer_name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span></div>` :
                      `<div class="avatar avatar-sm"><span>U</span></div>`
                  }
                  <span>${event.profiles?.name || event.organizer_name || 'Unknown'}</span>
                </div>
              </div>
              ${event.contact_email ? `
                <div style="margin-top: var(--space-3);">
                  <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: var(--space-1);">Contact</div>
                  <a href="mailto:${event.contact_email}" style="font-size: 0.875rem; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-envelope"></i>${event.contact_email}</a>
                </div>
              ` : ''}
              <div style="margin-top: var(--space-3);">
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: var(--space-1);">Share</div>
                <div style="display: flex; gap: 8px;">
                  <a href="https://wa.me/?text=${encodeURIComponent(event.title + ' - ' + window.location.href)}" target="_blank" rel="noopener" class="btn btn-icon btn-sm" title="Share on WhatsApp" style="background: #25D366; color: white;">
                    <i class="fab fa-whatsapp"></i>
                  </a>
                  <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(window.location.href)}" target="_blank" rel="noopener" class="btn btn-icon btn-sm" title="Share on X" style="background: #000; color: white;">
                    <i class="fab fa-x-twitter"></i>
                  </a>
                  <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}" target="_blank" rel="noopener" class="btn btn-icon btn-sm" title="Share on LinkedIn" style="background: #0077B5; color: white;">
                    <i class="fab fa-linkedin"></i>
                  </a>
                  <button class="btn btn-icon btn-sm" title="Copy link" onclick="navigator.clipboard.writeText(window.location.href); alert('Link copied!')" style="background: var(--gray-600); color: white;">
                    <i class="fas fa-link"></i>
                  </button>
                </div>
              </div>
              ${event.location_coordinates ? `
                <div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: var(--space-1);">Map</div>
                  <a href="https://maps.google.com/?q=${event.location_coordinates.lat},${event.location_coordinates.lng}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">
                    Open in Maps
                  </a>
                </div>
              ` : ''}
            </div>
          </div>
        </aside>
      </div>
    </div>
  `;
  
  setupTabs();
  
  if (user) {
    const rsvpBtns = $('#rsvp-buttons');
    rsvpBtns?.addEventListener('click', async (e) => {
      const btn = e.target.closest('.rsvp-btn');
      if (!btn) return;
      
      const status = btn.dataset.status;
      const { toggleRSVP } = await import('./rsvp.js');
      const result = await toggleRSVP(eventId, status);
      
      if (!result.error) {
        const buttons = $('#rsvp-buttons');
        if (buttons) {
          const { renderRSVPButtons } = await import('./rsvp.js');
          const newRSVP = await getUserRSVP(eventId);
          buttons.innerHTML = renderRSVPButtons(newRSVP?.status);
        }
      }
    });
  }
  
  const { data: comments } = await fetchComments(eventId);
  const commentsList = $('#comments-list');
  if (commentsList) {
    commentsList.innerHTML = renderCommentsList(comments, user?.id);
  }
  
  if (user) {
    const commentForm = $('#comment-form');
    const commentInput = $('#comment-input');
    const charCounter = $('#char-counter');
    
    if (commentInput && charCounter) {
      commentInput.addEventListener('input', () => {
        const count = commentInput.value.length;
        charCounter.textContent = `${count}/500`;
        charCounter.className = 'char-counter' + (count > 450 ? ' warning' : '') + (count >= 500 ? ' error' : '');
      });
    }
    
    commentForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const content = commentInput.value.trim();
      if (!content) return;
      
      const submitBtn = $('#submit-comment');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting...';
      
      const result = await addComment(eventId, content);
      
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post Comment';
      
      if (!result.error && result.data) {
        commentInput.value = '';
        charCounter.textContent = '0/500';
        
        const { data: updatedComments } = await fetchComments(eventId);
        commentsList.innerHTML = renderCommentsList(updatedComments, user.id);
      }
    });
    
    commentsList?.addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('.delete-comment');
      if (!deleteBtn) return;
      
      const commentId = deleteBtn.dataset.commentId;
      await deleteComment(eventId, commentId);
      
      const { data: updatedComments } = await fetchComments(eventId);
      commentsList.innerHTML = renderCommentsList(updatedComments, user?.id);
    });
  }
  
  const { data: rsvps } = await fetchEventRSVPs(eventId);
  const attendeeGrid = $('#attendee-grid');
  if (attendeeGrid) {
    if (rsvps.length === 0) {
      attendeeGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: var(--space-8);">
          <p class="empty-state-text">No RSVPs yet. Be the first to RSVP!</p>
        </div>
      `;
    } else {
      attendeeGrid.innerHTML = rsvps.map(rsvp => renderAttendee(rsvp)).join('');
    }
  }
  
  subscribeToRSVPs(eventId, (counts) => {
    const goingCount = $('.going-count');
    const interestedCount = $('.interested-count');
    
    if (goingCount) animateCounter(goingCount, counts.going);
    if (interestedCount) animateCounter(interestedCount, counts.interested);
  });
  
  subscribeToComments(eventId, async (update) => {
    const { data: updatedComments } = await fetchComments(eventId);
    commentsList.innerHTML = renderCommentsList(updatedComments, user?.id);
  });
}

function setupTabs() {
  const tabs = $$('.event-tab');
  const contents = $$('.event-tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      $(`#tab-${tabName}`)?.classList.add('active');
    });
  });
}

async function initCreateEventPage() {
  setupEventForm();
}

function setupEventForm() {
  const form = $('#create-event-form');
  if (!form) return;
  
  const imageInput = $('#event-image');
  const imagePreview = $('#image-preview');
  const imageUpload = $('.file-upload');
  
  imageUpload?.addEventListener('click', () => imageInput?.click());
  
  imageInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be less than 2MB', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.innerHTML = `
        <div class="file-upload-preview">
          <img src="${e.target.result}" alt="Preview">
          <button type="button" class="file-upload-remove" id="remove-image">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      `;
      
      $('#remove-image')?.addEventListener('click', () => {
        imageInput.value = '';
        imagePreview.innerHTML = '';
      });
    };
    reader.readAsDataURL(file);
  });
  
  const descriptionInput = $('#event-description');
  const charCounter = $('#description-counter');
  
  descriptionInput?.addEventListener('input', () => {
    const count = descriptionInput.value.length;
    charCounter.textContent = `${count}/2000`;
    charCounter.className = 'char-counter' + (count > 1800 ? ' warning' : '') + (count >= 2000 ? ' error' : '');
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
    submitBtn.classList.add('btn-loading');
    
    const formData = new FormData(form);
    const eventData = {
      title: formData.get('title'),
      description: formData.get('description'),
      date: formData.get('date'),
      time: formData.get('time'),
      location_name: formData.get('location_name'),
      category: formData.get('category'),
      capacity: formData.get('capacity') ? parseInt(formData.get('capacity')) : null
    };
    
    const imageFile = imageInput?.files?.[0];
    let imageUrl = null;
    
    if (imageFile) {
      const { uploadEventImage } = await import('./storage.js');
      const { data: imageData, error: uploadError } = await uploadEventImage(imageFile);
      
      if (uploadError) {
        showToast('Failed to upload image', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Event';
        submitBtn.classList.remove('btn-loading');
        return;
      }
      
      imageUrl = imageData.publicUrl;
    }
    
    if (imageUrl) {
      eventData.image_url = imageUrl;
    }
    
    const { createEvent } = await import('./events.js');
    const { data, error } = await createEvent(eventData);
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Event';
    submitBtn.classList.remove('btn-loading');
    
    if (!error && data) {
      window.location.href = `/event.html?id=${data.id}`;
    }
  });
}

async function initProfilePage() {
  const { isAuthenticated, getCurrentUser } = await import('./auth.js');
  const user = await getCurrentUser();
  
  if (!user) {
    window.location.href = '/auth.html?redirect=/profile.html';
    return;
  }
  
  await loadProfile(user);
  await loadUserEvents(user.id);
  await loadUserRSVPs(user.id);
}

async function loadProfile(user) {
  const profileSection = $('.profile-header');
  if (!profileSection) return;
  
  const profile = user.profile || {};
  const displayName = profile.name || user.displayName || 'User';
  const avatarUrl = profile.avatar_url || user.photoURL;
  
  const initials = getInitials(displayName);
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=009900&textColor=ffffff`;
  const finalAvatar = avatarUrl || defaultAvatar;
  
  profileSection.innerHTML = `
    <div class="profile-avatar">
      <div class="avatar avatar-xl" id="profile-avatar-img">
        ${avatarUrl ? 
          `<img src="${finalAvatar}" alt="${displayName}">` :
          `<img src="${defaultAvatar}" alt="${displayName}">`
        }
      </div>
      <button class="btn btn-ghost btn-sm" id="change-avatar-btn" style="margin-top: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
        </svg>
        Change Photo
      </button>
      <input type="file" id="avatar-input" accept="image/*" style="display: none;">
    </div>
    <div class="profile-info">
      <h1 class="profile-name">${displayName}</h1>
      <span class="badge badge-${profile.role === 'admin' ? 'primary' : profile.role === 'organizer' ? 'warning' : 'info'} profile-role">
        ${profile.role || 'student'}
      </span>
      <div class="profile-meta">
        ${profile.faculty ? `
          <span class="profile-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5"/>
            </svg>
            ${profile.faculty}
          </span>
        ` : ''}
        ${profile.hall ? `
          <span class="profile-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            ${profile.hall}
          </span>
        ` : ''}
        <span class="profile-meta-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
          ${user.email}
        </span>
      </div>
    </div>
  `;
}

async function loadUserEvents(userId) {
  const eventsList = $('#my-events-list');
  if (!eventsList) return;
  
  const { fetchUserEvents, renderEventCard } = await import('./events.js');
  const { data: events } = await fetchUserEvents(userId);
  
  if (events.length === 0) {
    eventsList.innerHTML = `
      <div class="empty-state" style="padding: var(--space-8);">
        <p class="empty-state-text">You haven't created any events yet.</p>
        <a href="/create-event.html" class="btn btn-primary mt-4">Create Event</a>
      </div>
    `;
  } else {
    eventsList.innerHTML = events.map(event => renderEventCard(event, true)).join('');
    attachCardEventListeners();
  }
}

async function attachCardEventListeners() {
  document.querySelectorAll('.btn-delete-event').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const eventId = btn.dataset.id;
      if (confirm('Are you sure you want to delete this event?')) {
        const { deleteEvent } = await import('./events.js');
        const { error } = await deleteEvent(eventId);
        if (!error) {
          const user = await getCurrentUser();
          if (user) {
            loadUserEvents(user.id);
          }
        }
      }
    });
  });
}

async function loadUserRSVPs(userId) {
  const rsvpsList = $('#attending-list');
  if (!rsvpsList) return;
  
  const { fetchUserRSVPs } = await import('./rsvp.js');
  const { data: rsvps } = await fetchUserRSVPs(userId);
  
  if (rsvps.length === 0) {
    rsvpsList.innerHTML = `
      <div class="empty-state" style="padding: var(--space-8);">
        <p class="empty-state-text">You haven't RSVP'd to any events yet.</p>
        <a href="/events.html" class="btn btn-primary mt-4">Browse Events</a>
      </div>
    `;
  } else {
    const { renderEventCard } = await import('./events.js');
    rsvpsList.innerHTML = rsvps.map(rsvp => renderEventCard({ id: rsvp.event_id, ...rsvp })).join('');
  }
}

async function initAuthPage() {
  const params = new URLSearchParams(window.location.search);
  const isSignUp = params.get('mode') === 'signup';
  
  const signUpForm = $('#signup-form');
  const signInForm = $('#signin-form');
  
  if (isSignUp) {
    signUpForm?.classList.remove('hidden');
    signInForm?.classList.add('hidden');
  } else {
    signUpForm?.classList.add('hidden');
    signInForm?.classList.remove('hidden');
  }
  
  signInForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = $('#signin-email').value;
    const password = $('#signin-password').value;
    
    const { signIn } = await import('./auth.js');
    const result = await signIn(email, password);
    
    if (!result.error) {
      const redirect = params.get('redirect') || '/';
      window.location.href = redirect;
    }
  });
  
  signUpForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = $('#signup-name').value;
    const email = $('#signup-email').value;
    const password = $('#signup-password').value;
    const role = $('#signup-role').value;
    
    const { signUp } = await import('./auth.js');
    const result = await signUp(email, password, name, role);
    
    if (!result.error) {
      showToast('Account created! Please check your email to verify.', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  });
}

document.addEventListener('DOMContentLoaded', initApp);
