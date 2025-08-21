import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase-admin'

// PATCH /api/attendance/override/:userId/:date  body: { dayCredit: 0|0.5|1, reason?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; date: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authorization header required' }, { status: 401 })
    }
    const token = authHeader.split('Bearer ')[1]
    let decoded
    try { decoded = await auth.verifyIdToken(token) } catch { return NextResponse.json({ message: 'Invalid token' }, { status: 401 }) }

    const adminDoc = await db.collection('users').doc(decoded.uid).get()
    const role = (adminDoc.data()?.role || '').toLowerCase()
    if (!['admin', 'sub-admin', 'hr'].includes(role)) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    const { userId, date } = await params
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ message: 'Invalid date' }, { status: 400 })
    const body = await req.json()
    const dayCredit = Number(body?.dayCredit)
    if (![0, 0.5, 1].includes(dayCredit)) return NextResponse.json({ message: 'Invalid dayCredit' }, { status: 400 })
    const reason = typeof body?.reason === 'string' ? body.reason : ''

    await db.collection('attendance_overrides').doc(`${userId}_${date}`).set({
      userId,
      date,
      dayCredit,
      reason: reason || null,
      updatedBy: decoded.uid,
      updatedAt: new Date()
    }, { merge: true })

    return NextResponse.json({ message: 'Override saved', dayCredit })
  } catch (e) {
    console.error('Error overriding attendance:', e)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}


