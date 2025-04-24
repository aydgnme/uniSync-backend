import { initializeApp, getApps } from 'firebase-admin/app';
import * as admin from 'firebase-admin';
import path from 'path';

export function initializeFirebase() {
  if (!getApps().length) {
    const serviceAccount = require(path.join(__dirname, '../../serviceAccountKey.json'));
    
    initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} 