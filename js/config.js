import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

import { FIREBASE_CONFIG, CLOUDINARY_CONFIG, SUPABASE_CONFIG } from './config.local.js';

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