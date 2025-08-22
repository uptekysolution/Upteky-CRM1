
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';



async function checkPermission(req: NextRequest, requiredPermissions: string[]): Promise<boolean> {
    const userRole = await getSessionAndUserRole(req); 

    if (!userRole) {
        console.warn('Authentication failed: No user role found.');
        return false;
    }

    const rolePermissionsMap: { [key: string]: string[] } = {
        'Admin': ['projects:create', 'projects:view'],
    };

    const userPermissions = rolePermissionsMap[userRole] || [];
    const hasPermission = requiredPermissions.every(perm => userPermissions.includes(perm));

    if (!hasPermission) {
        console.warn(`Authorization failed for role '${userRole}'. Required: [${requiredPermissions.join(', ')}]`);
    }

    return hasPermission;
}


// POST /api/admin/projects - Create a new project
export async function POST(req: NextRequest) {
    if (!await checkPermission(req, ['projects:create'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, description, status, clientId } = body;

        if (!name || !status) {
            return NextResponse.json({ message: 'Name and status are required' }, { status: 400 });
        }

        // Validate client exists if provided
        if (clientId) {
            const clientDoc = await db.collection('clients').doc(clientId).get();
            if (!clientDoc.exists) {
                return NextResponse.json({ message: 'Client not found' }, { status: 404 });
            }
        }

        const newProject = {
            name,
            description: description || '',
            status,
            clientId: clientId || null,
            progress: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        const docRef = await db.collection('projects').add(newProject);
        return NextResponse.json({ id: docRef.id, ...newProject }, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// GET /api/admin/projects - List all projects
export async function GET(req: NextRequest) {
    if (!await checkPermission(req, ['projects:view'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('clientId');
        const status = searchParams.get('status');

        let query: any = db.collection('projects');
        
        if (clientId) {
            query = query.where('clientId', '==', clientId);
        }
        
        if (status) {
            query = query.where('status', '==', status);
        }

        const projectsSnapshot = await query.get();
        const projectsList = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(projectsList);
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
