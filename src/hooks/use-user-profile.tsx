'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export type UserProfile = {
  id: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  avatarUrl?: string;
  phone?: string;
};

type UseUserProfileResult = {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error?: string;
};

export function useUserProfile(): UseUserProfileResult {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as any;
          setProfile({ id: snap.id, ...data });
        } else {
          setProfile({ id: user.uid, email: user.email || undefined });
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user: authUser, userProfile: profile, isLoading, error };
}


