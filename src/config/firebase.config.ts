import { initializeApp, getApps, cert } from 'firebase-admin/app';
import * as admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import path from 'path';

let firebaseApp: admin.app.App | undefined;

export async function initializeFirebase() {
  if (!firebaseApp) {
    const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
    const rawData = await readFile(serviceAccountPath, 'utf-8');
    const serviceAccount = JSON.parse(rawData);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  return firebaseApp;
}
