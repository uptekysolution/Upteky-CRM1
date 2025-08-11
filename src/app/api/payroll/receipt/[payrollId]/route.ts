import { NextRequest, NextResponse } from 'next/server'
import { db, auth } from '@/lib/firebase-admin'
import { generatePayslipPDF } from '@/lib/pdf-generator'

// GET /api/payroll/receipt/:payrollId — Authenticated
// Test endpoint: GET /api/payroll/receipt/test-pdf (for debugging)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ payrollId: string }> }
) {
  try {
    // Verify token
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header')
      return NextResponse.json({ message: 'Authorization header required' }, { status: 401 })
    }
    
    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
      console.log('Token verified successfully for user:', decodedToken.uid)
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }
    
    const userId = decodedToken.uid
    const resolvedParams = await params
    const payrollId = resolvedParams.payrollId
    
    console.log('Receipt request:', { userId, payrollId })
    
    // Get payroll data
    const payrollDoc = await db.collection('payroll').doc(payrollId).get()
    if (!payrollDoc.exists) {
      console.log('Payroll not found for ID:', payrollId)
      return NextResponse.json({ message: 'Payroll not found' }, { status: 404 })
    }
    
    const payrollData = payrollDoc.data()
    console.log('Payroll data retrieved:', payrollData)
    
    // Check access permissions first
    const userDoc = await db.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      console.log('User document not found for ID:', userId)
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }
    
    const userData = userDoc.data()
    console.log('User document data:', userData)
    
    // Debug logging
    console.log('User data:', {
      userId,
      userRole: userData?.role,
      payrollUserId: payrollData?.userId,
      isOwner: payrollData?.userId === userId
    })
    
    const isAdmin = userData?.role === 'admin' || userData?.role === 'Admin' || 
                   userData?.role === 'ADMIN' || userData?.role?.toLowerCase() === 'admin'
    const isHR = userData?.role === 'hr' || userData?.role === 'HR' || 
                 userData?.role === 'Hr' || userData?.role?.toLowerCase() === 'hr'
    const isTeamLead = userData?.role === 'team lead' || userData?.role === 'Team Lead' || 
                       userData?.role === 'Team Lead' || userData?.role?.toLowerCase() === 'team lead'
    const isOwner = payrollData?.userId === userId
    
    console.log('Access check:', { isAdmin, isHR, isTeamLead, isOwner, userRole: userData?.role })
    
    // Allow access if user is admin, HR, team lead, or owner of the payroll
    if (!isAdmin && !isHR && !isTeamLead && !isOwner) {
      console.log('Access denied for user:', { 
        userId, 
        userRole: userData?.role, 
        payrollUserId: payrollData?.userId,
        isAdmin,
        isHR,
        isTeamLead,
        isOwner,
        roleCheck: {
          adminCheck: userData?.role === 'admin' || userData?.role === 'Admin' || userData?.role === 'ADMIN',
          hrCheck: userData?.role === 'hr' || userData?.role === 'HR' || userData?.role === 'Hr',
          teamLeadCheck: userData?.role === 'team lead' || userData?.role === 'Team Lead',
          ownerCheck: payrollData?.userId === userId
        }
      })
      return NextResponse.json({ 
        message: 'Access denied. You need to be an Admin, HR, Team Lead, or the owner of this payroll record.',
        details: {
          userRole: userData?.role,
          payrollOwner: payrollData?.userId,
          isOwner: payrollData?.userId === userId
        }
      }, { status: 403 })
    }
    
    // If payroll data doesn't have a name, fetch it from user document
    if (!payrollData?.name && payrollData?.userId) {
      try {
        const payrollUserDoc = await db.collection('users').doc(payrollData.userId).get()
        if (payrollUserDoc.exists) {
          const payrollUserData = payrollUserDoc.data()
          if (payrollData) {
            payrollData.name = payrollUserData?.name || 
                              (payrollUserData?.firstName && payrollUserData?.lastName ? 
                               `${payrollUserData.firstName} ${payrollUserData.lastName}` : 'Unknown')
            console.log('Fetched name for payroll user:', payrollData.name)
          }
        } else {
          console.log('Payroll user document not found, setting default name')
          if (payrollData) {
            payrollData.name = 'Unknown Employee'
          }
        }
      } catch (error) {
        console.error('Error fetching payroll user data:', error)
        if (payrollData) {
          payrollData.name = 'Unknown Employee'
        }
      }
    }
    
    // Ensure we have a name for the PDF generation
    if (payrollData && !payrollData.name) {
      payrollData.name = 'Unknown Employee'
      console.log('Set default name for payroll data')
    }
    
    // Validate payroll data has required fields
    console.log('Validating payroll data fields:', {
      hasUserId: !!payrollData?.userId,
      hasMonth: !!payrollData?.month,
      hasYear: !!payrollData?.year,
      hasSalaryPaid: !!payrollData?.salaryPaid,
      hasName: !!payrollData?.name,
      userId: payrollData?.userId,
      month: payrollData?.month,
      year: payrollData?.year,
      salaryPaid: payrollData?.salaryPaid,
      name: payrollData?.name
    })
    
    if (!payrollData?.userId || !payrollData?.month || !payrollData?.year || payrollData?.salaryPaid === undefined || payrollData?.salaryPaid === null) {
      console.log('Payroll data missing required fields:', payrollData)
      return NextResponse.json({ 
        message: 'Payroll data is incomplete',
        details: {
          hasUserId: !!payrollData?.userId,
          hasMonth: !!payrollData?.month,
          hasYear: !!payrollData?.year,
          hasSalaryPaid: !!payrollData?.salaryPaid,
          hasName: !!payrollData?.name
        }
      }, { status: 400 })
    }
    
    // If PDF already exists, return signed URL
    if (payrollData?.pdfPath) {
      // For now, return the path. In production, you'd generate a signed URL
      return NextResponse.json({
        pdfPath: payrollData.pdfPath,
        message: 'PDF already exists'
      })
    }
    
    // Generate PDF with safe data
    if (!payrollData) {
      console.error('Payroll data is undefined, cannot generate PDF')
      return NextResponse.json({ message: 'Payroll data is missing' }, { status: 400 })
    }
    
    const safePayrollData = {
      ...payrollData,
      name: payrollData.name || 'Unknown Employee',
      presentDays: payrollData.presentDays || 0,
      totalWorkingDays: payrollData.totalWorkingDays || 25,
      salaryAmount: payrollData.salaryAmount || 0,
      salaryType: payrollData.salaryType || 'monthly',
      month: payrollData.month || 1,
      year: payrollData.year || new Date().getFullYear(),
      userId: payrollData.userId || 'Unknown'
    }
    
    console.log('Generating PDF with safe data:', safePayrollData)
    
    // Generate PDF payslip
    let pdfBuffer
    try {
      console.log('Starting PDF generation...')
      pdfBuffer = await generatePayslipPDF(safePayrollData)
      console.log('PDF payslip generated successfully, size:', pdfBuffer.length, 'bytes')
      
      // Validate PDF buffer
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Generated PDF buffer is empty or invalid')
      }
      
      // Check if it's a valid PDF (should start with %PDF)
      const pdfHeader = pdfBuffer.toString('ascii', 0, 4)
      if (pdfHeader !== '%PDF') {
        console.warn('Generated PDF may not be valid, header:', pdfHeader)
        // Log the actual header for debugging
        console.log('Actual PDF header:', pdfHeader)
        console.log('First 20 bytes as hex:', pdfBuffer.toString('hex', 0, 20))
      }
      
    } catch (pdfError: unknown) {
      console.error('Error generating PDF payslip:', pdfError)
      
      // Try to provide more detailed error information
      let errorMessage = 'Failed to generate payslip'
      let errorDetails = 'Unknown PDF generation error'
      let errorType = 'Unknown'
      
      if (pdfError instanceof Error) {
        errorMessage = pdfError.message
        errorDetails = pdfError.stack || 'No stack trace available'
        errorType = pdfError.constructor.name
      }
      
      return NextResponse.json({ 
        message: errorMessage,
        error: errorDetails,
        details: {
          payrollId,
          userId: safePayrollData.userId,
          month: safePayrollData.month,
          year: safePayrollData.year,
          errorType
        }
      }, { status: 500 })
    }
    
    // Save to Firebase Storage (simplified - in production use Firebase Admin Storage)
    const fileName = `payslips/${safePayrollData.year}/${safePayrollData.month}/${safePayrollData.userId}-${Date.now()}.pdf`
    
    // Update payroll document with PDF path
    try {
      await db.collection('payroll').doc(payrollId).update({
        pdfPath: fileName,
        updatedAt: new Date()
      })
      console.log('Payroll document updated with PDF path:', fileName)
    } catch (updateError) {
      console.error('Error updating payroll document:', updateError)
      // Continue with PDF response even if update fails
    }
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="payslip-${safePayrollData.userId}-${safePayrollData.month}-${safePayrollData.year}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating payslip:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
