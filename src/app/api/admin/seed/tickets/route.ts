import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { initialTickets, initialTicketReplies } from '@/app/dashboard/_data/seed-data';
import { getSessionAndUserRole } from '@/lib/auth';

async function checkPermission(req: NextRequest, requiredPermissions: string[]): Promise<boolean> {
    const userRole = await getSessionAndUserRole(req); 
    if (!userRole || userRole !== 'Admin') { // Seeding should be strictly Admin
        console.warn(`Authorization failed for role '${userRole}'. Required: Admin`);
        return false;
    }
    return true;
}

export async function POST(req: NextRequest) {
    if (!await checkPermission(req, ['system:seed'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const batch = db.batch();

        // Seed Tickets
        initialTickets.forEach(ticket => {
            const ticketRef = db.collection("tickets").doc(ticket.id);
            batch.set(ticketRef, ticket);
        });

        // Seed Ticket Replies
        initialTicketReplies.forEach(reply => {
            const replyRef = db.collection("ticketReplies").doc(reply.id);
            batch.set(replyRef, reply);
        });

        await batch.commit();

        return NextResponse.json({ message: 'Tickets data seeded successfully' }, { status: 200 });
    } catch (error) {
        console.error("Error seeding tickets:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
} 