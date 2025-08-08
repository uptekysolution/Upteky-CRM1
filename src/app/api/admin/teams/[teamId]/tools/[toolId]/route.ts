
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

// DELETE /api/admin/teams/{teamId}/tools/{toolId} - Revoke tool access
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ teamId: string, toolId: string }> }) {
    const { teamId, toolId } = await params;
    
    if (!await checkPermission(req, ['teams:manage:tools'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const snapshot = await db.collection('teamToolAccess')
            .where('teamId', '==', teamId)
            .where('toolId', '==', toolId)
            .get();
        
        if (snapshot.empty) {
            return NextResponse.json({ message: 'Tool access record not found' }, { status: 404 });
        }

        // Delete all found documents (should be only one)
        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        return NextResponse.json({ message: 'Tool access revoked successfully' });
    } catch (error) {
        console.error("Error revoking tool access:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
