import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyBt-iJiEOWO205mW0Y3p6EZo-LBeQnFjRw",
  authDomain: "muk-luma.firebaseapp.com",
  projectId: "muk-luma",
  databaseURL: "https://muk-luma-default-rtdb.firebaseio.com",
  storageBucket: "muk-luma.firebasestorage.app",
  messagingSenderId: "208451460846",
  appId: "1:208451460846:web:de36f0cc2de1e8d7541dff"
};

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

export const CLOUDINARY = {
  cloudName: "dkh8e8upn",
  apiKey: "718983743444877",
  apiSecret: "TxNIR4uWK-SUHxzmeKzhM20u44U",
  uploadPreset: "muk-luma"
};

export const SUPABASE = {
  url: "https://jtdxrptvcvlwfsevtnku.supabase.co",
  anonKey: "sb_publishable_ASGMf11qs_jT5q9IJ67Hog_Hu5QorCr"
};

export const AWS = {
  bucket: "muk-luma-events",
  region: "us-east-1",
  accessKeyId: "66c1a22c58ed225d0f95c919d248d7e4",
  secretAccessKey: "627af8e4450e5f25c8c8481d9dca5d90d6f17ea67bf91b4ed5d1f5a7b9358d7a"
};
