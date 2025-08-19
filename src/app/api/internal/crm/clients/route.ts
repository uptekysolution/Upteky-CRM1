
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
        'Admin': ['clients:view', 'clients:create', 'clients:update', 'clients:delete'],
        'Sub-Admin': ['clients:view', 'clients:create', 'clients:update'],
        'HR': ['clients:view'],
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
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search')?.toLowerCase() || '';
        const status = searchParams.get('status') || '';
        const industry = searchParams.get('industry') || '';
        const dateFromStr = searchParams.get('from') || '';

        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('clients');

        if (status) {
            query = query.where('status', '==', status);
        }
        if (industry) {
            query = query.where('industry', '==', industry);
        }
        if (dateFromStr) {
            const dateFrom = new Date(dateFromStr);
            if (!isNaN(dateFrom.getTime())) {
                query = query.where('createdAt', '>=', dateFrom);
            }
        }

        if (search) {
            // Prefix search on nameLower
            query = query.orderBy('nameLower').startAt(search).endAt(search + '\uf8ff');
        }

        const snapshot = await query.get();
        const clientsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        const {
            firstName,
            lastName,
            email,
            phone,
            position,
            industry,
            website,
            status,
            description,
            logoUrl,
        } = body || {};

        if (typeof firstName !== 'string' || firstName.trim() === '') {
            return NextResponse.json({ message: 'First name is required' }, { status: 400 });
        }
        if (typeof lastName !== 'string' || lastName.trim() === '') {
            return NextResponse.json({ message: 'Last name is required' }, { status: 400 });
        }
        if (email && typeof email !== 'string') {
            return NextResponse.json({ message: 'Invalid email' }, { status: 400 });
        }

        const name = `${firstName.trim()} ${lastName.trim()}`.trim();
        const now = new Date();
        const docData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            name,
            nameLower: name.toLowerCase(),
            email: email || '',
            phone: phone || '',
            position: position || '',
            industry: industry || '',
            website: website || '',
            status: status || 'Active',
            description: description || '',
            logoUrl: logoUrl || '',
            projectsCount: 0,
            lastContactAt: null as Date | null,
            createdAt: now,
            updatedAt: now,
        };

        const docRef = await db.collection('clients').add(docData);
        return NextResponse.json({ id: docRef.id, ...docData }, { status: 201 });
    } catch (error) {
        console.error("Error creating client:", error);
        return NextResponse.json({ message: 'An internal server error occurred while creating the client.' }, { status: 500 });
    }
}
