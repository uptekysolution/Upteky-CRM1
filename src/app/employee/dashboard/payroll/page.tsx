
'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Lock, Download, Calendar, RefreshCw, User, DollarSign, Clock } from "lucide-react"
import { History as HistoryIcon } from "lucide-react"
import { 
  fetchEmployeePayroll, 
  downloadPayslip, 
  PayrollData, 
  getMonthName, 
  formatCurrency,
  fetchEmployeePayrollHistory,
} from '@/lib/payroll'
import { auth } from '@/lib/firebase'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function EmployeePayrollPage() {
  const [payrollData, setPayrollData] = useState<PayrollData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const { toast } = useToast()
  const [history, setHistory] = useState<PayrollData[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Fetch payroll data when month/year changes
  useEffect(() => {
    fetchPayrollDataForMonth()
  }, [selectedMonth, selectedYear])

  // Fetch history once on mount
  useEffect(() => {
    fetchPayrollHistory()
  }, [])

  const fetchPayrollDataForMonth = async () => {
    setLoading(true)
    try {
      const data = await fetchEmployeePayroll(selectedMonth, selectedYear)
      // Also fetch live attendance summary to ensure present/half/overtime are up-to-date
      try {
        const currentUser = auth.currentUser
        if (currentUser) {
          const token = await currentUser.getIdToken()
          const res = await fetch(`/api/attendance/${currentUser.uid}/${selectedMonth}/summary?year=${selectedYear}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.ok) {
            const sum = await res.json()
            const merged: PayrollData = {
              ...data,
              presentDays: typeof sum.presentDays === 'number' ? sum.presentDays : data.presentDays,
              totalWorkingDays: typeof sum.workingDays === 'number' ? sum.workingDays : data.totalWorkingDays,
              halfDays: typeof sum.halfDays === 'number' ? sum.halfDays : data.halfDays,
              overtimeHours: typeof sum.overtimeHours === 'number' ? sum.overtimeHours : data.overtimeHours,
              underworkAlerts: typeof sum.underworkAlerts === 'number' ? sum.underworkAlerts : data.underworkAlerts,
            }
            setPayrollData(merged)
            return
          }
        }
      } catch {
        // Ignore summary fetch errors; fall back to payroll response
      }
      setPayrollData(data)
    } catch (error) {
      console.error('Error fetching payroll data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch payroll data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPayslip = async () => {
    if (!payrollData) return
    
    try {
      const payrollId = payrollData.id || `${payrollData.userId}_${payrollData.month}_${payrollData.year}`
      await downloadPayslip(payrollId)
      toast({
        title: "Success",
        description: "Payslip downloaded successfully",
      })
    } catch (error) {
      console.error('Error downloading payslip:', error)
      toast({
        title: "Error",
        description: "Failed to download payslip. Please try again.",
        variant: "destructive"
      })
    }
  }

  const fetchPayrollHistory = async () => {
    setHistoryLoading(true)
    try {
      const items = await fetchEmployeePayrollHistory()
      setHistory(items)
    } catch (error) {
      console.error('Error fetching payroll history:', error)
      toast({
        title: 'Error',
        description: 'Failed to load payroll history.',
        variant: 'destructive',
      })
    } finally {
      setHistoryLoading(false)
    }
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary"/>
            <CardTitle>My Payroll</CardTitle>
          </div>
          <CardDescription>
            View your payroll information and download payslips for different months.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Month/Year Picker */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pay Period:</span>
            </div>
            
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {getMonthName(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }, (_, i) => currentYear - 2 + i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payroll Information */}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading payroll data...
            </div>
          ) : payrollData ? (
            <div className="space-y-6">
              {/* Employee Info Card */}
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Employee Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{payrollData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Employee ID</p>
                      <p className="font-medium">{payrollData.userId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pay Period Card */}
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Pay Period</h3>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {getMonthName(payrollData.month)} {payrollData.year}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Summary Card */}
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Attendance Summary</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-background rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Present Days</p>
                      <p className="text-3xl font-bold text-green-600">{payrollData.presentDays}</p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Total Working Days</p>
                      <p className="text-3xl font-bold text-blue-600">{payrollData.totalWorkingDays}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <div className="text-center p-4 bg-background rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Half Days</p>
                      <p className="text-2xl font-semibold">{payrollData.halfDays ?? 0}</p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Overtime (hrs)</p>
                      <p className="text-2xl font-semibold">{payrollData.overtimeHours ?? 0}</p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Underwork Alerts</p>
                      <p className="text-2xl font-semibold">{payrollData.underworkAlerts ?? 0}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                    <p className="text-xl font-semibold">
                      {payrollData.totalWorkingDays > 0 
                        ? Math.round((payrollData.presentDays / payrollData.totalWorkingDays) * 100)
                        : 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Salary Details Card */}
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Salary Details</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                      <span className="text-muted-foreground">Salary Type</span>
                      <Badge variant="outline" className="capitalize">
                        {payrollData.salaryType}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                      <span className="text-muted-foreground">Base Salary</span>
                      <span className="font-mono font-semibold">
                        {formatCurrency(payrollData.salaryAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                      <span className="text-muted-foreground">Allowances</span>
                      <span className="font-mono">
                        {formatCurrency(payrollData.allowancesTotal || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                      <span className="text-muted-foreground">Deductions</span>
                      <span className="font-mono">
                        -{formatCurrency(payrollData.deductionsTotal || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                      <span className="text-muted-foreground">Amount Payable</span>
                      <span className="font-mono font-bold text-lg text-primary">
                        {formatCurrency(payrollData.salaryPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                      <span className="text-muted-foreground">Net Pay</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(payrollData.netPay ?? (payrollData.salaryPaid + (payrollData.allowancesTotal || 0) - (payrollData.deductionsTotal || 0)))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-center">
                <Button 
                  onClick={handleDownloadPayslip}
                  size="lg"
                  className="px-8"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Payslip
                </Button>
              </div>

              {/* Payroll History */}
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <HistoryIcon />
                    <h3 className="text-lg font-semibold">Payroll History</h3>
                  </div>
                  {historyLoading ? (
                    <div className="flex items-center justify-center p-6 text-muted-foreground">Loading history...</div>
                  ) : history.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4">No historical payroll records found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Period</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.map((item) => (
                            <TableRow key={item.id || `${item.userId}_${item.month}_${item.year}`}>
                              <TableCell>{getMonthName(item.month)} {item.year}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(item.netPay ?? item.salaryPaid)}</TableCell>
                              <TableCell className="text-center"><Badge>{item.status || 'Unpaid'}</Badge></TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="outline" onClick={async () => {
                                  const payrollId = item.id || `${item.userId}_${item.month}_${item.year}`
                                  try {
                                    await downloadPayslip(payrollId)
                                    toast({ title: 'Payslip', description: 'Download started.' })
                                  } catch (e) {
                                    toast({ title: 'Error', description: 'Failed to download payslip.', variant: 'destructive' })
                                  }
                                }}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <div className="space-y-2">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  No payroll data found for {getMonthName(selectedMonth)} {selectedYear}
                </p>
                <p className="text-sm text-muted-foreground">
                  Payroll data will be available once generated by an administrator
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
