import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    // Check if we have the required environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('Firebase Admin SDK environment variables not found. Using default app initialization.');
      // Initialize with default credentials (for development)
      initializeApp();
    } else {
      // Initialize with service account credentials
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    // Fallback to default initialization
    initializeApp();
  }
}

export const auth = getAuth();
export const adminDb = getFirestore();
// Back-compat alias for modules importing { db } from this file
export const db = adminDb;