import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase-admin'

function normalizeRole(role?: string): string { return (role || '').toLowerCase() }

const CREATOR_ROLES = new Set(['admin', 'team lead', 'manager', 'sub-admin'])

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
    if (!userDoc.exists) return NextResponse.json({ message: 'User not found' }, { status: 404 })
    const role = normalizeRole(userDoc.data()?.role)
    if (!CREATOR_ROLES.has(role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title,
      agenda,
      date,
      startTime,
      endTime,
      participants,
      location,
      meetingLink,
      notes,
      status,
    } = body || {}

    if (!title || !agenda || !date || !startTime || !endTime || !participants?.length) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const now = new Date()
    const meetingData = {
      title: String(title),
      agenda: String(agenda),
      date: new Date(date),
      startTime: String(startTime),
      endTime: String(endTime),
      participants: participants.map((p: any) => ({
        userId: String(p.userId),
        userName: String(p.userName),
        userEmail: String(p.userEmail),
        attended: Boolean(p.attended || false),
        response: (p.response || 'pending') as 'accepted' | 'declined' | 'pending',
      })),
      createdBy: decoded.uid,
      createdAt: now,
      updatedAt: now,
      location: location ? String(location) : undefined,
      meetingLink: meetingLink ? String(meetingLink) : undefined,
      notes: notes ? String(notes) : undefined,
      status: status ? String(status) : 'Scheduled',
    }

    // Remove undefined values before writing to Firestore
    const sanitized = Object.fromEntries(
      Object.entries(meetingData).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>

    const ref = await db.collection('meetings').add(sanitized)
    return NextResponse.json({ id: ref.id, message: 'Meeting created' }, { status: 201 })
  } catch (error) {
    console.error('Error creating meeting:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}


