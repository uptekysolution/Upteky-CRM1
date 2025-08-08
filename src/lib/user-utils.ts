import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function createUserProfile(userId: string, userData: UserProfile) {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return false;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserRole(userId: string, role: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { role, updatedAt: new Date() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
}

// Helper function to create the test user for harsh1@upteky.com
export async function createTestUser() {
  const testUserId = 'test-user-harsh'; // You can use a specific UID or generate one
  const userData: UserProfile = {
    firstName: 'harsh',
    lastName: 'raval',
    email: 'harsh1@upteky.com',
    role: 'HR',
  };
  
  return await createUserProfile(testUserId, userData);
} 