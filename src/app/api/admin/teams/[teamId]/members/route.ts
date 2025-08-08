
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

// POST /api/admin/teams/{teamId}/members - Add a user to a team
export async function POST(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
    const { teamId } = await params;
    
    if (!await checkPermission(req, ['teams:manage:members'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { userId, teamRole, reportsToMemberId } = body;

        if (!userId || !teamRole) {
            return NextResponse.json({ message: 'userId and teamRole are required' }, { status: 400 });
        }

        const newMember = {
            teamId,
            userId,
            teamRole,
            reportsToMemberId: reportsToMemberId || null,
        };

        const docRef = await db.collection('teamMembers').add(newMember);
        return NextResponse.json({ id: docRef.id, ...newMember }, { status: 201 });
    } catch (error) {
        console.error("Error adding team member:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// GET /api/admin/teams/{teamId}/members - List all members of a team
export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
    const { teamId } = await params;
    
    if (!await checkPermission(req, ['teams:view:members'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    try {
        const membersSnapshot = await db.collection('teamMembers')
            .where('teamId', '==', teamId)
            .get();
        const membersList = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(membersList);
    } catch (error) {
        console.error("Error fetching team members:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
