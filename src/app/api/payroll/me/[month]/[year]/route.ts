import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase-admin'
import { isAdditionalHoliday } from '@/lib/constants/holidays'

// Helper: Calculate working days for a month
function calculateWorkingDays(year: number, month: number): number {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  let workingDays = 0
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0]
    if (!isAdditionalHoliday(dateStr)) {
      workingDays++
    }
  }
  
  return workingDays
}

// Helper: Calculate present days for a user in a month
async function calculatePresentDays(userId: string, year: number, month: number): Promise<number> {
  const monthStr = month.toString().padStart(2, '0')
  const startDate = `${year}-${monthStr}-01`
  const endDate = `${year}-${monthStr}-31`
  
  const snapshot = await db.collection('attendance')
    .where('userId', '==', userId)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .where('status', '==', 'Present')
    .get()
  
  return snapshot.size
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
    
    if (payrollDoc.exists) {
      const payrollData = payrollDoc.data()
      return NextResponse.json({
        userId,
        name: userData?.name || 'Unknown',
        month,
        year,
        presentDays: payrollData?.presentDays || 0,
        totalWorkingDays: payrollData?.totalWorkingDays || 0,
        salaryPaid: payrollData?.salaryPaid || 0,
        salaryType: payrollData?.salaryType || userData?.salaryType || 'monthly',
        salaryAmount: payrollData?.salaryAmount || userData?.salaryAmount || 0,
        status: payrollData?.status || 'Unpaid',
        pdfPath: payrollData?.pdfPath || null,
        allowancesTotal: payrollData?.allowancesTotal || 0,
        deductionsTotal: payrollData?.deductionsTotal || 0,
        netPay: payrollData?.netPay,
      })
    }
    
    // Calculate payroll data
    const totalWorkingDays = calculateWorkingDays(year, month)
    const presentDays = await calculatePresentDays(userId, year, month)
    
    // Calculate salary
    let salaryPaid = 0
    if (userData?.salaryType === 'monthly' && userData?.salaryAmount) {
      salaryPaid = (presentDays / totalWorkingDays) * userData.salaryAmount
    } else if (userData?.salaryType === 'daily' && userData?.salaryAmount) {
      salaryPaid = presentDays * userData.salaryAmount
    }
    
    return NextResponse.json({
      userId,
      name: userData?.name || 'Unknown',
      month,
      year,
      presentDays,
      totalWorkingDays,
      salaryPaid: Math.round(salaryPaid * 100) / 100, // Round to 2 decimal places
      salaryType: userData?.salaryType || 'monthly',
      salaryAmount: userData?.salaryAmount || 0,
      status: 'Unpaid',
      pdfPath: null,
      allowancesTotal: 0,
      deductionsTotal: 0,
      netPay: Math.round(salaryPaid * 100) / 100,
    })
  } catch (error) {
    console.error('Error fetching employee payroll data:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
