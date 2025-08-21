import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase-admin'
import { computeWorkingDays } from '@/lib/working-days'
import { aggregateMonthly, computeDailyStatus } from '@/lib/attendance-utils'

function mstr(month: number): string { return month.toString().padStart(2, '0') }
// Helper: Calculate distinct present days for a user in a month
async function calculatePresentDays(userId: string, year: number, month: number): Promise<number> {
  const startDate = `${year}-${mstr(month)}-01`
  const endDate = `${year}-${mstr(month)}-31`
  const startOfMonth = new Date(`${startDate}T00:00:00.000Z`)
  const endOfMonth = new Date(new Date(year, month, 0).toISOString().split('T')[0] + 'T23:59:59.999Z')
  const uniqueDates = new Set<string>()

  const snapUserId = await db.collection('attendance')
    .where('userId', '==', userId)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get()
  snapUserId.forEach(doc => {
    const data = doc.data() as any
    const dateVal = typeof data.date === 'string' ? data.date : null
    if (!dateVal) return
    if (data.checkIn || data.status === 'Present') uniqueDates.add(dateVal)
  })

  const snapUidDate = await db.collection('attendance')
    .where('uid', '==', userId)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get()
  snapUidDate.forEach(doc => {
    const data = doc.data() as any
    const dateVal = typeof data.date === 'string' ? data.date : null
    if (!dateVal) return
    if (data.checkIn || data.status === 'Present') uniqueDates.add(dateVal)
  })

  const snapUidCreated = await db.collection('attendance')
    .where('uid', '==', userId)
    .where('createdAt', '>=', startOfMonth)
    .where('createdAt', '<=', endOfMonth)
    .get()
  snapUidCreated.forEach(doc => {
    const data = doc.data() as any
    const ts = data.createdAt?.toDate ? data.createdAt.toDate() : (data.checkIn?.toDate ? data.checkIn.toDate() : null)
    if (!ts) return
    const dateVal = ts.toISOString().split('T')[0]
    if (data.checkIn || data.status === 'Present') uniqueDates.add(dateVal)
  })

  const snapRecords = await db.collection('attendanceRecords')
    .where('userId', '==', userId)
    .get()
  snapRecords.forEach(doc => {
    const data = doc.data() as any
    let dateVal = typeof data.date === 'string' ? data.date : null
    if (!dateVal) {
      const ts = data.clockInTime?.toDate ? data.clockInTime.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : null)
      if (!ts) return
      const y = ts.getUTCFullYear()
      const m = ts.getUTCMonth() + 1
      if (y !== year || m !== month) return
      dateVal = ts.toISOString().split('T')[0]
    } else {
      const [yy, mm] = dateVal.split('-')
      if (parseInt(yy) !== year || parseInt(mm) !== month) return
    }
    if (data.checkIn || data.clockInTime) uniqueDates.add(dateVal)
  })
  return uniqueDates.size
}

// GET /api/payroll/:month/:year — Admin only
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ month: string; year: string }> }
) {
  try {
    // Verify admin token
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authorization header required' }, { status: 401 })
    }
    
    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }
    
    // Get user data to check role
    const userDoc = await db.collection('users').doc(decodedToken.uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }
    
    const userData = userDoc.data()
    if (userData?.role !== 'admin' && userData?.role !== 'Admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }
    
    const resolvedParams = await params
    const month = parseInt(resolvedParams.month)
    const year = parseInt(resolvedParams.year)
    
    if (month < 1 || month > 12 || year < 2020 || year > 2030) {
      return NextResponse.json({ message: 'Invalid month or year' }, { status: 400 })
    }
    
    // Get all employees
    const usersSnapshot = await db.collection('users')
      .where('role', 'in', ['employee', 'Employee', 'hr', 'HR', 'team lead', 'Team Lead'])
      .get()
    
    const { totalWorkingDays } = await computeWorkingDays(year, month)
    const payrollData = []
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      const userId = userDoc.id
      
      // Build monthly attendance summary for compensation
      const records = await db.collection('attendanceRecords').where('userId', '==', userId).get()
      const dailyMap = new Map<string, ReturnType<typeof computeDailyStatus>>()
      records.forEach(doc => {
        const d = doc.data() as any
        let dateStr = typeof d.date === 'string' ? d.date : null
        if (!dateStr) {
          const ts = d.clockInTime?.toDate ? d.clockInTime.toDate() : (d.createdAt?.toDate ? d.createdAt.toDate() : null)
          if (ts) dateStr = ts.toISOString().split('T')[0]
        }
        if (!dateStr) return
        const [yy, mm] = dateStr.split('-')
        if (parseInt(yy) !== year || parseInt(mm) !== month) return
        const checkIn = d.clockInTime?.toDate ? d.clockInTime.toDate() : null
        const checkOut = d.clockOutTime?.toDate ? d.clockOutTime.toDate() : null
        const comp = computeDailyStatus(checkIn, checkOut)
        comp.date = dateStr
        dailyMap.set(dateStr, comp)
      })
      // Apply overrides
      const overridesSnap = await db.collection('attendance_overrides').where('userId', '==', userId).get()
      const overrideMap = new Map<string, number>()
      overridesSnap.forEach(doc => { const d = doc.data() as any; if (d.date) overrideMap.set(d.date, d.dayCredit) })
      const agg = aggregateMonthly(Array.from(dailyMap.values()).map(x => ({ dayCredit: overrideMap.has(x.date) ? Number(overrideMap.get(x.date)) : x.dayCredit, underwork: x.underwork, overtimeHours: x.overtimeHours })))
      const presentDays = agg.presentCredit
      const overtimeHours = agg.overtimeHours
      
      // Calculate salary
      let salaryPaid = 0
      if (userData.salaryType === 'monthly' && userData.salaryAmount) {
        const perDay = userData.salaryAmount / totalWorkingDays
        const perHour = perDay / 9
        salaryPaid = (presentDays * perDay) + (overtimeHours * perHour)
      } else if (userData.salaryType === 'daily' && userData.salaryAmount) {
        const perHour = userData.salaryAmount / 9
        salaryPaid = (presentDays * userData.salaryAmount) + (overtimeHours * perHour)
      }
      
      payrollData.push({
        userId,
        name: userData.name || 'Unknown',
        month,
        year,
        presentDays,
        totalWorkingDays,
        salaryPaid: Math.round(salaryPaid * 100) / 100, // Round to 2 decimal places
        salaryType: userData.salaryType || 'monthly',
        salaryAmount: userData.salaryAmount || 0,
        overtimeHours,
        underworkAlerts: agg.underworkAlerts || 0
      })
    }
    
    return NextResponse.json(payrollData)
  } catch (error) {
    console.error('Error fetching payroll data:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
