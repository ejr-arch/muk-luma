import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { ref, get, set, update, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getFirebaseAuth, getFirebaseDb } from './config.js';
import { showToast, validateEmail, $, getInitials } from './utils.js';

let currentUser = null;
let authStateListener = null;

export async function initAuth() {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  
  return new Promise((resolve) => {
    let resolved = false;
    
    const cleanup = () => {
      if (resolved) return;
      resolved = true;
    };
    
    setTimeout(() => {
      cleanup();
      updateAuthUI();
      resolve(currentUser);
    }, 5000);
    
    authStateListener = onAuthStateChanged(auth, async (user) => {
      if (resolved) return;
      if (user) {
        currentUser = user;
        await loadUserProfile();
      } else {
        currentUser = null;
      }
      cleanup();
      updateAuthUI();
      resolve(currentUser);
    });
  });
}

async function loadUserProfile() {
  if (!currentUser) return null;
  
  const db = getFirebaseDb();
  
  try {
    const userRef = ref(db, `users/${currentUser.uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      currentUser.profile = snapshot.val();
    } else {
      currentUser.profile = null;
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    currentUser.profile = null;
  }
  
  return currentUser.profile;
}

export async function getCurrentUser() {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  
  if (!user) return null;
  
  const db = getFirebaseDb();
  
  try {
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    return {
      id: user.uid,
      email: user.email,
      ...user,
      profile: snapshot.exists() ? snapshot.val() : null
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return {
      id: user.uid,
      email: user.email,
      ...user,
      profile: null
    };
  }
}

export function isAuthenticated() {
  return currentUser !== null;
}

export function getUserId() {
  return currentUser?.uid || null;
}

export async function signUp(email, password, name, requestedRole = 'student') {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  
  if (!validateEmail(email)) {
    showToast('Please enter a valid email address', 'error');
    return { error: 'Invalid email' };
  }
  
  if (password.length < 8) {
    showToast('Password must be at least 8 characters', 'error');
    return { error: 'Password too short' };
  }
  
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    showToast('Password must contain at least one uppercase letter and one number', 'error');
    return { error: 'Password too weak' };
  }
  
  if (!name || name.trim().length < 2) {
    showToast('Please enter your full name', 'error');
    return { error: 'Invalid name' };
  }
  
  const allowedDomains = ['students.mak.ac.ug', 'mak.ac.ug', 'mail.mak.ac.ug'];
  const emailDomain = email.split('@')[1]?.toLowerCase();
  const isOrganizerEmail = allowedDomains.some(d => emailDomain === d);
  
  const role = requestedRole === 'organizer' && isOrganizerEmail ? 'organizer' : 'student';
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await firebaseUpdateProfile(user, { displayName: name });
    
    await set(ref(db, `users/${user.uid}`), {
      name: name.trim(),
      email,
      role,
      faculty: null,
      hall: null,
      avatar_url: null,
      email_verified: false,
      createdAt: Date.now(),
      pending_role: requestedRole === 'organizer' && role === 'student' ? 'organizer' : null
    });
    
    if (requestedRole === 'organizer' && role === 'student') {
      showToast('Account created. Organizer status pending admin approval.', 'success');
    } else {
      showToast('Account created successfully!', 'success');
    }
    return { data: user, error: null };
  } catch (error) {
    showToast(error.message || 'Sign up failed', 'error');
    return { data: null, error: error.message };
  }
}

export async function signIn(email, password) {
  const auth = getFirebaseAuth();
  
  if (!validateEmail(email)) {
    showToast('Please enter a valid email address', 'error');
    return { error: 'Invalid email' };
  }
  
  if (!password) {
    showToast('Please enter your password', 'error');
    return { error: 'Password required' };
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    showToast('Welcome back!', 'success');
    return { data: userCredential.user, error: null };
  } catch (error) {
    showToast(error.message || 'Sign in failed', 'error');
    return { data: null, error: error.message };
  }
}

export async function signOut() {
  const auth = getFirebaseAuth();
  
  try {
    await firebaseSignOut(auth);
    showToast('Signed out successfully', 'success');
    return { error: null };
  } catch (error) {
    showToast(error.message || 'Sign out failed', 'error');
    return { error: error.message };
  }
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const provider = new GoogleAuthProvider();
  
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      await set(userRef, {
        name: user.displayName || 'User',
        email: user.email,
        role: 'student',
        faculty: null,
        hall: null,
        avatar_url: user.photoURL,
        createdAt: Date.now()
      });
    }
    
    return { data: user, error: null };
  } catch (error) {
    showToast(error.message || 'Google sign in failed', 'error');
    return { data: null, error: error.message };
  }
}

export async function resetPassword(email) {
  const auth = getFirebaseAuth();
  
  if (!validateEmail(email)) {
    showToast('Please enter a valid email address', 'error');
    return { error: 'Invalid email' };
  }
  
  try {
    await sendPasswordResetEmail(auth, email);
    showToast('Password reset email sent!', 'success');
    return { error: null };
  } catch (error) {
    showToast(error.message || 'Password reset failed', 'error');
    return { error: error.message };
  }
}

export async function updateProfile(updates) {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const user = auth.currentUser;
  
  if (!user) {
    return { error: 'Not authenticated' };
  }
  
  try {
    const userRef = ref(db, `users/${user.uid}`);
    
    if (updates.name) {
      await firebaseUpdateProfile(user, { displayName: updates.name });
    }
    
    await update(userRef, {
      ...updates,
      updatedAt: Date.now()
    });
    
    showToast('Profile updated!', 'success');
    return { data: updates, error: null };
  } catch (error) {
    showToast(error.message || 'Update failed', 'error');
    return { data: null, error: error.message };
  }
}

function updateAuthUI() {
  const authButtons = $('.auth-buttons');
  const userMenu = $('.user-menu');
  
  if (!authButtons || !userMenu) return;
  
  if (currentUser) {
    authButtons.classList.add('hidden');
    userMenu.classList.remove('hidden');
    
    const avatarEl = $('.user-avatar', userMenu);
    const nameEl = $('.user-name', userMenu);
    const dropdownMenu = userMenu.querySelector('.dropdown-menu');
    const profileLink = dropdownMenu?.querySelector('a[href="profile.html"]');
    
    if (avatarEl) {
      const profile = currentUser.profile;
      const displayName = profile?.name || currentUser.displayName || currentUser.email;
      const photoURL = profile?.avatar_url || currentUser.photoURL;
      
      if (photoURL) {
        avatarEl.innerHTML = `<img src="${photoURL}" alt="${displayName}">`;
      } else {
        const initials = getInitials(displayName);
        const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=009900&textColor=ffffff`;
        avatarEl.innerHTML = `<img src="${defaultAvatar}" alt="${displayName}">`;
      }
    }
    
    if (nameEl) {
      const displayName = currentUser.profile?.name || currentUser.displayName || currentUser.email;
      nameEl.textContent = displayName;
    }
    
    if (profileLink) {
      const role = currentUser.profile?.role || 'student';
      
      if (role === 'organizer' || role === 'admin') {
        let dashboardLink = profileLink.nextElementSibling;
        if (!dashboardLink || !dashboardLink.classList.contains('dashboard-link')) {
          dashboardLink = document.createElement('a');
          dashboardLink.href = role === 'admin' ? '/admin.html' : '/dashboard.html';
          dashboardLink.className = 'dropdown-item dashboard-link';
          dashboardLink.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            ${role === 'admin' ? 'Admin Panel' : 'My Dashboard'}
          `;
          profileLink.after(dashboardLink);
        }
      }
      
      if (role === 'admin') {
        let adminLink = dropdownMenu?.querySelector('.admin-link');
        if (!adminLink) {
          adminLink = document.createElement('a');
          adminLink.href = '/admin.html';
          adminLink.className = 'dropdown-item admin-link';
          adminLink.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Admin Panel
          `;
          dropdownMenu?.appendChild(adminLink);
        }
      }
    }
  } else {
    authButtons.classList.remove('hidden');
    userMenu.classList.add('hidden');
  }
}

export function requireAuth() {
  if (!isAuthenticated()) {
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/auth.html?redirect=${returnUrl}`;
    return false;
  }
  return true;
}

export function cleanup() {
  if (authStateListener) {
    authStateListener();
  }
}
