import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';

async function checkPermission(req: NextRequest): Promise<{ hasPermission: boolean; userRole: string | null; userId: string | null }> {
    const userRole = await getSessionAndUserRole(req); 
    const userId = req.headers.get('X-User-ID');

    if (!userRole) {
        console.warn('Authentication failed: No user role found.');
        return { hasPermission: false, userRole: null, userId: null };
    }

    // Allow access for Admin, Client, and Employee roles
    const allowedRoles = ['Admin', 'Client', 'Employee', 'Team Lead', 'Sub-Admin'];
    const hasPermission = allowedRoles.includes(userRole);

    return { hasPermission, userRole, userId };
}

// PATCH /api/internal/projects/[id] - Update project
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { hasPermission, userRole } = await checkPermission(req);
    
    if (!hasPermission) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Only Admin, Sub-Admin, and Team Lead can update projects
    if (!['Admin', 'Sub-Admin', 'Team Lead'].includes(userRole || '')) {
        return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }

    try {
        const projectId = params.id;
        const body = await req.json();

        if (!projectId) {
            return NextResponse.json({ message: 'Project ID is required' }, { status: 400 });
        }

        const projectRef = db.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        }

        // Update the project
        await projectRef.update({
            ...body,
            updatedAt: new Date()
        });

        return NextResponse.json({ message: 'Project updated successfully' });
    } catch (error) {
        console.error("Error updating project:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
