import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';

export const allPermissions = {
  'dashboard:view': { id: 1, name: 'dashboard:view', description: 'View main dashboard' },
  'attendance:view:own': { id: 2, name: 'attendance:view:own', description: 'View own attendance' },
  'attendance:view:team': { id: 3, name: 'attendance:view:team', description: 'View team attendance' },
  'attendance:view:all': { id: 4, name: 'attendance:view:all', description: 'View all attendance' },
  'payroll:view:own': { id: 5, name: 'payroll:view:own', description: 'View own payroll' },
  'payroll:view:all': { id: 6, name: 'payroll:view:all', description: 'View all payroll (except Admins)' },
  'clients:view': { id: 7, name: 'clients:view', description: 'View all clients' },
  'tickets:view': { id: 8, name: 'tickets:view', description: 'View all support tickets' },
  'lead-generation:view': { id: 10, name: 'lead-generation:view', description: 'Access lead generation tools' },
  'tasks:view': { id: 11, name: 'tasks:view', description: 'View tasks' },
  'timesheet:view': { id: 12, name: 'timesheet:view', description: 'View timesheets' },
  'users:manage': { id: 13, name: 'users:manage', description: 'Manage users (create, edit, delete)' },
  'permissions:manage': { id: 14, name: 'permissions:manage', description: 'Manage roles and permissions' },
  'audit-log:view': { id: 15, name: 'audit-log:view', description: 'View audit logs' },
  'teams:manage': { id: 16, name: 'teams:manage', description: 'Manage teams and projects' },
} as const;

export type PermissionName = keyof typeof allPermissions;
export type PermissionsMatrix = Record<string, Partial<Record<PermissionName, boolean>>>;

interface PermissionsContextType {
  permissions: PermissionsMatrix;
  hasPermission: (permission: PermissionName | PermissionName[]) => boolean;
  isLoading: boolean;
  isSaving: boolean;
  updatePermission: (role: string, permission: PermissionName, checked: boolean) => void;
  savePermissions: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const userRole = user?.role || 'Employee';
  const [permissions, setPermissions] = useState<PermissionsMatrix>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/internal/permissions/roles', {
        headers: { 'X-User-Role': userRole }
      });
      if (!response.ok) throw new Error('Failed to fetch permissions');
      const data = await response.json();
      setPermissions(data.permissions || {});
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions({});
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to load permissions from backend.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userRole, toast]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback((permission: PermissionName | PermissionName[]): boolean => {
    if (!permissions[userRole]) return false;
    if (Array.isArray(permission)) {
      return permission.some(p => permissions[userRole]?.[p] === true);
    }
    return permissions[userRole]?.[permission] === true;
  }, [permissions, userRole]);

  const updatePermission = useCallback((role: string, permission: PermissionName, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: checked,
      }
    }));
  }, []);

  const savePermissions = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/internal/permissions/roles', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': userRole
        },
        body: JSON.stringify({ permissions }),
      });
      if (!response.ok) {
        throw new Error('Failed to save permissions.');
      }
      toast({
        title: "Permissions Updated",
        description: "Default role permissions have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        variant: 'destructive',
        title: "Save Failed",
        description: "An error occurred while saving permissions.",
      });
    } finally {
      setIsSaving(false);
    }
  }, [permissions, userRole, toast]);

  const refreshPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  return (
    <PermissionsContext.Provider value={{ permissions, hasPermission, isLoading, isSaving, updatePermission, savePermissions, refreshPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider');
  }
  return context;
}

// Keep the original hook for direct use (for admin UI, etc.)
export function usePermissions(userRole: string = 'Admin') {
  const [permissions, setPermissions] = useState<PermissionsMatrix>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/internal/permissions/roles', {
        headers: { 'X-User-Role': userRole }
      });
      if (!response.ok) throw new Error('Failed to fetch permissions');
      const data = await response.json();
      setPermissions(data.permissions || {});
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions({});
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to load permissions from backend.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userRole, toast]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback((permission: PermissionName | PermissionName[]): boolean => {
    if (!permissions[userRole]) return false;
    
    if (Array.isArray(permission)) {
      return permission.some(p => permissions[userRole]?.[p] === true);
    }
    
    return permissions[userRole]?.[permission] === true;
  }, [permissions, userRole]);

  const updatePermission = useCallback((role: string, permission: PermissionName, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: checked,
      }
    }));
  }, []);

  const savePermissions = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/internal/permissions/roles', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': userRole
        },
        body: JSON.stringify({ permissions }),
      });

      if (!response.ok) {
        throw new Error('Failed to save permissions.');
      }

      toast({
        title: "Permissions Updated",
        description: "Default role permissions have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        variant: 'destructive',
        title: "Save Failed",
        description: "An error occurred while saving permissions.",
      });
    } finally {
      setIsSaving(false);
    }
  }, [permissions, userRole, toast]);

  const refreshPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    hasPermission,
    isLoading,
    isSaving,
    updatePermission,
    savePermissions,
    refreshPermissions,
  };
} 