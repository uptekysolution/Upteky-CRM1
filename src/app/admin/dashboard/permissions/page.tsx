
'use client'

import { useState } from 'react';
import { PermissionsMatrix } from '@/components/permissions-matrix';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, Shield, Users } from 'lucide-react';
import { PermissionGuard } from '@/components/permission-guard';

export default function PermissionsPage() {
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedPermissions = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch('/api/admin/seed/permissions', {
        method: 'POST',
        headers: { 'X-User-Role': 'Admin' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to seed permissions');
      }
      
      const data = await response.json();
      toast({
        title: 'Permissions Seeded',
        description: `Default permissions have been initialized for ${data.roles.length} roles.`,
      });
      
      // Refresh the page to show the seeded data
      window.location.reload();
    } catch (error) {
      console.error('Error seeding permissions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to seed permissions'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <PermissionGuard requiredPermission="permissions:manage">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Permissions Management</h1>
          <p className="text-muted-foreground">
            Configure role-based permissions for your organization. Changes are applied in real-time across all user sessions.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Employee, HR, Team Lead, Business Development, Sub-Admin
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">
                Across all modules and actions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time sync enabled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Seed Permissions Button */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Initialize Permissions
            </CardTitle>
            <CardDescription>
              Set up default role permissions in the database. This will create the initial permission structure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSeedPermissions} 
              disabled={isSeeding}
              variant="outline"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Seed Default Permissions
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        <PermissionsMatrix />
      </div>
    </PermissionGuard>
  );
}
