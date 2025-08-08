
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// A simple permission check middleware placeholder
function hasPermission(req: NextRequest, permission: string) {
    const userRole = req.headers.get('X-User-Role');
    return userRole === 'Admin' || userRole === 'Team Lead' || userRole === "HR";
}

// GET /api/internal/crm/tickets/{ticketId} - Get full ticket details
export async function GET(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
    if (!hasPermission(req, 'tickets:view')) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { ticketId } = await params;

    try {
        const ticketRef = db.collection('tickets').doc(ticketId);
        const ticketSnap = await ticketRef.get();

        if (!ticketSnap.exists) {
            return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
        }

        const repliesQuery = db.collection('ticketReplies').where('ticketId', '==', ticketId);
        const repliesSnapshot = await repliesQuery.get();
        const replies = repliesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const ticketData = {
            id: ticketSnap.id,
            ...ticketSnap.data(),
            replies: replies,
        };

        return NextResponse.json(ticketData);

    } catch (error) {
        console.error(`Error fetching ticket ${ticketId}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
