'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { isAuthenticated } from '@/lib/auth-utils';

export type PermissionName = 
  | 'dashboard:view'
  | 'attendance:view:own'
  | 'attendance:view:team'
  | 'attendance:view:all'
  | 'payroll:view:own'
  | 'payroll:view:all'
  | 'clients:view'
  | 'tickets:view'
  | 'lead-generation:view'
  | 'tasks:view'
  | 'timesheet:view'
  | 'users:manage'
  | 'permissions:manage'
  | 'audit-log:view'
  | 'teams:manage';

interface RolePermissions {
  permissions: PermissionName[];
}

export function useRolePermissions() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionName[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribePermissions: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clean up any existing permission listeners
      if (unsubscribePermissions) {
        unsubscribePermissions();
        unsubscribePermissions = null;
      }

      if (!user) {
        setUserRole(null);
        setPermissions([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      try {
        // Get user role from users/{uid}
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          setError('User document not found');
          setIsLoading(false);
          return;
        }

        const userData = userDocSnap.data();
        const role = userData.role;

        if (!role) {
          setError('User role not found');
          setIsLoading(false);
          return;
        }

        setUserRole(role);

        // Admin always has all permissions
        if (role === 'Admin') {
          const allPermissions: PermissionName[] = [
            'dashboard:view',
            'attendance:view:own',
            'attendance:view:team',
            'attendance:view:all',
            'payroll:view:own',
            'payroll:view:all',
            'clients:view',
            'tickets:view',
            'lead-generation:view',
            'tasks:view',
            'timesheet:view',
            'users:manage',
            'permissions:manage',
            'audit-log:view',
            'teams:manage'
          ];
          setPermissions(allPermissions);
          setIsLoading(false);
          setError(null);
          return;
        }

        // Listen to role permissions in real-time
        const rolePermissionsRef = doc(db, 'role_permissions', role);
        unsubscribePermissions = onSnapshot(
          rolePermissionsRef,
          (doc) => {
            if (doc.exists()) {
              const data = doc.data() as RolePermissions;
              setPermissions(data.permissions || []);
            } else {
              setPermissions([]);
            }
            setIsLoading(false);
            setError(null);
          },
          (error) => {
            // Only log errors if user is still authenticated
            if (isAuthenticated()) {
              console.error('Error listening to role permissions:', error);
              setError('Failed to load permissions');
            }
            setIsLoading(false);
          }
        );
      } catch (error) {
        // Only log errors if user is still authenticated
        if (isAuthenticated()) {
          console.error('Error fetching user role:', error);
          setError('Failed to fetch user role');
        }
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribePermissions) {
        unsubscribePermissions();
      }
    };
  }, []);

  const hasPermission = (permission: PermissionName): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionsToCheck: PermissionName | PermissionName[]): boolean => {
    if (Array.isArray(permissionsToCheck)) {
      return permissionsToCheck.some(p => permissions.includes(p));
    }
    return permissions.includes(permissionsToCheck);
  };

  return {
    userRole,
    permissions,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
  };
} 