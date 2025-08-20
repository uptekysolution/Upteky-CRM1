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

// GET /api/admin/permissions/{role} - Get permissions for a specific role
export async function GET(req: NextRequest, { params }: { params: Promise<{ role: string }> }) {
    const { role } = await params;
    
    if (!await checkPermission(req, ['permissions:manage'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const roleDoc = await db.collection('role_permissions').doc(role).get();
        
        if (!roleDoc.exists) {
            return NextResponse.json({ message: 'Role not found' }, { status: 404 });
        }

        return NextResponse.json({ id: roleDoc.id, ...roleDoc.data() });
    } catch (error) {
        console.error("Error fetching role permissions:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT /api/admin/permissions/{role} - Update permissions for a specific role
export async function PUT(req: NextRequest, { params }: { params: Promise<{ role: string }> }) {
    const { role } = await params;
    
    if (!await checkPermission(req, ['permissions:manage'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { permissions } = body;

        if (!Array.isArray(permissions)) {
            return NextResponse.json({ message: 'Permissions array is required' }, { status: 400 });
        }

        await db.collection('role_permissions').doc(role).update({
            permissions,
            updatedAt: new Date()
        });

        return NextResponse.json({ message: 'Role permissions updated successfully' });
    } catch (error) {
        console.error("Error updating role permissions:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/admin/permissions/{role} - Delete a role and its permissions
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ role: string }> }) {
    const { role } = await params;
    
    if (!await checkPermission(req, ['permissions:manage'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        await db.collection('role_permissions').doc(role).delete();
        return NextResponse.json({ message: 'Role permissions deleted successfully' });
    } catch (error) {
        console.error("Error deleting role permissions:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
