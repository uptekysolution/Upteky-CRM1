import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';

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
    // Enforce auth and role (ADMIN or TEAM_LEAD)
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authorization header required' }, { status: 401 })
    }
    const token = authHeader.split('Bearer ')[1]
    let decoded
    try {
      decoded = await auth.verifyIdToken(token)
    } catch {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }

    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (!userDoc.exists) return NextResponse.json({ message: 'User not found' }, { status: 404 })
    const roleLower = (userDoc.data()?.role || '').toLowerCase()
    const creatorRole = roleLower === 'admin' ? 'ADMIN' : (roleLower === 'team lead' ? 'TEAM_LEAD' : 'UNKNOWN')
    if (creatorRole === 'UNKNOWN') return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

    const body = await req.json();
    const { title, assigneeId, assigneeName, assigneeEmail, dueDate, priority, progress } = body;
    if (!title || !assigneeId || !dueDate || !priority) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    const now = new Date()
    const newTask = {
      title,
      description: String(body.description || ''),
      assigneeId: String(assigneeId),
      assigneeName: String(assigneeName || ''),
      assigneeEmail: String(assigneeEmail || ''),
      deadline: new Date(dueDate),
      priority: String(priority),
      status: 'To Do',
      progress: Number(progress) || 0,
      createdBy: decoded.uid,
      createdById: decoded.uid,
      createdByRole: creatorRole,
      assignedById: decoded.uid,
      assignedByRole: creatorRole,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await db.collection('tasks').add(newTask);
    return NextResponse.json({ id: docRef.id, ...newTask }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}