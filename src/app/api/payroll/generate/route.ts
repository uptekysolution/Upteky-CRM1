import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase-admin'
import { computeWorkingDays } from '@/lib/working-days'

function mstr(month: number): string { return month.toString().padStart(2, '0') }
// Helper: Calculate distinct present days for a user in a month
async function calculatePresentDays(userId: string, year: number, month: number): Promise<number> {
  const startDate = `${year}-${mstr(month)}-01`
  const endDate = `${year}-${mstr(month)}-31`
  const startOfMonth = new Date(`${startDate}T00:00:00.000Z`)
  const endOfMonth = new Date(new Date(year, month, 0).toISOString().split('T')[0] + 'T23:59:59.999Z')
  const uniqueDates = new Set<string>()
  const snapshot = await db.collection('attendance')
    .where('userId', '==', userId)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get()
  snapshot.forEach(doc => {
    const data = doc.data() as any
    const dateVal = typeof data.date === 'string' ? data.date : null
    if (!dateVal) return
    if (data.checkIn || data.status === 'Present') {
      uniqueDates.add(dateVal)
    }
  })
  const snapshot2 = await db.collection('attendanceRecords')
    .where('userId', '==', userId)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get()
  snapshot2.forEach(doc => {
    const data = doc.data() as any
    const dateVal = typeof data.date === 'string' ? data.date : null
    if (!dateVal) return
    if (data.checkIn || data.clockInTime) {
      uniqueDates.add(dateVal)
    }
  })
  // Alternate form: attendance with uid field
  const snapshotUid = await db.collection('attendance')
    .where('uid', '==', userId)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get()
  snapshotUid.forEach(doc => {
    const data = doc.data() as any
    const dateVal = typeof data.date === 'string' ? data.date : null
    if (!dateVal) return
    if (data.checkIn || data.status === 'Present') {
      uniqueDates.add(dateVal)
    }
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
  return uniqueDates.size
}

// POST /api/payroll/generate — Admin only
export async function POST(req: NextRequest) {
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
    
    // Parse request body
    const { month, year } = await req.json()
    
    if (!month || !year || month < 1 || month > 12 || year < 2020 || year > 2030) {
      return NextResponse.json({ message: 'Invalid month or year' }, { status: 400 })
    }
    
    // Get all employees
    const usersSnapshot = await db.collection('users')
      .where('role', 'in', ['employee', 'Employee', 'hr', 'HR', 'team lead', 'Team Lead'])
      .get()
    
    const { totalWorkingDays } = await computeWorkingDays(year, month)
    const generatedPayrolls = []
    
    // Generate payroll for each employee
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      const userId = userDoc.id
      
      // Calculate present days
      const presentDays = await calculatePresentDays(userId, year, month)
      
      // Calculate salary
      let salaryPaid = 0
      if (userData.salaryType === 'monthly' && userData.salaryAmount) {
        salaryPaid = (presentDays / totalWorkingDays) * userData.salaryAmount
      } else if (userData.salaryType === 'daily' && userData.salaryAmount) {
        salaryPaid = presentDays * userData.salaryAmount
      }
      
      // Create or update payroll document
      const payrollId = `${userId}_${month}_${year}`
      const payrollData = {
        userId,
        month,
        year,
        presentDays,
        totalWorkingDays,
        salaryPaid: Math.round(salaryPaid * 100) / 100, // Round to 2 decimal places
        salaryType: userData.salaryType || 'monthly',
        salaryAmount: userData.salaryAmount || 0,
        status: 'Unpaid',
        createdAt: new Date()
      }
      
      await db.collection('payroll').doc(payrollId).set(payrollData, { merge: true })
      
      generatedPayrolls.push({
        id: payrollId,
        ...payrollData
      })
    }
    
    return NextResponse.json({
      message: `Payroll generated for ${generatedPayrolls.length} employees`,
      payrolls: generatedPayrolls
    })
  } catch (error) {
    console.error('Error generating payroll:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
