'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

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
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserRole(null);
        setPermissions([]);
        setIsLoading(false);
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
          return;
        }

        // Listen to role permissions in real-time
        const rolePermissionsRef = doc(db, 'role_permissions', role);
        const unsubscribePermissions = onSnapshot(
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
            console.error('Error listening to role permissions:', error);
            setError('Failed to load permissions');
            setIsLoading(false);
          }
        );

        return () => {
          unsubscribePermissions();
        };
      } catch (error) {
        console.error('Error fetching user role:', error);
        setError('Failed to fetch user role');
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
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