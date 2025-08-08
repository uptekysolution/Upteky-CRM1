
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

// PUT /api/admin/teams/{teamId}/members/{memberDocId} - Update a member's role or reporting
export async function PUT(req: NextRequest, { params }: { params: Promise<{ teamId: string, memberDocId: string }> }) {
    const { teamId, memberDocId } = await params;
    
    if (!await checkPermission(req, ['teams:manage:members'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    try {
        const body = await req.json();
        const { teamRole, reportsToMemberId } = body;

        const memberRef = db.collection('teamMembers').doc(memberDocId);
        // Ensure teamId in body matches param to prevent moving members between teams with this endpoint
        await memberRef.update({ teamRole, reportsToMemberId });

        return NextResponse.json({ message: 'Team member updated successfully' });
    } catch (error) {
        console.error("Error updating team member:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/admin/teams/{teamId}/members/{memberDocId} - Remove a member from a team
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ teamId: string, memberDocId: string }> }) {
    const { teamId, memberDocId } = await params;
    
    if (!await checkPermission(req, ['teams:manage:members'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    try {
        const memberRef = db.collection('teamMembers').doc(memberDocId);
        await memberRef.delete();

        return NextResponse.json({ message: 'Team member removed successfully' });
    } catch (error) {
        console.error("Error removing team member:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
