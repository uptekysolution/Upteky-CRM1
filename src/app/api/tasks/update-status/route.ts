import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase-admin'

function normalizeRole(role?: string): string { return (role || '').toLowerCase() }

const EMPLOYEE_ROLE_VALUES = new Set(['employee'])
const TEAM_LEAD_ROLE_VALUES = new Set(['team lead', 'team_lead', 'teamlead'])

const ALLOWED_TRANSITIONS_FOR_EMPLOYEE: Record<string, string[]> = {
  'To Do': ['In Progress'],
  'In Progress': ['In Review'],
  'In Review': ['To Do', 'In Progress'],
  'Completed': [],
  'Cancelled': [],
}

const ALLOWED_TRANSITIONS_FOR_TEAM_LEAD: Record<string, string[]> = {
  'To Do': ['In Progress', 'Cancelled'],
  'In Progress': ['In Review', 'Cancelled'],
  'In Review': ['To Do', 'In Progress', 'Completed', 'Cancelled'],
  'Completed': ['In Review'], // Can only move back to review, not cancel completed tasks
  'Cancelled': ['To Do', 'In Progress'], // Can reactivate cancelled tasks
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

    // Prevent invalid status transitions
    if (newStatus === currentStatus) {
      return NextResponse.json({ message: 'Task is already in this status' }, { status: 400 })
    }

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
    } else if (TEAM_LEAD_ROLE_VALUES.has(role)) {
      // Team Leads can move to any status but must follow logical transitions
      const allowedNext = ALLOWED_TRANSITIONS_FOR_TEAM_LEAD[currentStatus] || []
      if (!allowedNext.includes(newStatus)) {
        return NextResponse.json({ message: 'Invalid status transition' }, { status: 400 })
      }
      
      // Team Leads can only update tasks they created or are assigned to manage
      let hasPermission = false
      
      // Check if they created the task
      if (task.createdById === decoded.uid) {
        hasPermission = true
      }
      // Check if they are assigned to the task
      else if (task.assigneeId === decoded.uid) {
        hasPermission = true
      }
      // Check if they lead the team that the task assignee belongs to
      else {
        try {
          const leadTeamsSnap = await db.collection('teamMembers')
            .where('userId', '==', decoded.uid)
            .where('role', '==', 'lead')
            .get()
          const leadTeamIds = leadTeamsSnap.docs.map((d: any) => d.data().teamId).filter(Boolean)
          
          if (leadTeamIds.length > 0) {
            // Check if task assignee is in one of their teams
            const assigneeTeamSnap = await db.collection('teamMembers')
              .where('userId', '==', task.assigneeId)
              .where('teamId', 'in', leadTeamIds)
              .get()
            if (!assigneeTeamSnap.empty) {
              hasPermission = true
            }
          }
        } catch (error) {
          console.error('Error checking team membership:', error)
        }
      }
      
      if (!hasPermission) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
    }

    const updates: any = { status: String(newStatus), updatedAt: new Date() }
    if (!EMPLOYEE_ROLE_VALUES.has(role)) {
      const creatorRole = role === 'admin' ? 'ADMIN' : (TEAM_LEAD_ROLE_VALUES.has(role) ? 'TEAM_LEAD' : 'UNKNOWN')
      updates.assignedById = decoded.uid
      updates.assignedByRole = creatorRole
    }
    await db.collection('tasks').doc(String(taskId)).update(updates)
    return NextResponse.json({ message: 'Status updated' })
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}


