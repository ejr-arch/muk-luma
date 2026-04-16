import { 
  ref, get, onValue, onChildAdded, onChildChanged, onChildRemoved
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getFirebaseDb } from './config.js';

const subscriptions = new Map();

export async function subscribeToRSVPs(eventId, onUpdate) {
  const db = getFirebaseDb();
  const channelName = `rsvps:${eventId}`;
  
  if (subscriptions.has(channelName)) {
    return subscriptions.get(channelName);
  }
  
  const rsvpsRef = ref(db, `events/${eventId}/rsvps`);
  
  const unsubscribe = onValue(rsvpsRef, async () => {
    const counts = await getRSVPCountsFromDB(eventId);
    onUpdate(counts);
  });
  
  subscriptions.set(channelName, unsubscribe);
  
  return unsubscribe;
}

export async function unsubscribeFromRSVPs(eventId) {
  const channelName = `rsvps:${eventId}`;
  
  const unsubscribe = subscriptions.get(channelName);
  if (unsubscribe) {
    unsubscribe();
    subscriptions.delete(channelName);
  }
}

async function getRSVPCountsFromDB(eventId) {
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

export function animateCounter(element, newValue) {
  const currentValue = parseInt(element.textContent) || 0;
  const diff = newValue - currentValue;
  const duration = 300;
  const steps = 20;
  const stepDuration = duration / steps;
  const stepValue = diff / steps;
  
  let step = 0;
  
  const animate = () => {
    step++;
    const value = Math.round(currentValue + (stepValue * step));
    element.textContent = value;
    
    if (step < steps) {
      setTimeout(animate, stepDuration);
    } else {
      element.textContent = newValue;
    }
  };
  
  animate();
}

export function subscribeToEvents(onUpdate) {
  const db = getFirebaseDb();
  
  const eventsRef = ref(db, 'events');
  
  const unsubscribeAdded = onChildAdded(eventsRef, (snapshot) => {
    const data = { id: snapshot.key, ...snapshot.val() };
    onUpdate({ type: 'INSERT', data });
  });
  
  const unsubscribeChanged = onChildChanged(eventsRef, (snapshot) => {
    const data = { id: snapshot.key, ...snapshot.val() };
    onUpdate({ type: 'UPDATE', data });
  });
  
  const unsubscribeRemoved = onChildRemoved(eventsRef, (snapshot) => {
    const data = { id: snapshot.key };
    onUpdate({ type: 'DELETE', data });
  });
  
  return () => {
    unsubscribeAdded();
    unsubscribeChanged();
    unsubscribeRemoved();
  };
}

export function subscribeToProfile(userId, onUpdate) {
  const db = getFirebaseDb();
  
  const userRef = ref(db, `users/${userId}`);
  
  const unsubscribe = onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate({ id: snapshot.key, ...snapshot.val() });
    }
  });
  
  return unsubscribe;
}

export function cleanupAllSubscriptions() {
  subscriptions.forEach((unsubscribe) => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  });
  
  subscriptions.clear();
}
