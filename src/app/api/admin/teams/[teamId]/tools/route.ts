
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

// GET /api/admin/teams/{teamId}/tools - Get tool access for a team
export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
    const { teamId } = await params;
    
    if (!await checkPermission(req, ['teams:view:tools'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const snapshot = await db.collection('teamToolAccess')
            .where('teamId', '==', teamId)
            .get();
        const accessList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(accessList);
    } catch (error) {
        console.error("Error fetching tool access:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


// POST /api/admin/teams/{teamId}/tools - Grant tool access
export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
    const { teamId } = await params;
    
    if (!await checkPermission(req, ['teams:manage:tools'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { toolId } = body;

        if (!toolId) {
            return NextResponse.json({ message: 'toolId is required' }, { status: 400 });
        }
        
        // Prevent duplicate entries
        const existing = await db.collection('teamToolAccess')
            .where('teamId', '==', teamId)
            .where('toolId', '==', toolId)
            .get();
        if(!existing.empty) {
            return NextResponse.json({ message: 'Tool access already granted for this team.' }, { status: 409 });
        }

        const newAccess = {
            teamId,
            toolId,
        };

        const docRef = await db.collection('teamToolAccess').add(newAccess);
        return NextResponse.json({ id: docRef.id, ...newAccess }, { status: 201 });
    } catch (error) {
        console.error("Error granting tool access:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
