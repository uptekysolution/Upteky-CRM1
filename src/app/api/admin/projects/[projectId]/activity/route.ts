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

// GET /api/admin/projects/{projectId}/activity - Get activity log for a project
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    
    if (!await checkPermission(req, ['projects:view'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const activitySnapshot = await db.collection('projectActivity')
            .where('projectId', '==', projectId)
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        const activities = activitySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));
        
        return NextResponse.json(activities);
    } catch (error) {
        console.error("Error fetching project activity:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/admin/projects/{projectId}/activity - Add new activity
export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    
    if (!await checkPermission(req, ['projects:edit'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { action, user, details } = body;

        if (!action || !user) {
            return NextResponse.json({ message: 'Action and user are required' }, { status: 400 });
        }

        const newActivity = {
            projectId,
            action,
            user,
            details: details || '',
            timestamp: new Date(),
        };

        const docRef = await db.collection('projectActivity').add(newActivity);
        const createdActivity = { id: docRef.id, ...newActivity };
        
        return NextResponse.json(createdActivity, { status: 201 });
    } catch (error) {
        console.error("Error creating activity:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
} 