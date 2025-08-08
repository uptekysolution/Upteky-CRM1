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

// GET /api/admin/projects/{projectId}/tasks - Get all tasks for a project
export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    
    if (!await checkPermission(req, ['projects:view'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const tasksSnapshot = await db.collection('projectTasks')
            .where('projectId', '==', projectId)
            .get();
        
        const tasks = tasksSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));
        
        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Error fetching project tasks:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/admin/projects/{projectId}/tasks - Create a new task
export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    
    if (!await checkPermission(req, ['projects:edit'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, description, assignee, dueDate, priority } = body;

        if (!title || !assignee) {
            return NextResponse.json({ message: 'Title and assignee are required' }, { status: 400 });
        }

        const newTask = {
            projectId,
            title,
            description: description || '',
            assignee,
            dueDate: dueDate || null,
            priority: priority || 'medium',
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await db.collection('projectTasks').add(newTask);
        const createdTask = { id: docRef.id, ...newTask };
        
        return NextResponse.json(createdTask, { status: 201 });
    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
} 