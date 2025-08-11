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
    
    const totalWorkingDays = calculateWorkingDays(year, month)
    const payrollData = []
    
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
      
      payrollData.push({
        userId,
        name: userData.name || 'Unknown',
        month,
        year,
        presentDays,
        totalWorkingDays,
        salaryPaid: Math.round(salaryPaid * 100) / 100, // Round to 2 decimal places
        salaryType: userData.salaryType || 'monthly',
        salaryAmount: userData.salaryAmount || 0
      })
    }
    
    return NextResponse.json(payrollData)
  } catch (error) {
    console.error('Error fetching payroll data:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
