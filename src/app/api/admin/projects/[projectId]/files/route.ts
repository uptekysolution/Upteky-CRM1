import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';

async function checkPermission(req: NextRequest, requiredPermissions: string[]): Promise<boolean> {
    const userRole = await getSessionAndUserRole(req); 
    if (!userRole || userRole !== 'Admin') {
        console.warn(`Authorization failed for role '${userRole}'. Required: Admin`);
        return false;
    }
    return true;
}

// GET /api/admin/projects/{projectId}/files - Get all files for a project
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    
    if (!await checkPermission(req, ['projects:view'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const filesSnapshot = await db.collection('projectFiles')
            .where('projectId', '==', projectId)
            .get();
        
        const files = filesSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));
        
        return NextResponse.json(files);
    } catch (error) {
        console.error("Error fetching project files:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/admin/projects/{projectId}/files - Create a new file record
export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    
    if (!await checkPermission(req, ['projects:edit'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, type, size, uploadedBy } = body;

        if (!name || !type) {
            return NextResponse.json({ message: 'Name and type are required' }, { status: 400 });
        }

        const newFile = {
            projectId,
            name,
            type,
            size: size || '0 KB',
            uploadedBy: uploadedBy || 'Unknown User',
            uploadedAt: new Date(),
            downloadUrl: null, // In a real app, this would be the file storage URL
        };

        const docRef = await db.collection('projectFiles').add(newFile);
        const createdFile = { id: docRef.id, ...newFile };
        
        return NextResponse.json(createdFile, { status: 201 });
    } catch (error) {
        console.error("Error creating file record:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
} 