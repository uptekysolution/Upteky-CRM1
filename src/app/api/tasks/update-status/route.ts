import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase-admin'

function normalizeRole(role?: string): string { return (role || '').toLowerCase() }

const EMPLOYEE_ROLE_VALUES = new Set(['employee'])

const ALLOWED_TRANSITIONS_FOR_EMPLOYEE: Record<string, string[]> = {
  'To Do': ['In Progress'],
  'In Progress': ['In Review'],
  'In Review': ['To Do', 'In Progress'],
  'Completed': [],
  'Cancelled': [],
}

export async function PUT(req: NextRequest) {
  try {
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
    const role = normalizeRole(userDoc.data()?.role)

    const { taskId, status: newStatus } = await req.json()
    if (!taskId || !newStatus) return NextResponse.json({ message: 'Missing taskId or status' }, { status: 400 })

    const taskSnap = await db.collection('tasks').doc(String(taskId)).get()
    if (!taskSnap.exists) return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    const task = taskSnap.data() as any
    const currentStatus: string = task.status

    // Employees cannot move to Completed or Cancelled, and have limited transitions
    if (EMPLOYEE_ROLE_VALUES.has(role)) {
      if (newStatus === 'Completed' || newStatus === 'Cancelled') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
      const allowedNext = ALLOWED_TRANSITIONS_FOR_EMPLOYEE[currentStatus] || []
      if (!allowedNext.includes(newStatus)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
      // Optional: Ensure employee is the assignee of the task they're moving
      if (task.assigneeId !== decoded.uid) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
    }

    await db.collection('tasks').doc(String(taskId)).update({ status: String(newStatus), updatedAt: new Date() })
    return NextResponse.json({ message: 'Status updated' })
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}


