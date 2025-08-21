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
  // attendance with userId + date
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

  // attendance with uid + date
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

  // attendance with uid + createdAt
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

  // attendanceRecords by userId; filter month using timestamps if date is absent
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

// GET /api/payroll/me/:month/:year — Authenticated employee
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ month: string; year: string }> }
) {
  try {
    // Verify token
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
    
    const userId = decodedToken.uid
    const resolvedParams = await params
    const month = parseInt(resolvedParams.month)
    const year = parseInt(resolvedParams.year)
    
    if (month < 1 || month > 12 || year < 2020 || year > 2030) {
      return NextResponse.json({ message: 'Invalid month or year' }, { status: 400 })
    }
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }
    
    const userData = userDoc.data()
    
    // Check if payroll already exists
    const payrollDoc = await db.collection('payroll')
      .doc(`${userId}_${month}_${year}`)
      .get()
    
    // Calculate fresh values for dynamic UI regardless of payroll doc existence
    const { totalWorkingDays } = await computeWorkingDays(year, month)
    // Build monthly summary for the user including overtime and underwork
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
    const overridesSnap = await db.collection('attendance_overrides').where('userId', '==', userId).get()
    const overrideMap = new Map<string, number>()
    overridesSnap.forEach(doc => { const d = doc.data() as any; if (d.date) overrideMap.set(d.date, d.dayCredit) })
    const agg = aggregateMonthly(Array.from(dailyMap.values()).map(x => ({ dayCredit: overrideMap.has(x.date) ? Number(overrideMap.get(x.date)) : x.dayCredit, underwork: x.underwork, overtimeHours: x.overtimeHours })))
    const presentDays = agg.presentCredit
    const overtimeHours = agg.overtimeHours

    // Base salary inputs
    const salaryType = (userData?.salaryType || 'monthly') as 'monthly' | 'daily'
    const salaryAmount = userData?.salaryAmount || 0

    // Calculate salary
    let salaryPaid = 0
    if (salaryType === 'monthly' && salaryAmount) {
      const perDay = salaryAmount / totalWorkingDays
      const perHour = perDay / 9
      salaryPaid = (presentDays * perDay) + (overtimeHours * perHour)
    } else if (salaryType === 'daily' && salaryAmount) {
      const perHour = salaryAmount / 9
      salaryPaid = (presentDays * salaryAmount) + (overtimeHours * perHour)
    }

    if (payrollDoc.exists) {
      const payrollData = payrollDoc.data() || {}
      // Return dynamic fields merged with stored document info
      return NextResponse.json({
        userId,
        name: userData?.name || 'Unknown',
        month,
        year,
        presentDays,
        totalWorkingDays,
        salaryPaid: Math.round(salaryPaid * 100) / 100,
        salaryType: payrollData?.salaryType || salaryType,
        salaryAmount: payrollData?.salaryAmount || salaryAmount,
        status: payrollData?.status || 'Unpaid',
        pdfPath: payrollData?.pdfPath || null,
        allowancesTotal: payrollData?.allowancesTotal || 0,
        deductionsTotal: payrollData?.deductionsTotal || 0,
        netPay: payrollData?.netPay ?? Math.round(salaryPaid * 100) / 100,
        overtimeHours,
        underworkAlerts: agg.underworkAlerts || 0
      })
    }

    // No stored payroll: return computed values
    return NextResponse.json({
      userId,
      name: userData?.name || 'Unknown',
      month,
      year,
      presentDays,
      totalWorkingDays,
      salaryPaid: Math.round(salaryPaid * 100) / 100,
      salaryType,
      salaryAmount,
      status: 'Unpaid',
      pdfPath: null,
      allowancesTotal: 0,
      deductionsTotal: 0,
      netPay: Math.round(salaryPaid * 100) / 100,
      overtimeHours,
      underworkAlerts: agg.underworkAlerts || 0
    })
  } catch (error) {
    console.error('Error fetching employee payroll data:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
