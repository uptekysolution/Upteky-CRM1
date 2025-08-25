'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface LeadGenerationGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export function LeadGenerationGuard({ 
  children, 
  fallbackPath = '/admin/dashboard' 
}: LeadGenerationGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthorized(false);
        setIsLoading(false);
        router.push('/login');
        return;
      }

      try {
        // Check user permissions from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const role = userData.role;
          const permissions = userData.permissions || {};

          // Check if user has lead-generation:view permission or is Admin
          const hasPermission = 
            permissions['lead-generation:view'] === true || 
            role === 'Admin' ||
            role === 'Sub-Admin';

          if (hasPermission) {
            setIsAuthorized(true);
            setIsLoading(false);
          } else {
            setIsAuthorized(false);
            setIsLoading(false);
            toast({
              variant: 'destructive',
              title: 'Access Denied',
              description: 'You do not have permission to access Lead Generation tools.',
            });
            router.push(fallbackPath);
          }
        } else {
          // User document doesn't exist, deny access
          setIsAuthorized(false);
          setIsLoading(false);
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'User profile not found.',
          });
          router.push(fallbackPath);
        }
      } catch (error) {
        console.error('Error checking user permissions:', error);
        setIsAuthorized(false);
        setIsLoading(false);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to verify permissions.',
        });
        router.push(fallbackPath);
      }
    });

    return () => unsubscribe();
  }, [router, toast, fallbackPath]);

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
