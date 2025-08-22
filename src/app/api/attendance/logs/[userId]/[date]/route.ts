import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase-admin'
import { computeDailyStatus } from '@/lib/attendance-utils'
import { canViewAttendanceRecord, getUserPermissions } from '@/lib/attendance-permissions'

// GET /api/attendance/logs/:userId/:date (YYYY-MM-DD)
export async function GET(
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

    const { userId, date } = await params
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ message: 'Invalid date' }, { status: 400 })

    // Authorization: check permissions
    const viewerId = decoded.uid
    let canView = viewerId === userId // User can always view their own records
    
    if (!canView) {
      try {
        // Get viewer's role and permissions
        const viewerDoc = await db.collection('users').doc(viewerId).get()
        if (!viewerDoc.exists) {
          return NextResponse.json({ message: 'Viewer not found' }, { status: 404 })
        }
        
        const viewerData = viewerDoc.data()
        const viewerRole = viewerData?.role || 'Employee'
        const viewerPermissions = await getUserPermissions(viewerId)
        
        // Check if viewer can access this user's attendance
        canView = await canViewAttendanceRecord(userId, viewerId, viewerRole, viewerPermissions)
      } catch (error) {
        console.error('Error checking attendance permissions:', error)
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
    }
    
    if (!canView) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Fetch records for this date
    const primary = await db.collection('attendanceRecords').where('userId', '==', userId).get()
    const items: any[] = []
    primary.forEach(doc => {
      const d = doc.data() as any
      let dstr = typeof d.date === 'string' ? d.date : null
      if (!dstr) {
        const ts = d.clockInTime?.toDate ? d.clockInTime.toDate() : (d.createdAt?.toDate ? d.createdAt.toDate() : null)
        if (ts) dstr = ts.toISOString().split('T')[0]
      }
      if (dstr !== date) return
      const checkIn = d.clockInTime?.toDate ? d.clockInTime.toDate() : null
      const checkOut = d.clockOutTime?.toDate ? d.clockOutTime.toDate() : null
      const comp = computeDailyStatus(checkIn, checkOut)
      comp.date = date
      items.push({
        date,
        checkIn,
        checkOut,
        totalHours: comp.totalHours,
        status: comp.status,
        dayCredit: comp.dayCredit,
        underwork: comp.underwork,
        overtimeHours: comp.overtimeHours
      })
    })

    return NextResponse.json({ logs: items })
  } catch (e) {
    console.error('Error fetching attendance logs:', e)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}


