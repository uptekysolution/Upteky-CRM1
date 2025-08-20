'use client';

import { ReactNode } from 'react';
import { useRolePermissions, PermissionName } from '@/hooks/use-role-permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, AlertTriangle } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission: PermissionName | PermissionName[];
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export function PermissionGuard({ 
  children, 
  requiredPermission, 
  fallback,
  showAccessDenied = true 
}: PermissionGuardProps) {
  const { hasAnyPermission, isLoading, userRole } = useRolePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAnyPermission(requiredPermission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showAccessDenied) {
      return null;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <ShieldX className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this content.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Required permission: {Array.isArray(requiredPermission) ? requiredPermission.join(' or ') : requiredPermission}</span>
            </div>
            {userRole && (
              <p className="mt-2 text-xs text-muted-foreground">
                Current role: {userRole}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
