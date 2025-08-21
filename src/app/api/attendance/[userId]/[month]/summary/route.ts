import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase-admin'
import { computeWorkingDays } from '@/lib/working-days'

function toMonthStr(month: number): string {
  return month.toString().padStart(2, '0')
}

async function countPresentDays(userId: string, year: number, month: number): Promise<number> {
  const monthStr = toMonthStr(month)
  const startDate = `${year}-${monthStr}-01`
  const endDate = `${year}-${monthStr}-31`
  const startOfMonth = new Date(`${startDate}T00:00:00.000Z`)
  const endOfMonth = new Date(new Date(year, month, 0).toISOString().split('T')[0] + 'T23:59:59.999Z')

  // Support records that store either attendance entries per day or per event.
  // We count distinct dates with any check-in (status Present), collapsing duplicates.
  const dateSet = new Set<string>()
  // Primary form: attendance with userId
  const snapshot = await db.collection('attendance')
    .where('userId', '==', userId)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get()
  snapshot.forEach(doc => {
    const data = doc.data() as any
    const dateVal = typeof data.date === 'string' ? data.date : null
    if (!dateVal) return
    // Valid check-in considered if there is a checkIn timestamp or explicit Present status
    const hasCheckIn = !!data.checkIn || data.status === 'Present'
    if (hasCheckIn) {
      dateSet.add(dateVal)
    }
  })
  // Alternate form: attendance with uid instead of userId
  const snapshotUid = await db.collection('attendance')
    .where('uid', '==', userId)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get()
  snapshotUid.forEach(doc => {
    const data = doc.data() as any
    const dateVal = typeof data.date === 'string' ? data.date : null
    if (!dateVal) return
    const hasCheckIn = !!data.checkIn || data.status === 'Present'
    if (hasCheckIn) {
      dateSet.add(dateVal)
    }
  })
  // Fallback form: attendance without date, use createdAt range
  const snapshotCreatedAt = await db.collection('attendance')
    .where('uid', '==', userId)
    .where('createdAt', '>=', startOfMonth)
    .where('createdAt', '<=', endOfMonth)
    .get()
  snapshotCreatedAt.forEach(doc => {
    const data = doc.data() as any
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : null)
    if (!createdAt) return
    const dateVal = createdAt.toISOString().split('T')[0]
    const hasCheckIn = !!data.checkIn || !!data.clockInTime || data.status === 'Present'
    if (hasCheckIn) {
      dateSet.add(dateVal)
    }
  })
  // Fallback: also look into attendanceRecords collection
  const snapshot2 = await db.collection('attendanceRecords')
    .where('userId', '==', userId)
    .get()
  snapshot2.forEach(doc => {
    const data = doc.data() as any
    let dateVal = typeof data.date === 'string' ? data.date : null
    if (!dateVal) {
      const ts = data.clockInTime?.toDate ? data.clockInTime.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : null)
      if (ts) dateVal = ts.toISOString().split('T')[0]
    }
    if (!dateVal) return
    const [yy, mm] = dateVal.split('-')
    if (parseInt(yy) !== year || parseInt(mm) !== month) return
    const hasCheckIn = !!data.checkIn || !!data.clockInTime
    if (hasCheckIn) {
      dateSet.add(dateVal)
    }
  })

  // Last-resort: fetch recent attendance by uid and filter by month in memory (avoids composite index)
  try {
    const recentByUid = await db.collection('attendance')
      .where('uid', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1000)
      .get()
    recentByUid.forEach(doc => {
      const data = doc.data() as any
      const ts = data.createdAt?.toDate ? data.createdAt.toDate() : (data.checkIn?.toDate ? data.checkIn.toDate() : null)
      if (!ts) return
      if ((ts.getUTCFullYear() === year) && (ts.getUTCMonth() + 1 === month)) {
        const dateVal = ts.toISOString().split('T')[0]
        const hasCheckIn = !!data.checkIn || data.status === 'Present'
        if (hasCheckIn) dateSet.add(dateVal)
      }
    })
  } catch (e) {
    // ignore
  }
  return dateSet.size
}

// GET /api/attendance/:userId/:month/summary?year=YYYY
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; month: string }> }
) {
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

    const resolved = await params
    const month = parseInt(resolved.month)
    const userIdParam = resolved.userId
    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get('year') || `${new Date().getFullYear()}`)

    if (!month || month < 1 || month > 12) {
      return NextResponse.json({ message: 'Invalid month' }, { status: 400 })
    }
    if (!year || year < 2000 || year > 2100) {
      return NextResponse.json({ message: 'Invalid year' }, { status: 400 })
    }

    // Authorization: allow self or admins/HR
    const viewerId = decoded.uid
    let canView = viewerId === userIdParam
    if (!canView) {
      const viewerDoc = await db.collection('users').doc(viewerId).get()
      const role = (viewerDoc.data()?.role || '').toLowerCase()
      canView = ['admin', 'sub-admin', 'hr'].includes(role)
    }
    if (!canView) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { totalWorkingDays } = await computeWorkingDays(year, month)
    const presentDays = await countPresentDays(userIdParam, year, month)
    const attendanceRate = totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 0

    return NextResponse.json({
      userId: userIdParam,
      month,
      year,
      presentDays,
      workingDays: totalWorkingDays,
      attendanceRate
    })
  } catch (e) {
    console.error('Error computing attendance summary:', e)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}


