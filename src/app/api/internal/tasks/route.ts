import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// GET /api/internal/tasks - List all tasks
export async function GET(req: NextRequest) {
  try {
    const snapshot = await db.collection('tasks').get();
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/internal/tasks - Create a new task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, assignee, assigneeInitials, dueDate, status, progress, priority } = body;
    if (!title || !assignee || !dueDate || !status || !priority) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    const newTask = {
      title,
      assignee,
      assigneeInitials: assigneeInitials || '',
      dueDate,
      status,
      progress: progress ?? 0,
      priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const docRef = await db.collection('tasks').add(newTask);
    return NextResponse.json({ id: docRef.id, ...newTask }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}