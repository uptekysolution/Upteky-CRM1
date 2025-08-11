import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as serviceAccount from '../../serviceAccountKey.json';

let app: App;

try {
  console.log('Initializing Firebase Admin...');
  console.log('Service account project_id:', (serviceAccount as any).project_id);
  
  // Validate service account key
  if (!(serviceAccount as any).project_id) {
    throw new Error('Invalid service account key: missing project_id');
  }
  
  if (!(serviceAccount as any).private_key) {
    throw new Error('Invalid service account key: missing private_key');
  }
  
  if (!(serviceAccount as any).client_email) {
    throw new Error('Invalid service account key: missing client_email');
  }
  
  console.log('Service account key validation passed');
  
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

console.log('Firebase Admin setup complete');

export { db, auth };