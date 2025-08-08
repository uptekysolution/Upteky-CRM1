
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';

// Secure permission check function
async function checkPermission(req: NextRequest, requiredPermissions: string[]): Promise<boolean> {
    const userRole = await getSessionAndUserRole(req); // Get user role securely from token/DB

    if (!userRole) {
        console.warn('Authentication failed: No user role found.');
        return false;
    }

    // Define role-permission mapping
    const rolePermissionsMap: { [key: string]: string[] } = {
        'Admin': ['clients:view', 'clients:create'],
        'Sub-Admin': ['clients:view', 'clients:create'],
        'HR': ['clients:view', 'clients:create'],
        'Team Lead': ['clients:view'],
        'Business Development': ['clients:view', 'clients:create'],
    };

    const userPermissions = rolePermissionsMap[userRole] || [];

    // Check if the user has all required permissions
    const hasAllPermissions = requiredPermissions.every(perm => userPermissions.includes(perm));
    
    if (!hasAllPermissions) {
        console.warn(`Authorization failed for role '${userRole}'. Required: [${requiredPermissions.join(', ')}]`);
    }
    
    return hasAllPermissions;
}

// GET /api/internal/crm/clients - List all clients
export async function GET(req: NextRequest) {
    if (!await checkPermission(req, ['clients:view'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const clientSnapshot = await db.collection('clients').get();
        const clientsList = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(clientsList);
    } catch (error) {
        console.error("Error fetching clients:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


// POST /api/internal/crm/clients - Create a new client
export async function POST(req: NextRequest) {
    if (!await checkPermission(req, ['clients:create'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, status, address, primaryContactId } = body;

        // Server-side validation
        if (typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json({ message: 'Client name is required and must be a non-empty string' }, { status: 400 });
        }
        if (status && typeof status !== 'string') {
            return NextResponse.json({ message: 'Status must be a string if provided' }, { status: 400 });
        }
        if (address && (typeof address !== 'object' || Array.isArray(address) || address === null)) {
            return NextResponse.json({ message: 'Address must be an object if provided' }, { status: 400 });
        }
        if (primaryContactId && typeof primaryContactId !== 'string') {
            return NextResponse.json({ message: 'Primary contact ID must be a string if provided' }, { status: 400 });
        }


        const newClient = {
            name: name.trim(),
            status: status || 'Active', // Default status
            address: address || {},
            primaryContactId: primaryContactId || null,
            createdAt: new Date(), // Add server-side timestamp
        };

        const docRef = await db.collection('clients').add(newClient);

        return NextResponse.json({ id: docRef.id, ...newClient }, { status: 201 });

    } catch (error) {
        console.error("Error creating client:", error);
        return NextResponse.json({ message: 'An internal server error occurred while creating the client.' }, { status: 500 });
    }
}
