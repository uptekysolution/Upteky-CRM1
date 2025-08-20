// PDF generation using pdf-lib (works in Next.js API routes without external font assets)
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function generatePayslipPDF(payrollData: any): Promise<Buffer> {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const month = payrollData.month || 1
  const year = payrollData.year || new Date().getFullYear()
  const monthName = monthNames[month - 1] || monthNames[0]
  const presentDays = payrollData.presentDays || 0
  const totalWorkingDays = payrollData.totalWorkingDays || 25
  const salaryType = payrollData.salaryType || 'monthly'
  const salaryAmount = payrollData.salaryAmount || 0
  const salaryPaid = payrollData.salaryPaid || 0
  const allowances = payrollData.allowancesTotal || 0
  const deductions = payrollData.deductionsTotal || 0
  const netPay = typeof payrollData.netPay === 'number' ? payrollData.netPay : (salaryPaid + allowances - deductions)

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 portrait in points
  const { height, width } = page.getSize()
  const margin = 50

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = height - margin

  const drawText = (text: string, options?: { x?: number; y?: number; size?: number; font?: any; color?: any }) => {
    const size = options?.size ?? 12
    const usedFont = options?.font ?? font
    const x = options?.x ?? margin
    const y = options?.y ?? 0
    page.drawText(text, { x, y, size, font: usedFont, color: options?.color ?? rgb(0.22, 0.25, 0.32) })
  }

  const drawHr = (py: number, color = rgb(0.12, 0.25, 0.68)) => {
    page.drawLine({ start: { x: margin, y: py }, end: { x: width - margin, y: py }, thickness: 2, color })
  }

  // Header
  drawText('UPTEKY CENTRAL', { x: 0, y, size: 28, font: bold, color: rgb(0.12, 0.25, 0.68) })
  y -= 30
  drawText('Payroll Management System', { y, size: 16 })
  y -= 14
  drawHr(y)
  y -= 24
  drawText('PAYSLIP', { y, size: 22, font: bold, color: rgb(0.12, 0.15, 0.22) })
  y -= 28

  // Employee Details
  drawText('Employee Details', { y, size: 16, font: bold })
  y -= 8
  drawHr(y, rgb(0.82, 0.84, 0.86))
  y -= 18
  drawText(`Name: ${payrollData.name || 'N/A'}`, { y })
  y -= 16
  drawText(`Employee ID: ${payrollData.userId}`, { y })
  y -= 16
  drawText(`Status: ${payrollData.status || 'Active'}`, { y })
  y -= 24

  // Pay Period
  drawText('Pay Period', { y, size: 16, font: bold })
  y -= 8
  drawHr(y, rgb(0.82, 0.84, 0.86))
  y -= 18
  drawText(`Month: ${monthName} ${year}`, { y })
  y -= 16
  drawText(`Generated: ${new Date().toLocaleDateString()}`, { y })
  y -= 24

  // Attendance Summary
  drawText('Attendance Summary', { y, size: 16, font: bold })
  y -= 8
  drawHr(y, rgb(0.82, 0.84, 0.86))
  y -= 18
  drawText(`Present Days: ${presentDays}`, { y })
  y -= 16
  drawText(`Total Working Days: ${totalWorkingDays}`, { y })
  y -= 16
  const rate = totalWorkingDays > 0 ? ((presentDays / totalWorkingDays) * 100).toFixed(1) : '0.0'
  drawText(`Attendance Rate: ${rate}%`, { y })
  y -= 24

  // Salary Details
  drawText('Salary Details', { y, size: 16, font: bold })
  y -= 8
  drawHr(y, rgb(0.82, 0.84, 0.86))
  y -= 18
  const salaryTypeLabel = salaryType.charAt(0).toUpperCase() + salaryType.slice(1)
  drawText(`Salary Type: ${salaryTypeLabel}`, { y })
  y -= 16
  drawText(`Base Salary: $${salaryAmount.toFixed(2)}`, { y })
  y -= 16
  const daily = totalWorkingDays > 0 ? (salaryAmount / totalWorkingDays) : 0
  drawText(`Daily Rate: $${daily.toFixed(2)}`, { y })
  y -= 16
  drawText(`Allowances: $${allowances.toFixed(2)}`, { y })
  y -= 16
  drawText(`Deductions: $${deductions.toFixed(2)}`, { y })
  y -= 24

  // Final Amount
  drawText('Final Amount', { y, size: 16, font: bold })
  y -= 8
  drawHr(y, rgb(0.96, 0.62, 0.04))
  y -= 18
  drawText(`Amount Payable: $${salaryPaid.toFixed(2)}`, { y, size: 14, font: bold, color: rgb(0.57, 0.25, 0.05) })
  y -= 18
  drawText(`Net Pay: $${netPay.toFixed(2)}`, { y, size: 14, font: bold, color: rgb(0.12, 0.25, 0.68) })
  y -= 16
  drawText(`Status: ${payrollData.status || 'Unpaid'}`, { y })
  y -= 28

  // Footer
  drawText('This is a computer generated document from Upteky Central', { y, size: 10, color: rgb(0.42, 0.45, 0.50) })
  y -= 12
  drawText(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, { y, size: 10, color: rgb(0.42, 0.45, 0.50) })
  y -= 12
  drawText('Upteky Central - Empowering Business Growth', { y, size: 10, color: rgb(0.42, 0.45, 0.50) })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
