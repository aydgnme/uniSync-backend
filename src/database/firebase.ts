import admin from 'firebase-admin';
import { initializeFirebase } from '../config/firebase.config';

let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

export async function initializeFirebaseServices() {
  const app = await initializeFirebase();
  db = app.firestore();
  auth = app.auth();
}

export function getFirestore() {
  if (!db) {
    throw new Error('Firebase services not initialized. Call initializeFirebaseServices() first.');
  }
  return db;
}

export function getAuth() {
  if (!auth) {
    throw new Error('Firebase services not initialized. Call initializeFirebaseServices() first.');
  }
  return auth;
}
