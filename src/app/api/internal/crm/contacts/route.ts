
import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// A simple permission check middleware placeholder
function hasPermission(req: NextRequest, permission: string) {
    const userRole = req.headers.get('X-User-Role');
    return userRole === 'Admin';
}

// POST /api/internal/crm/contacts - Create a new contact
export async function POST(req: NextRequest) {
    if (!hasPermission(req, 'contacts:create')) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    try {
        const body = await req.json();
        const { clientId, name, email, phone, roleInCompany, hasPortalAccess } = body;

        if (!clientId || !name || !email) {
            return NextResponse.json({ message: 'clientId, name, and email are required' }, { status: 400 });
        }

        const newContact = {
            clientId,
            name,
            email,
            phone: phone || '',
            roleInCompany: roleInCompany || '',
            hasPortalAccess: hasPortalAccess || false,
            portalUserId: null
        };

        const docRef = await addDoc(collection(db, 'contacts'), newContact);
        return NextResponse.json({ id: docRef.id, ...newContact }, { status: 201 });

    } catch (error) {
        console.error("Error creating contact:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
