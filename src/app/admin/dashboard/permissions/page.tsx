
'use client'

import { PermissionsMatrix } from '@/components/permissions-matrix';

export default function PermissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Permissions Management</h1>
        <p className="text-muted-foreground">
          Configure role-based permissions for your organization. Changes are applied in real-time across all user sessions.
        </p>
      </div>
      
      <PermissionsMatrix />
    </div>
  );
}
