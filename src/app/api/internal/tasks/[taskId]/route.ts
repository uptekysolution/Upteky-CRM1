import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';

// PUT /api/internal/tasks/[taskId] - Update a task
export async function PUT(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  try {
    const body = await req.json();
    const { title, assignee, assigneeInitials, dueDate, status, progress, priority } = body;
    const updateData: any = {
      updatedAt: new Date(),
    };
    if (title !== undefined) updateData.title = title;
    if (assignee !== undefined) updateData.assignee = assignee;
    if (assigneeInitials !== undefined) updateData.assigneeInitials = assigneeInitials;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (priority !== undefined) updateData.priority = priority;
    // If status is being updated by a non-employee, stamp assignedBy fields
    if (status !== undefined) {
      const authHeader = req.headers.get('authorization') || ''
      const bearer = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''
      if (bearer) {
        try {
          const decoded = await auth.verifyIdToken(bearer)
          const userDoc = await db.collection('users').doc(decoded.uid).get()
          const roleLower = (userDoc.data()?.role || '').toLowerCase()
          if (roleLower !== 'employee') {
            updateData.assignedById = decoded.uid
            updateData.assignedByRole = roleLower === 'admin' ? 'ADMIN' : (roleLower === 'team lead' ? 'TEAM_LEAD' : 'UNKNOWN')
          }
        } catch {}
      }
    }
    await db.collection('tasks').doc(taskId).update(updateData);
    const updatedDoc = await db.collection('tasks').doc(taskId).get();
    return NextResponse.json({ id: taskId, ...updatedDoc.data() });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/internal/tasks/[taskId] - Delete a task
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  try {
    await db.collection('tasks').doc(taskId).delete();
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}