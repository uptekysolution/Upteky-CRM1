import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase-admin'

function normalizeRoleLower(role?: string): string {
  return (role || '').toLowerCase()
}

function toCreatorRoleUpper(roleLower: string): 'ADMIN' | 'TEAM_LEAD' | 'UNKNOWN' {
  if (roleLower === 'admin') return 'ADMIN'
  if (roleLower === 'team lead' || roleLower === 'team_lead' || roleLower === 'teamlead') return 'TEAM_LEAD'
  return 'UNKNOWN'
}

export async function POST(req: NextRequest) {
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
    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }
    const roleLower = normalizeRoleLower(userDoc.data()?.role)
    const creatorRole = toCreatorRoleUpper(roleLower)
    // Only ADMIN and TEAM_LEAD may create tasks
    if (creatorRole === 'UNKNOWN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title,
      description,
      deadline,
      priority,
      // status is ignored server-side; defaulted to "To Do"
      assigneeId,
      assigneeName,
      assigneeEmail,
      estimatedHours = 0,
      tags = [],
      attachments = [],
      progress = 0,
      projectId,
    } = body || {}

    if (!title || !assigneeId || !deadline || !priority) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const now = new Date()
    const taskData = {
      title: String(title),
      description: String(description || ''),
      deadline: new Date(deadline),
      priority: String(priority),
      status: 'To Do',
      assigneeId: String(assigneeId),
      assigneeName: String(assigneeName || ''),
      assigneeEmail: String(assigneeEmail || ''),
      createdBy: decoded.uid,
      createdById: decoded.uid,
      createdByRole: creatorRole,
      assignedById: decoded.uid,
      assignedByRole: creatorRole,
      createdAt: now,
      updatedAt: now,
      progress: Number(progress) || 0,
      estimatedHours: Number(estimatedHours) || 0,
      tags,
      attachments,
      ...(projectId ? { projectId: String(projectId) } : {}),
    }

    const ref = await db.collection('tasks').add(taskData)
    return NextResponse.json({ id: ref.id, ...taskData }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}


