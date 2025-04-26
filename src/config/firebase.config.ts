import { initializeApp, getApps, cert } from 'firebase-admin/app';
import * as admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import path from 'path';

export async function initializeFirebase() {
  if (!getApps().length) {
    const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
    const rawData = await readFile(serviceAccountPath, 'utf-8');
    const serviceAccount = JSON.parse(rawData);

    initializeApp({
      credential: cert(serviceAccount)
    });
  }
}
