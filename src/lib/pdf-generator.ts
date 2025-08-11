// PDF Generator utility using pdfkit-next
let PDFDocument: any = null;

export async function getPDFDocument() {
  if (PDFDocument) {
    return PDFDocument;
  }

  try {
    // Use dynamic import for Next.js compatibility
    const pdfkit = await import('pdfkit-next');
    PDFDocument = pdfkit.default || pdfkit;
    console.log('PDFKit-Next imported successfully');
    return PDFDocument;
  } catch (error) {
    console.error('Failed to import PDFKit-Next in utility:', error);
    throw new Error('PDFKit-Next import failed');
  }
}

export async function generatePayslipPDF(payrollData: any): Promise<Buffer> {
  const PDFDoc = await getPDFDocument();
  
  return new Promise((resolve, reject) => {
    // Add timeout for PDF generation
    const timeout = setTimeout(() => {
      reject(new Error('PDF generation timed out after 30 seconds'));
    }, 30000);
    
    try {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const month = payrollData.month || 1;
      const year = payrollData.year || new Date().getFullYear();
      const monthName = monthNames[month - 1] || monthNames[0];
      const presentDays = payrollData.presentDays || 0;
      const totalWorkingDays = payrollData.totalWorkingDays || 25;
      const salaryType = payrollData.salaryType || 'monthly';
      const salaryAmount = payrollData.salaryAmount || 0;
      const salaryPaid = payrollData.salaryPaid || 0;
      
      // Create a new PDF document
      const doc = new PDFDoc({
        size: 'A4',
        autoFirstPage: true,
        bufferPages: true
      });
      
      // Set fonts explicitly
      doc.font('Helvetica');
      doc.fontSize(12);
      
      // Use only built-in fonts
      const defaultFont = 'Helvetica';
      const boldFont = 'Helvetica-Bold';
      
      // Collect PDF data chunks
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      doc.on('end', () => {
        clearTimeout(timeout);
        const finalBuffer = Buffer.concat(chunks);
        resolve(finalBuffer);
      });
      doc.on('error', (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });
      
      // Company Header
      doc.fontSize(28);
      doc.fillColor('#1e40af');
      doc.text('UPTEKY CENTRAL', { align: 'center' });
      
      doc.fontSize(16);
      doc.fillColor('#374151');
      doc.text('Payroll Management System', { align: 'center' });
      
      // Add decorative line
      doc.moveDown(0.5);
      doc.strokeColor('#1e40af');
      doc.lineWidth(2);
      doc.moveTo(50, doc.y + 10);
      doc.lineTo(545, doc.y + 10);
      doc.stroke();
      
      doc.moveDown(2);
      
      // Payslip Title
      doc.fontSize(24);
      doc.font(boldFont);
      doc.fillColor('#1f2937');
      doc.text('PAYSLIP', { align: 'center' });
      
      doc.moveDown(1.5);
      
      // Employee Details Section
      doc.fontSize(18);
      doc.font(boldFont);
      doc.fillColor('#1f2937');
      doc.text('Employee Details');
      doc.moveDown(0.5);
      
      // Create a box for employee details
      const employeeBoxY = doc.y;
      doc.rect(50, employeeBoxY - 5, 495, 60);
      doc.strokeColor('#d1d5db');
      doc.lineWidth(1);
      doc.stroke();
      
      doc.fontSize(12);
      doc.font(defaultFont);
      doc.fillColor('#374151');
      doc.text(`Name: ${payrollData.name || 'N/A'}`, 60, employeeBoxY + 5);
      doc.text(`Employee ID: ${payrollData.userId}`, 60, employeeBoxY + 25);
      doc.text(`Status: ${payrollData.status || 'Active'}`, 60, employeeBoxY + 45);
      
      doc.moveDown(3);
      
      // Pay Period Section
      doc.fontSize(18);
      doc.font(boldFont);
      doc.fillColor('#1f2937');
      doc.text('Pay Period');
      doc.moveDown(0.5);
      
      // Create a box for pay period
      const payPeriodBoxY = doc.y;
      doc.rect(50, payPeriodBoxY - 5, 495, 40);
      doc.strokeColor('#d1d5db');
      doc.lineWidth(1);
      doc.stroke();
      
      doc.fontSize(12);
      doc.font(defaultFont);
      doc.fillColor('#374151');
      doc.text(`Month: ${monthName} ${year}`, 60, payPeriodBoxY + 5);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 60, payPeriodBoxY + 25);
      
      doc.moveDown(2.5);
      
      // Attendance Summary Section
      doc.fontSize(18);
      doc.font(boldFont);
      doc.fillColor('#1f2937');
      doc.text('Attendance Summary');
      doc.moveDown(0.5);
      
      // Create a box for attendance
      const attendanceBoxY = doc.y;
      doc.rect(50, attendanceBoxY - 5, 495, 50);
      doc.strokeColor('#d1d5db');
      doc.lineWidth(1);
      doc.stroke();
      
      doc.fontSize(12);
      doc.font(defaultFont);
      doc.fillColor('#374151');
      doc.text(`Present Days: ${presentDays}`, 60, attendanceBoxY + 5);
      doc.text(`Total Working Days: ${totalWorkingDays}`, 60, attendanceBoxY + 25);
      doc.text(`Attendance Rate: ${totalWorkingDays > 0 ? ((presentDays / totalWorkingDays) * 100).toFixed(1) : 0}%`, 60, attendanceBoxY + 45);
      
      doc.moveDown(2.5);
      
      // Salary Details Section
      doc.fontSize(18);
      doc.font(boldFont);
      doc.fillColor('#1f2937');
      doc.text('Salary Details');
      doc.moveDown(0.5);
      
      // Create a box for salary details
      const salaryBoxY = doc.y;
      doc.rect(50, salaryBoxY - 5, 495, 60);
      doc.strokeColor('#d1d5db');
      doc.lineWidth(1);
      doc.stroke();
      
      doc.fontSize(12);
      doc.font(defaultFont);
      doc.fillColor('#374151');
      doc.text(`Salary Type: ${salaryType.charAt(0).toUpperCase() + salaryType.slice(1)}`, 60, salaryBoxY + 5);
      doc.text(`Base Salary: $${salaryAmount.toFixed(2)}`, 60, salaryBoxY + 25);
      doc.text(`Daily Rate: $${totalWorkingDays > 0 ? (salaryAmount / totalWorkingDays).toFixed(2) : '0.00'}`, 60, salaryBoxY + 45);
      
      doc.moveDown(2.5);
      
      // Calculation Section
      doc.fontSize(18);
      doc.font(boldFont);
      doc.fillColor('#1f2937');
      doc.text('Calculation');
      doc.moveDown(0.5);
      
      // Create a box for calculation
      const calcBoxY = doc.y;
      doc.rect(50, calcBoxY - 5, 495, 40);
      doc.strokeColor('#d1d5db');
      doc.lineWidth(1);
      doc.stroke();
      
      doc.fontSize(12);
      doc.font(defaultFont);
      doc.fillColor('#374151');
      doc.text(`Formula: ${salaryType === 'monthly' ? `(${presentDays} / ${totalWorkingDays}) × $${salaryAmount.toFixed(2)}` : `${presentDays} × $${salaryAmount.toFixed(2)}`}`, 60, calcBoxY + 5);
      doc.text(`Calculation: ${salaryType === 'monthly' ? `(${presentDays} / ${totalWorkingDays}) × $${salaryAmount.toFixed(2)} = $${((presentDays / totalWorkingDays) * salaryAmount).toFixed(2)}` : `${presentDays} × $${salaryAmount.toFixed(2)} = $${(presentDays * salaryAmount).toFixed(2)}`}`, 60, calcBoxY + 25);
      
      doc.moveDown(2.5);
      
      // Final Amount Section
      doc.fontSize(18);
      doc.font(boldFont);
      doc.fillColor('#1f2937');
      doc.text('Final Amount');
      doc.moveDown(0.5);
      
      // Create a highlighted box for final amount
      const finalBoxY = doc.y;
      doc.rect(50, finalBoxY - 5, 495, 50);
      doc.fillColor('#fef3c7');
      doc.fill();
      doc.strokeColor('#f59e0b');
      doc.lineWidth(2);
      doc.stroke();
      
      doc.fontSize(16);
      doc.font(boldFont);
      doc.fillColor('#92400e');
      doc.text(`Amount Payable: $${salaryPaid.toFixed(2)}`, 60, finalBoxY + 15);
      
      doc.fontSize(12);
      doc.font(defaultFont);
      doc.fillColor('#92400e');
      doc.text(`Status: ${payrollData.status || 'Unpaid'}`, 60, finalBoxY + 35);
      
      doc.moveDown(3);
      
      // Footer with Upteky branding
      doc.fontSize(10);
      doc.font(defaultFont);
      doc.fillColor('#6b7280');
      doc.text('This is a computer generated document from Upteky Central', { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, { align: 'center' });
      doc.text('Upteky Central - Empowering Business Growth', { align: 'center' });
      
      // Finalize PDF
      doc.end();
      
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}
