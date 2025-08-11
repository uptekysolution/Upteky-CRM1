import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase-admin'

// PATCH /api/users/:id/salary — Admin only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const userId = resolvedParams.id
    
    // Parse request body
    const { salaryType, salaryAmount } = await req.json()
    
    if (!salaryType || !salaryAmount) {
      return NextResponse.json({ message: 'salaryType and salaryAmount are required' }, { status: 400 })
    }
    
    if (!['monthly', 'daily'].includes(salaryType)) {
      return NextResponse.json({ message: 'salaryType must be "monthly" or "daily"' }, { status: 400 })
    }
    
    if (typeof salaryAmount !== 'number' || salaryAmount <= 0) {
      return NextResponse.json({ message: 'salaryAmount must be a positive number' }, { status: 400 })
    }
    
    // Check if target user exists
    const targetUserDoc = await db.collection('users').doc(userId).get()
    if (!targetUserDoc.exists) {
      return NextResponse.json({ message: 'Target user not found' }, { status: 404 })
    }
    
    // Update user salary
    await db.collection('users').doc(userId).update({
      salaryType,
      salaryAmount: Math.round(salaryAmount * 100) / 100, // Round to 2 decimal places
      updatedAt: new Date(),
      updatedBy: decodedToken.uid
    })
    
    return NextResponse.json({
      message: 'Salary updated successfully',
      userId,
      salaryType,
      salaryAmount: Math.round(salaryAmount * 100) / 100
    })
  } catch (error) {
    console.error('Error updating user salary:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
