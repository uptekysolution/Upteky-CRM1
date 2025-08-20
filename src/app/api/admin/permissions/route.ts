import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';

async function checkPermission(req: NextRequest, requiredPermissions: string[]): Promise<boolean> {
    const userRole = await getSessionAndUserRole(req); 
    if (!userRole || userRole !== 'Admin') {
        console.warn(`Authorization failed for role '${userRole}'. Required: Admin`);
        return false;
    }
    return true;
}

// GET /api/admin/permissions - Get all role permissions
export async function GET(req: NextRequest) {
    if (!await checkPermission(req, ['permissions:manage'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const rolesSnapshot = await db.collection('role_permissions').get();
        const rolesData: Record<string, any> = {};
        
        rolesSnapshot.docs.forEach(doc => {
            rolesData[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        return NextResponse.json(rolesData);
    } catch (error) {
        console.error("Error fetching role permissions:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/admin/permissions - Create or update role permissions
export async function POST(req: NextRequest) {
    if (!await checkPermission(req, ['permissions:manage'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { role, permissions } = body;

        if (!role || !Array.isArray(permissions)) {
            return NextResponse.json({ message: 'Role and permissions array are required' }, { status: 400 });
        }

        await db.collection('role_permissions').doc(role).set({
            permissions,
            updatedAt: new Date()
        });

        return NextResponse.json({ message: 'Role permissions updated successfully' });
    } catch (error) {
        console.error("Error updating role permissions:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
