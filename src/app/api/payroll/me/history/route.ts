import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase-admin'

// GET /api/payroll/me/history — Authenticated employee
export async function GET(req: NextRequest) {
  try {
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

    // Fetch by userId only to avoid index requirements; sort in memory
    const snapshot = await db.collection('payroll')
      .where('userId', '==', userId)
      .get()

    const history = snapshot.docs.map((doc) => {
      const data = doc.data() as any
      return {
        id: doc.id,
        userId: data.userId,
        name: data.name || undefined,
        month: data.month,
        year: data.year,
        presentDays: data.presentDays || 0,
        totalWorkingDays: data.totalWorkingDays || 0,
        salaryPaid: data.salaryPaid || 0,
        salaryType: data.salaryType || 'monthly',
        salaryAmount: data.salaryAmount || 0,
        status: data.status || 'Unpaid',
        pdfPath: data.pdfPath || null,
        allowancesTotal: data.allowancesTotal || 0,
        deductionsTotal: data.deductionsTotal || 0,
        netPay: typeof data.netPay === 'number' ? data.netPay : undefined,
        createdAt: data.createdAt ? new Date(data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt) : undefined,
      }
    })
    // Sort by year desc, month desc, then createdAt desc
    history.sort((a, b) => {
      if ((b.year || 0) !== (a.year || 0)) return (b.year || 0) - (a.year || 0)
      if ((b.month || 0) !== (a.month || 0)) return (b.month || 0) - (a.month || 0)
      const at = a.createdAt ? a.createdAt.getTime() : 0
      const bt = b.createdAt ? b.createdAt.getTime() : 0
      return bt - at
    })
    const limited = history.slice(0, 24)
    return NextResponse.json(limited)
  } catch (error) {
    console.error('Error fetching payroll history:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}


