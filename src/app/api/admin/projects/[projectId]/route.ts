
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';

async function checkPermission(req: NextRequest, requiredPermissions: string[]): Promise<boolean> {
    const userRole = await getSessionAndUserRole(req); 

    if (!userRole) {
        console.warn('Authentication failed: No user role found.');
        return false;
    }

    const rolePermissionsMap: { [key: string]: string[] } = {
        'Admin': ['projects:view', 'projects:edit', 'projects:delete'],
    };

    const userPermissions = rolePermissionsMap[userRole] || [];
    const hasPermission = requiredPermissions.every(perm => userPermissions.includes(perm));

    if (!hasPermission) {
        console.warn(`Authorization failed for role '${userRole}'. Required: [${requiredPermissions.join(', ')}]`);
    }

    return hasPermission;
}

// GET /api/admin/projects/{projectId} - Get a single project
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    
    if (!await checkPermission(req, ['projects:view'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    try {
        const projectRef = db.collection('projects').doc(projectId);
        const projectSnap = await projectRef.get();
        if (!projectSnap.exists()) {
            return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        }
        return NextResponse.json({ id: projectSnap.id, ...projectSnap.data() });
    } catch (error) {
        console.error("Error fetching project:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT /api/admin/projects/{projectId} - Update a project
export async function PUT(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    
    if (!await checkPermission(req, ['projects:edit'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    try {
        const body = await req.json();
        const { name, description, status } = body;
        
        const projectRef = db.collection('projects').doc(projectId);
        await projectRef.update({ name, description, status });

        return NextResponse.json({ message: 'Project updated successfully' });
    } catch (error) {
        console.error("Error updating project:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/admin/projects/{projectId} - Delete a project
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    
    if (!await checkPermission(req, ['projects:delete'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    try {
        const projectRef = db.collection('projects').doc(projectId);
        await projectRef.delete();
        // In a real app, you'd also want to handle cleanup of projectAssignments, etc.
        return NextResponse.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
