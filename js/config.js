import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

let FIREBASE_CONFIG, CLOUDINARY_CONFIG, SUPABASE_CONFIG;

try {
  const local = await import('./config.local.js');
  FIREBASE_CONFIG = local.FIREBASE_CONFIG;
  CLOUDINARY_CONFIG = local.CLOUDINARY_CONFIG;
  SUPABASE_CONFIG = local.SUPABASE_CONFIG;
} catch {
  const firebaseApiKey = import.meta.env?.FIREBASE_API_KEY || 'pk_live_placeholder';
  const firebaseAuthDomain = import.meta.env?.FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com';
  const firebaseProjectId = import.meta.env?.FIREBASE_PROJECT_ID || 'placeholder';
  const firebaseDatabaseURL = import.meta.env?.FIREBASE_DATABASE_URL || 'https://placeholder.firebaseio.com';
  const firebaseStorageBucket = import.meta.env?.FIREBASE_STORAGE_BUCKET || 'placeholder.firebasestorage.app';
  const firebaseMessagingSenderId = import.meta.env?.FIREBASE_MESSAGING_SENDER_ID || '000000000000';
  const firebaseAppId = import.meta.env?.FIREBASE_APP_ID || '1:000000000000:web:placeholder';

  FIREBASE_CONFIG = {
    apiKey: firebaseApiKey,
    authDomain: firebaseAuthDomain,
    projectId: firebaseProjectId,
    databaseURL: firebaseDatabaseURL,
    storageBucket: firebaseStorageBucket,
    messagingSenderId: firebaseMessagingSenderId,
    appId: firebaseAppId
  };

  CLOUDINARY_CONFIG = {
    cloudName: import.meta.env?.CLOUDINARY_CLOUD_NAME || 'placeholder',
    uploadPreset: import.meta.env?.CLOUDINARY_UPLOAD_PRESET || 'placeholder'
  };

  SUPABASE_CONFIG = {
    url: import.meta.env?.SUPABASE_URL || 'https://placeholder.supabase.co',
    anonKey: import.meta.env?.SUPABASE_ANON_KEY || 'placeholder'
  };
}

const firebaseConfig = FIREBASE_CONFIG;

let app = null;
let auth = null;
let database = null;
let storage = null;

export function initFirebase() {
  if (app) return { app, auth, database, storage };
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
  storage = getStorage(app);
  
  return { app, auth, database, storage };
}

export function getFirebaseAuth() {
  if (!auth) initFirebase();
  return auth;
}

export function getFirebaseDb() {
  if (!database) initFirebase();
  return database;
}

export { ref, uploadBytes, getDownloadURL };

export function getFirebaseStorage() {
  if (!storage) initFirebase();
  return storage;
}

export const CLOUDINARY = CLOUDINARY_CONFIG;
export const SUPABASE = SUPABASE_CONFIG;