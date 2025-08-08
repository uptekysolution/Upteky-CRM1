
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// A simple permission check middleware placeholder
function hasPermission(req: NextRequest, permission: string) {
    const userRole = req.headers.get('X-User-Role');
    return userRole === 'Admin' || userRole === 'Team Lead' || userRole === "HR";
}

// PUT /api/internal/crm/tickets/{ticketId}/assign - Assign a ticket
export async function PUT(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
    if (!hasPermission(req, 'tickets:assign')) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { ticketId } = await params;

    try {
        const body = await req.json();
        const { assignedToTeamId, assignedToUserId } = body;

        if (!assignedToTeamId && !assignedToUserId) {
            return NextResponse.json({ message: 'Either assignedToTeamId or assignedToUserId is required' }, { status: 400 });
        }

        const ticketRef = db.collection('tickets').doc(ticketId);
        
        const updateData: { assignedToTeamId?: string | null; assignedToUserId?: string | null } = {};
        if (assignedToTeamId !== undefined) updateData.assignedToTeamId = assignedToTeamId;
        if (assignedToUserId !== undefined) updateData.assignedToUserId = assignedToUserId;

        await ticketRef.update(updateData);

        return NextResponse.json({ message: 'Ticket assignment updated successfully' });

    } catch (error) {
        console.error(`Error assigning ticket ${ticketId}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
