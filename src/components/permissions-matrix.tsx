'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PermissionName } from '@/hooks/use-role-permissions';

interface RolePermissions {
  permissions: PermissionName[];
}

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

const permissionDescriptions: Record<PermissionName, string> = {
  'dashboard:view': 'View main dashboard',
  'attendance:view:own': 'View own attendance',
  'attendance:view:team': 'View team attendance',
  'attendance:view:all': 'View all attendance',
  'payroll:view:own': 'View own payroll',
  'payroll:view:all': 'View all payroll',
  'clients:view': 'View all clients',
  'tickets:view': 'View all support tickets',
  'lead-generation:view': 'Access lead generation tools',
  'tasks:view': 'View tasks',
  'timesheet:view': 'View timesheets',
  'users:manage': 'Manage users (create, edit, delete)',
  'permissions:manage': 'Manage roles and permissions',
  'audit-log:view': 'View audit logs',
  'teams:manage': 'Manage teams and projects'
};

const roles = ['Employee', 'HR', 'Team Lead', 'Business Development', 'Sub-Admin'];

export function PermissionsMatrix() {
  const [rolePermissions, setRolePermissions] = useState<Record<string, PermissionName[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Listen to all role permissions
    roles.forEach(role => {
      const roleDocRef = doc(db, 'role_permissions', role);
      const unsubscribe = onSnapshot(
        roleDocRef,
        (doc) => {
          if (doc.exists()) {
            const data = doc.data() as RolePermissions;
            setRolePermissions(prev => ({
              ...prev,
              [role]: data.permissions || []
            }));
          } else {
            // Initialize with default permissions if document doesn't exist
            const defaultPermissions: PermissionName[] = getDefaultPermissions(role);
            setRolePermissions(prev => ({
              ...prev,
              [role]: defaultPermissions
            }));
          }
        },
        (error) => {
          console.error(`Error listening to ${role} permissions:`, error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: `Failed to load ${role} permissions`
          });
        }
      );
      unsubscribes.push(unsubscribe);
    });

    setIsLoading(false);

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [toast]);

  const getDefaultPermissions = (role: string): PermissionName[] => {
    const defaults: Record<string, PermissionName[]> = {
      'Employee': ['dashboard:view', 'attendance:view:own', 'payroll:view:own', 'tasks:view', 'timesheet:view'],
      'HR': ['dashboard:view', 'attendance:view:all', 'payroll:view:all', 'tasks:view', 'timesheet:view', 'users:manage', 'audit-log:view', 'clients:view', 'tickets:view'],
      'Team Lead': ['dashboard:view', 'attendance:view:team', 'payroll:view:own', 'clients:view', 'tickets:view', 'lead-generation:view', 'tasks:view', 'timesheet:view'],
      'Business Development': ['dashboard:view', 'clients:view', 'lead-generation:view'],
      'Sub-Admin': ['dashboard:view', 'attendance:view:all', 'payroll:view:all', 'clients:view', 'tickets:view', 'lead-generation:view', 'tasks:view', 'timesheet:view', 'users:manage', 'permissions:manage']
    };
    return defaults[role] || [];
  };

  const handlePermissionToggle = async (role: string, permission: PermissionName, enabled: boolean) => {
    try {
      const currentPermissions = rolePermissions[role] || [];
      const newPermissions = enabled
        ? [...currentPermissions, permission]
        : currentPermissions.filter(p => p !== permission);

      const roleDocRef = doc(db, 'role_permissions', role);
      await updateDoc(roleDocRef, {
        permissions: newPermissions
      });

      toast({
        title: 'Permission Updated',
        description: `${permission} ${enabled ? 'enabled' : 'disabled'} for ${role}`,
      });
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update permission'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Role Permissions Matrix</h2>
          <p className="text-muted-foreground">
            Manage permissions for each role. Changes are applied in real-time.
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Admin role has all permissions (not editable)
        </Badge>
      </div>

      <div className="grid gap-6">
        {roles.map(role => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {role}
                <Badge variant="secondary">
                  {rolePermissions[role]?.length || 0} permissions
                </Badge>
              </CardTitle>
              <CardDescription>
                Configure what {role} users can access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allPermissions.map(permission => {
                  const isEnabled = rolePermissions[role]?.includes(permission) || false;
                  
                  return (
                    <div key={permission} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{permission}</div>
                        <div className="text-xs text-muted-foreground">
                          {permissionDescriptions[permission]}
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handlePermissionToggle(role, permission, checked)}
                        className="ml-4"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 