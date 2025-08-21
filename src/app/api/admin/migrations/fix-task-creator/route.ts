import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase-admin'

// POST /api/admin/migrations/fix-task-creator
// For existing wrong records where createdByRole = "ADMIN" but assignedByRole = "TEAM_LEAD",
// set createdByRole = "TEAM_LEAD" and createdById = assignedById.
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authorization header required' }, { status: 401 })
    }
    const token = authHeader.substring(7)
    let decoded
    try {
      decoded = await auth.verifyIdToken(token)
    } catch {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }
    // Only admins can run migration
    const userDoc = await db.collection('users').doc(decoded.uid).get()
    const roleLower = (userDoc.data()?.role || '').toLowerCase()
    if (roleLower !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const snapshot = await db.collection('tasks')
      .where('createdByRole', '==', 'ADMIN')
      .get()

    let updated = 0
    const batch = db.batch()
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data() as any
      if (data.assignedByRole === 'TEAM_LEAD' && data.assignedById) {
        batch.update(docSnap.ref, {
          createdByRole: 'TEAM_LEAD',
          createdById: data.assignedById,
        })
        updated += 1
      }
    })
    if (updated > 0) await batch.commit()
    return NextResponse.json({ updated })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}


