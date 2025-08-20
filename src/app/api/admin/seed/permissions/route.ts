import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';
import { PermissionName } from '@/hooks/use-role-permissions';

async function checkPermission(req: NextRequest, requiredPermissions: string[]): Promise<boolean> {
    const userRole = await getSessionAndUserRole(req); 
    if (!userRole || userRole !== 'Admin') {
        console.warn(`Authorization failed for role '${userRole}'. Required: Admin`);
        return false;
    }
    return true;
}

const defaultRolePermissions: Record<string, PermissionName[]> = {
  'Employee': [
    'dashboard:view',
    'attendance:view:own',
    'payroll:view:own',
    'tasks:view',
    'timesheet:view'
  ],
  'HR': [
    'dashboard:view',
    'attendance:view:all',
    'payroll:view:all',
    'tasks:view',
    'timesheet:view',
    'users:manage',
    'audit-log:view',
    'clients:view',
    'tickets:view'
  ],
  'Team Lead': [
    'dashboard:view',
    'attendance:view:team',
    'payroll:view:own',
    'clients:view',
    'tickets:view',
    'lead-generation:view',
    'tasks:view',
    'timesheet:view'
  ],
  'Business Development': [
    'dashboard:view',
    'clients:view',
    'lead-generation:view'
  ],
  'Sub-Admin': [
    'dashboard:view',
    'attendance:view:all',
    'payroll:view:all',
    'clients:view',
    'tickets:view',
    'lead-generation:view',
    'tasks:view',
    'timesheet:view',
    'users:manage',
    'permissions:manage'
  ]
};

// POST /api/admin/seed/permissions - Seed default role permissions
export async function POST(req: NextRequest) {
    if (!await checkPermission(req, ['permissions:manage'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const batch = db.batch();
        
        // Create or update role permissions
        Object.entries(defaultRolePermissions).forEach(([role, permissions]) => {
            const roleRef = db.collection('role_permissions').doc(role);
            batch.set(roleRef, {
                permissions,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        });

        await batch.commit();

        return NextResponse.json({ 
            message: 'Default role permissions seeded successfully',
            roles: Object.keys(defaultRolePermissions)
        });
    } catch (error) {
        console.error("Error seeding permissions:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
