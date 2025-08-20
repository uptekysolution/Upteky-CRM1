import { auth } from './firebase'

export interface PayrollData {
  id?: string
  userId: string
  name: string
  month: number
  year: number
  presentDays: number
  totalWorkingDays: number
  salaryPaid: number
  salaryType: 'monthly' | 'daily'
  salaryAmount: number
  status?: 'Paid' | 'Unpaid'
  pdfPath?: string | null
  // Optional breakdowns if available in Firestore
  allowancesTotal?: number
  deductionsTotal?: number
  netPay?: number
  payslipUrl?: string | null
  createdAt?: Date
}

export interface SalaryUpdate {
  salaryType: 'monthly' | 'daily'
  salaryAmount: number
}

// Fetch payroll data for admin (all employees)
export const fetchPayrollData = async (month: number, year: number): Promise<PayrollData[]> => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('User not authenticated')
    }
    
    const token = await currentUser.getIdToken()
    
    const response = await fetch(`/api/payroll/${month}/${year}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching payroll data:', error)
    throw error
  }
}

// Fetch payroll data for employee (own data)
export const fetchEmployeePayroll = async (month: number, year: number): Promise<PayrollData> => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('User not authenticated')
    }
    
    const token = await currentUser.getIdToken()
    
    const response = await fetch(`/api/payroll/me/${month}/${year}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: PayrollData = await response.json()
    // Compute net pay client-side if not provided
    if (data && typeof data.netPay === 'undefined') {
      const allowances = data.allowancesTotal || 0
      const deductions = data.deductionsTotal || 0
      data.netPay = Math.round((data.salaryPaid + allowances - deductions) * 100) / 100
    }
    return data
  } catch (error) {
    console.error('Error fetching employee payroll:', error)
    throw error
  }
}

// Fetch payroll history for the authenticated employee
export const fetchEmployeePayrollHistory = async (): Promise<PayrollData[]> => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    const token = await currentUser.getIdToken()
    const response = await fetch(`/api/payroll/me/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const list: PayrollData[] = await response.json()
    return list.map((p) => {
      if (typeof p.netPay === 'undefined') {
        const allowances = p.allowancesTotal || 0
        const deductions = p.deductionsTotal || 0
        p.netPay = Math.round((p.salaryPaid + allowances - deductions) * 100) / 100
      }
      return p
    })
  } catch (error) {
    console.error('Error fetching employee payroll history:', error)
    throw error
  }
}

// Generate payroll for all employees (admin only)
export const generatePayroll = async (month: number, year: number): Promise<{ message: string; payrolls: PayrollData[] }> => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('User not authenticated')
    }
    
    const token = await currentUser.getIdToken()
    
    const response = await fetch('/api/payroll/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ month, year }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error generating payroll:', error)
    throw error
  }
}

// Update employee salary (admin only)
export const updateEmployeeSalary = async (userId: string, salaryData: SalaryUpdate): Promise<{ message: string }> => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('User not authenticated')
    }
    
    const token = await currentUser.getIdToken()
    
    const response = await fetch(`/api/users/${userId}/salary`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(salaryData),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error updating employee salary:', error)
    throw error
  }
}

// Download payslip
export const downloadPayslip = async (payrollId: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('User not authenticated')
    }
    
    const token = await currentUser.getIdToken()
    
    const response = await fetch(`/api/payroll/receipt/${payrollId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // Check if response is JSON (PDF already exists) or PDF blob
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      const data = await response.json()
      const url: string | undefined = data.pdfUrl || data.signedUrl || data.url || data.pdfPath
      if (url) {
        // Open in a new tab for viewing/downloading
        window.open(url, '_blank', 'noopener,noreferrer')
        return
      }
      // Fall through if no URL provided
    }
    
    // PDF generated, create download
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payslip-${payrollId}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error('Error downloading payslip:', error)
    throw error
  }
}

// Get month name from number
export const getMonthName = (month: number): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return monthNames[month - 1] || 'Unknown'
}

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
