
'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Lock, Download, Calendar, RefreshCw } from "lucide-react"
import { 
  fetchPayrollData, 
  generatePayroll, 
  downloadPayslip, 
  PayrollData, 
  getMonthName, 
  formatCurrency 
} from '@/lib/payroll'
import { SalaryEditModal } from '@/components/payroll/SalaryEditModal'

export default function AdminPayrollPage() {
  const [payrollData, setPayrollData] = useState<PayrollData[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const { toast } = useToast()

  // Fetch payroll data when month/year changes
  useEffect(() => {
    fetchPayrollDataForMonth()
  }, [selectedMonth, selectedYear])

  const fetchPayrollDataForMonth = async () => {
    setLoading(true)
    try {
      const data = await fetchPayrollData(selectedMonth, selectedYear)
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

  const handleGeneratePayroll = async () => {
    setGenerating(true)
    try {
      const result = await generatePayroll(selectedMonth, selectedYear)
      toast({
        title: "Success",
        description: result.message,
      })
      
      // Refresh the data
      await fetchPayrollDataForMonth()
    } catch (error) {
      console.error('Error generating payroll:', error)
      toast({
        title: "Error",
        description: "Failed to generate payroll. Please try again.",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadPayslip = async (payrollId: string) => {
    try {
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

  const handleSalaryUpdated = () => {
    // Refresh payroll data after salary update
    fetchPayrollDataForMonth()
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const canGeneratePayroll = selectedMonth <= currentMonth && selectedYear <= currentYear

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary"/>
            <CardTitle>Payroll Management</CardTitle>
          </div>
          <CardDescription>
            Access to this module is restricted and all actions are logged. Team leads do not have access to team payroll.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Month/Year Picker and Generate Button */}
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
            
            <Button 
              onClick={handleGeneratePayroll} 
              disabled={generating || !canGeneratePayroll}
              className="ml-auto"
            >
              {generating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Generate Payroll
                </>
              )}
            </Button>
          </div>

          {/* Payroll Table */}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading payroll data...
            </div>
          ) : payrollData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead className="text-center">Present Days</TableHead>
                  <TableHead className="text-center">Working Days</TableHead>
                  <TableHead className="text-center">Attendance Rate</TableHead>
                  <TableHead className="text-right">Base Salary</TableHead>
                  <TableHead className="text-right">Amount Payable</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollData.map((payroll) => (
                  <TableRow key={payroll.id || `${payroll.userId}_${payroll.month}_${payroll.year}`}>
                    <TableCell className="font-medium">{payroll.name}</TableCell>
                    <TableCell>{getMonthName(payroll.month)} {payroll.year}</TableCell>
                    <TableCell className="text-center">{payroll.presentDays}</TableCell>
                    <TableCell className="text-center">{payroll.totalWorkingDays}</TableCell>
                    <TableCell className="text-center">
                      {payroll.totalWorkingDays > 0 ? Math.round((payroll.presentDays / payroll.totalWorkingDays) * 100) : 0}%
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(payroll.salaryAmount)}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({payroll.salaryType})
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrency(payroll.salaryPaid)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={payroll.status === 'Paid' ? 'default' : 'secondary'}>
                        {payroll.status || 'Unpaid'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <SalaryEditModal
                          userId={payroll.userId}
                          employeeName={payroll.name}
                          currentSalaryType={payroll.salaryType}
                          currentSalaryAmount={payroll.salaryAmount}
                          onSalaryUpdated={handleSalaryUpdated}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadPayslip(payroll.id || `${payroll.userId}_${payroll.month}_${payroll.year}`)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          View Payslip
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <div className="space-y-2">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  No payroll data found for {getMonthName(selectedMonth)} {selectedYear}
                </p>
                <p className="text-sm text-muted-foreground">
                  Click "Generate Payroll" to create payroll records for all employees
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
