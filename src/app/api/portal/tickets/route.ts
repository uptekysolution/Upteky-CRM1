
import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// In a real app, this would be in middleware and use a real auth system (e.g., JWT).
// For now, we'll mock the authenticated client user.
const getAuthenticatedClient = async (req: NextRequest) => {
    // This is a placeholder. A real implementation would decode a session token.
    // For example, you might get a token from the `Authorization` header.
    // const token = req.headers.get('Authorization')?.split(' ')[1];
    // if (!token) throw new Error('Not authenticated');
    // const decodedToken = await verifyToken(token); // verifyToken would be your JWT verification logic

    // If the token is valid, you'd look up the contact/client info.
    // For now, we return a static mock object.
    return {
        contactId: 'contact-jane-smith', // Mock: The ID of the logged-in contact person
        clientId: 'client-globex-inc',  // Mock: The company the contact belongs to
        name: 'Jane Smith' // Mock: Name for display
    };
};


// GET /api/portal/tickets - List tickets for the authenticated client's company
export async function GET(req: NextRequest) {
    try {
        // Authenticate the client for this request.
        const client = await getAuthenticatedClient(req);
        if (!client) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // This query is now secure because it's filtered by the authenticated client's company ID.
        const q = query(collection(db, 'tickets'), where('clientId', '==', client.clientId));
        
        const ticketsSnapshot = await getDocs(q);
        const ticketsList = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json(ticketsList);

    } catch (error: any) {
        console.error("Error fetching client tickets:", error);
        if (error.message === 'Not authenticated') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


// POST /api/portal/tickets - Create a new ticket from the portal
export async function POST(req: NextRequest) {
    try {
        const client = await getAuthenticatedClient(req);
         if (!client) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, category } = body;

        if (!title || !description || !category) {
            return NextResponse.json({ message: 'Title, description, and category are required' }, { status: 400 });
        }

        // Create a unique, human-readable ticket number (simple version)
        const ticketNumber = Math.floor(Date.now() / 1000);

        const newTicket = {
            clientId: client.clientId, // Derived from session
            contactId: client.contactId, // Derived from session
            ticketNumber,
            title,
            description,
            category,
            priority: 'Medium', // Default priority for client-submitted tickets
            status: 'Open',
            assignedToTeamId: null, // To be assigned by internal staff
            assignedToUserId: null,
            createdAt: Timestamp.now(),
            resolvedAt: null,
        };

        const docRef = await addDoc(collection(db, 'tickets'), newTicket);
        return NextResponse.json({ id: docRef.id, ...newTicket }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating client ticket:", error);
         if (error.message === 'Not authenticated') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
