'use client';

import { ReactNode } from 'react';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield } from 'lucide-react';

interface AttendancePermissionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AttendancePermissionGuard({ 
  children, 
  fallback 
}: AttendancePermissionGuardProps) {
  const { hasAnyPermission, isLoading } = useRolePermissions();

  // Check if user has any attendance permission
  const hasAttendancePermission = hasAnyPermission([
    'attendance:view:own',
    'attendance:view:team', 
    'attendance:view:all'
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAttendancePermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <Shield className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-lg">Access Restricted</CardTitle>
          <CardDescription>
            You don't have permission to access attendance features.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Contact your administrator to request attendance permissions.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            Required: attendance:view:own, attendance:view:team, or attendance:view:all
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

interface AttendanceViewGuardProps {
  children: ReactNode;
  requiredPermission: 'attendance:view:own' | 'attendance:view:team' | 'attendance:view:all';
  fallback?: ReactNode;
}

export function AttendanceViewGuard({ 
  children, 
  requiredPermission,
  fallback 
}: AttendanceViewGuardProps) {
  const { hasPermission, isLoading } = useRolePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasPermission(requiredPermission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="max-w-sm mx-auto">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-sm">Permission Required</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-xs text-muted-foreground">
            You need the "{requiredPermission}" permission to view this content.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
