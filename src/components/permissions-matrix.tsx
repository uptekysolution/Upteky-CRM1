'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PermissionName } from '@/hooks/use-role-permissions';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

const defaultRoles = ['Employee', 'HR', 'Team Lead', 'Business Development', 'Sub-Admin'];

export function PermissionsMatrix() {
  const [rolePermissions, setRolePermissions] = useState<Record<string, PermissionName[]>>({});
  const [roles, setRoles] = useState<string[]>(defaultRoles);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRolePermissions();
  }, []);

  const fetchRolePermissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/permissions', {
        headers: { 'X-User-Role': 'Admin' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      
      const data = await response.json();
      const permissionsData: Record<string, PermissionName[]> = {};
      
      // Initialize with default permissions for roles that don't exist in the database
      roles.forEach(role => {
        if (data[role]) {
          permissionsData[role] = data[role].permissions || [];
        } else {
          permissionsData[role] = getDefaultPermissions(role);
        }
      });
      
      setRolePermissions(permissionsData);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load permissions'
      });
    } finally {
      setIsLoading(false);
    }
  };

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

      // Update local state immediately for better UX
      setRolePermissions(prev => ({
        ...prev,
        [role]: newPermissions
      }));

      // Update in backend
      const response = await fetch(`/api/admin/permissions/${role}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': 'Admin' 
        },
        body: JSON.stringify({ permissions: newPermissions })
      });

      if (!response.ok) {
        throw new Error('Failed to update permission');
      }

      toast({
        title: 'Permission Updated',
        description: `${permission} ${enabled ? 'enabled' : 'disabled'} for ${role}`,
      });
    } catch (error) {
      console.error('Error updating permission:', error);
      // Revert local state on error
      setRolePermissions(prev => ({
        ...prev,
        [role]: rolePermissions[role] || []
      }));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update permission'
      });
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Role name is required'
      });
      return;
    }

    if (roles.includes(newRoleName.trim())) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Role already exists'
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': 'Admin' 
        },
        body: JSON.stringify({ 
          role: newRoleName.trim(),
          permissions: getDefaultPermissions(newRoleName.trim())
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create role');
      }

      setRoles(prev => [...prev, newRoleName.trim()]);
      setRolePermissions(prev => ({
        ...prev,
        [newRoleName.trim()]: getDefaultPermissions(newRoleName.trim())
      }));
      setNewRoleName('');
      setShowAddRole(false);
      
      toast({
        title: 'Role Created',
        description: `New role "${newRoleName.trim()}" has been created`,
      });
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create role'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/permissions/${roleToDelete}`, {
        method: 'DELETE',
        headers: { 'X-User-Role': 'Admin' }
      });

      if (!response.ok) {
        throw new Error('Failed to delete role');
      }

      setRoles(prev => prev.filter(role => role !== roleToDelete));
      setRolePermissions(prev => {
        const newPermissions = { ...prev };
        delete newPermissions[roleToDelete];
        return newPermissions;
      });
      
      toast({
        title: 'Role Deleted',
        description: `Role "${roleToDelete}" has been deleted`,
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete role'
      });
    } finally {
      setIsSaving(false);
      setRoleToDelete(null);
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Admin role has all permissions (not editable)
          </Badge>
          <Button size="sm" onClick={() => setShowAddRole(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {roles.map(role => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {role}
                  <Badge variant="secondary">
                    {rolePermissions[role]?.length || 0} permissions
                  </Badge>
                </div>
                {role !== 'Admin' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRoleToDelete(role)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
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

      {/* Add Role Dialog */}
      <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Create a new role with default permissions. You can customize permissions after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRole(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <Dialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{roleToDelete}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleToDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteRole}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 