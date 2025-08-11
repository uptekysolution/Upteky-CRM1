
'use client'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button';
import { Lock, Eye, Download } from "lucide-react";
import { downloadPayslip } from '@/lib/payroll';

// Mock user for demonstration. In a real app, this would come from an auth context.
const currentUser = { name: "Alisha Anand", role: "HR" }; // Can be 'Employee', 'Team Lead', 'HR', 'Admin'

const payrollData = [
    { id: 'pay-1', user: 'John Doe', role: 'Team Lead', period: 'July 2024', amount: '$5,500.00', status: 'Paid' },
    { id: 'pay-2', user: 'Jane Smith', role: 'Employee', team: 'John Doe', period: 'July 2024', amount: '$4,000.00', status: 'Paid' },
    { id: 'pay-3', user: 'Peter Jones', role: 'HR', period: 'July 2024', amount: '$6,000.00', status: 'Paid' },
    { id: 'pay-4', user: 'Admin User', role: 'Admin', period: 'July 2024', amount: '$10,000.00', status: 'Paid' },
    { id: 'pay-5', user: 'Sub Admin', role: 'Sub-Admin', period: 'July 2024', amount: '$8,000.00', status: 'Paid' },
    { id: 'pay-6', user: 'Alisha Anand', role: 'HR', period: 'July 2024', amount: '$6,200.00', status: 'Paid' },
];

const getVisibleData = () => {
    switch (currentUser.role) {
        case 'Admin':
            return payrollData; // Unrestricted access
        case 'HR':
             // Excludes Admin and Sub-Admin roles
            return payrollData.filter(p => p.role !== 'Admin' && p.role !== 'Sub-Admin');
        case 'Employee':
        case 'Team Lead': // Team leads cannot see payroll data for their team
            return payrollData.filter(p => p.user === currentUser.name);
        default:
            return [];
    }
}

const canViewPayslip = (record: typeof payrollData[0]) => {
     switch (currentUser.role) {
        case 'Admin':
            return true;
        case 'HR':
            return record.role !== 'Admin' && record.role !== 'Sub-Admin';
        case 'Employee':
        case 'Team Lead':
            return record.user === currentUser.name;
        default:
            return false;
    }
}

export default function PayrollPage() {
  const visiblePayroll = getVisibleData();
  const hasAccess = ['Admin', 'HR', 'Employee', 'Team Lead'].includes(currentUser.role);
  const isManager = ['Admin', 'HR'].includes(currentUser.role);

  const handleDownloadPayslip = async (record: typeof payrollData[0]) => {
    try {
      // For demo purposes, create a mock payroll ID
      const payrollId = record.id || `demo-${record.user.toLowerCase().replace(' ', '-')}-july-2024`
      await downloadPayslip(payrollId)
    } catch (error) {
      console.error('Error downloading payslip:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary"/>
            <CardTitle>Payroll Management</CardTitle>
        </div>
        <CardDescription>Access to this module is restricted and all actions are logged. Team leads do not have access to team payroll.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasAccess ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Pay Period</TableHead>
                        {isManager && <TableHead className="text-right">Amount</TableHead>}
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {visiblePayroll.map((pay) => (
                        <TableRow key={pay.id}>
                            <TableCell className="font-medium">{pay.user}</TableCell>
                            <TableCell>{pay.period}</TableCell>
                            {isManager && <TableCell className="text-right font-mono">{pay.amount}</TableCell>}
                            <TableCell className="text-center">
                                <Badge>{pay.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {canViewPayslip(pay) && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleDownloadPayslip(pay)}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        View Payslip
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        ) : (
             <div className="flex items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <p className="text-muted-foreground">
                    You do not have permission to view payroll records.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
