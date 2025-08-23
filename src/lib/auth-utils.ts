import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

/**
 * Graceful logout function that handles cleanup and prevents permission errors
 */
export async function gracefulLogout(): Promise<void> {
  try {
    // First, clear any session cookies
    await fetch('/api/auth/clearSession', { 
      method: 'POST',
      // Add a timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    });
  } catch (error) {
    // Ignore session clearing errors, continue with logout
    console.warn('Failed to clear session cookies:', error);
  }

  try {
    // Then sign out from Firebase
    await signOut(auth);
  } catch (error) {
    console.error('Firebase signOut error:', error);
    // Even if Firebase signOut fails, we should still redirect
    throw error;
  }
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return !!auth.currentUser;
}

/**
 * Get current user ID safely
 */
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || null;
}

/**
 * Get current user safely
 */
export function getCurrentUser() {
  return auth.currentUser;
}
