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

// GET /api/admin/projects/{projectId}/files/{fileId} - Get file details for download
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string; fileId: string }> }) {
    const { projectId, fileId } = await params;
    
    if (!await checkPermission(req, ['projects:view'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const fileDoc = await db.collection('projectFiles').doc(fileId).get();
        
        if (!fileDoc.exists) {
            return NextResponse.json({ message: 'File not found' }, { status: 404 });
        }

        const fileData = fileDoc.data();
        
        // Check if file belongs to the project
        if (fileData?.projectId !== projectId) {
            return NextResponse.json({ message: 'File not found in this project' }, { status: 404 });
        }

        // In a real application, you would:
        // 1. Get the actual file from storage (Firebase Storage, S3, etc.)
        // 2. Return the file with proper headers for download
        // For now, we'll return the file metadata with a mock download URL
        
        return NextResponse.json({
            ...fileData,
            id: fileId,
            downloadUrl: `/api/admin/projects/${projectId}/files/${fileId}/download`
        });
    } catch (error) {
        console.error("Error fetching file:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/admin/projects/{projectId}/files/{fileId} - Delete a file
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ projectId: string; fileId: string }> }) {
    const { projectId, fileId } = await params;
    
    if (!await checkPermission(req, ['projects:edit'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const fileDoc = await db.collection('projectFiles').doc(fileId).get();
        
        if (!fileDoc.exists) {
            return NextResponse.json({ message: 'File not found' }, { status: 404 });
        }

        const fileData = fileDoc.data();
        
        // Check if file belongs to the project
        if (fileData?.projectId !== projectId) {
            return NextResponse.json({ message: 'File not found in this project' }, { status: 404 });
        }

        // In a real application, you would:
        // 1. Delete the actual file from storage (Firebase Storage, S3, etc.)
        // 2. Then delete the database record
        
        await db.collection('projectFiles').doc(fileId).delete();
        
        return NextResponse.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error("Error deleting file:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
} 