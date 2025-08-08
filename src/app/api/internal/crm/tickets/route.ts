
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// A simple permission check middleware placeholder
function hasPermission(req: NextRequest, permission: string) {
    const userRole = req.headers.get('X-User-Role');
    return userRole === 'Admin' || userRole === 'Team Lead' || userRole === "HR";
}

// GET /api/internal/crm/tickets - List all tickets with filtering
export async function GET(req: NextRequest) {
    if (!hasPermission(req, 'tickets:view')) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignee = searchParams.get('assignee');

    try {
        let q = db.collection('tickets');
        
        if (status) {
            q = q.where('status', '==', status);
        }
        if (priority) {
            q = q.where('priority', '==', priority);
        }
        if (assignee) {
            q = q.where('assignedToUserId', '==', assignee);
        }

        const ticketsSnapshot = await q.get();
        const ticketsList = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`Found ${ticketsList.length} tickets`);
        return NextResponse.json(ticketsList);

    } catch (error) {
        console.error("Error fetching tickets:", error);
        return NextResponse.json({ 
            message: 'Internal Server Error', 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
