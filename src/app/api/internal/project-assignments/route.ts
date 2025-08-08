
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

// GET /api/internal/project-assignments?teamId={teamId}&projectId={projectId} - Get assignments for a team or project
export async function GET(req: NextRequest) {
    if (!await checkPermission(req, ['projects:view'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    const projectId = searchParams.get('projectId');

    if (!teamId && !projectId) {
        return NextResponse.json({ message: 'Either teamId or projectId is required' }, { status: 400 });
    }

    try {
        let query: any = db.collection('projectAssignments');
        
        if (teamId) {
            query = query.where('teamId', '==', teamId);
        }
        
        if (projectId) {
            query = query.where('projectId', '==', projectId);
        }
        
        const snapshot = await query.get();
        const assignments = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(assignments);
    } catch (error) {
        console.error("Error fetching project assignments:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


// POST /api/internal/project-assignments - Assign a team to a project
export async function POST(req: NextRequest) {
    if (!await checkPermission(req, ['projects:edit'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    try {
        const body = await req.json();
        const { projectId, teamId } = body;
        if (!projectId || !teamId) {
            return NextResponse.json({ message: 'projectId and teamId are required' }, { status: 400 });
        }
        
        const existing = await db.collection('projectAssignments')
            .where('projectId', '==', projectId)
            .where('teamId', '==', teamId)
            .get();
        if (!existing.empty) {
            return NextResponse.json({ message: 'This team is already assigned to this project.' }, { status: 409 });
        }

        const newAssignment = { projectId, teamId };
        const docRef = await db.collection('projectAssignments').add(newAssignment);
        return NextResponse.json({ id: docRef.id, ...newAssignment }, { status: 201 });
    } catch (error) {
        console.error("Error creating project assignment:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/internal/project-assignments - Unassign a team from a project
export async function DELETE(req: NextRequest) {
    if (!await checkPermission(req, ['projects:edit'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    try {
        const { projectId, teamId } = await req.json();
         if (!projectId || !teamId) {
            return NextResponse.json({ message: 'projectId and teamId are required' }, { status: 400 });
        }

        const snapshot = await db.collection('projectAssignments')
            .where('projectId', '==', projectId)
            .where('teamId', '==', teamId)
            .get();
        
        if (snapshot.empty) {
            return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
        }

        const batch = db.batch();
        snapshot.forEach(docSnap => {
            batch.delete(docSnap.ref);
        });
        await batch.commit();

        return NextResponse.json({ message: 'Team unassigned from project successfully' });
    } catch (error) {
        console.error("Error deleting project assignment:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
