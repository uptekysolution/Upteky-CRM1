import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as serviceAccount from '../../serviceAccountKey.json';

let app: App;

try {
  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert(serviceAccount as any),
      projectId: (serviceAccount as any).project_id,
    });
    console.log('Firebase Admin initialized successfully');
  } else {
    app = getApps()[0];
    console.log('Firebase Admin already initialized');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  throw error;
}

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };