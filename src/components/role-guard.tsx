'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getDatabase, ref, get as getFromRealtimeDb } from 'firebase/database';
import { auth, db, app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { UserService as UsersService } from '@/lib/services/userService';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackPath = '/login' }: RoleGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthorized(false);
        setIsLoading(false);
        router.push(fallbackPath);
        return;
      }

      try {
        // Ensure Firestore doc exists/migrated for this UID
        await UsersService.ensureUserDocForAuthUser(user);
        // Fetch role: try Firestore first, then fall back to Realtime Database
        let role: string | undefined;

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            role = (userDocSnap.data() as any)?.role;
          }
        } catch (err) {
          console.error('Error fetching role from Firestore:', err);
        }

        if (!role) {
          try {
            const rtdb = getDatabase(app);
            const roleSnap = await getFromRealtimeDb(ref(rtdb, `users/${user.uid}/role`));
            if (roleSnap.exists()) {
              role = roleSnap.val();
            }
          } catch (err) {
            console.error('Error fetching role from Realtime Database:', err);
          }
        }

        if (!role || !allowedRoles.includes(role)) {
          setIsAuthorized(false);
          setIsLoading(false);
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
          });
          router.push(fallbackPath);
          return;
        }

        setIsAuthorized(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsAuthorized(false);
        setIsLoading(false);
        router.push(fallbackPath);
      }
    });

    return () => unsubscribe();
  }, [allowedRoles, fallbackPath, router, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
} 