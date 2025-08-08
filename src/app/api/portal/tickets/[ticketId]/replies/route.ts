
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// POST /api/portal/tickets/{ticketId}/replies - Add a reply from a client
export async function POST(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
    const { ticketId } = await params;
    
    // --- AUTHENTICATION & PERMISSION CHECK ---
    // In a real app, get client info from their auth session token
    const authenticatedClient = {
        contactId: 'contact-jane-smith', // Placeholder
        name: 'Jane Smith (Client)', // Placeholder
        clientId: 'client-globex-inc' // Placeholder
    };

    try {
        const body = await req.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json({ message: 'Message is required' }, { status: 400 });
        }

        // In a real app, you would also verify that the ticket `ticketId` belongs to the `authenticatedClient.clientId`.
        
        const newReply = {
            ticketId,
            authorId: authenticatedClient.contactId,
            authorName: authenticatedClient.name,
            message,
            isInternalNote: false, // Clients can NEVER post internal notes.
            createdAt: new Date(),
        };

        const docRef = await db.collection('ticketReplies').add(newReply);
        return NextResponse.json({ id: docRef.id, ...newReply }, { status: 201 });

    } catch (error) {
        console.error(`Error adding client reply to ticket ${ticketId}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
