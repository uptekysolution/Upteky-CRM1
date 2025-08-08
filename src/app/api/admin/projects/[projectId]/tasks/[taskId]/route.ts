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

// PUT /api/admin/projects/{projectId}/tasks/{taskId} - Update task status
export async function PUT(req: NextRequest, { params }: { params: Promise<{ projectId: string, taskId: string }> }) {
    const { projectId, taskId } = await params;
    
    if (!await checkPermission(req, ['projects:edit'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { status, title, description, assignee, dueDate, priority } = body;

        const taskRef = db.collection('projectTasks').doc(taskId);
        const updateData: any = { updatedAt: new Date() };
        
        if (status) updateData.status = status;
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (assignee) updateData.assignee = assignee;
        if (dueDate !== undefined) updateData.dueDate = dueDate;
        if (priority) updateData.priority = priority;

        await taskRef.update(updateData);

        return NextResponse.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/admin/projects/{projectId}/tasks/{taskId} - Delete a task
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ projectId: string, taskId: string }> }) {
    const { projectId, taskId } = await params;
    
    if (!await checkPermission(req, ['projects:edit'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const taskRef = db.collection('projectTasks').doc(taskId);
        await taskRef.delete();

        return NextResponse.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
} 