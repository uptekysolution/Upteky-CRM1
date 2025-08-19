import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import serviceAccount from '../../serviceAccountKey.json';

let app: App;

try {
  console.log('Initializing Firebase Admin...');
  const sa: any = (serviceAccount as any)?.default ?? (serviceAccount as any);
  console.log('Service account project_id:', sa?.project_id);
  
  // Validate service account key
  if (!sa?.project_id) {
    throw new Error('Invalid service account key: missing project_id');
  }
  
  if (!sa?.private_key) {
    throw new Error('Invalid service account key: missing private_key');
  }
  
  if (!sa?.client_email) {
    throw new Error('Invalid service account key: missing client_email');
  }
  
  console.log('Service account key validation passed');
  
  if (getApps().length === 0) {
    const key = { ...sa, private_key: String(sa.private_key) };
    app = initializeApp({
      credential: cert(key as any),
      projectId: sa.project_id,
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