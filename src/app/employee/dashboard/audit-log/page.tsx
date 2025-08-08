import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import AuditLogClient from "./audit-log-client"

const auditLogs = [
  {
    id: "1",
    user: "admin@upteky.com",
    action: "UPDATE",
    module: "Permissions",
    details: "Changed 'HR' role permissions for 'Payroll' module.",
    timestamp: "2024-07-30 10:00:00",
    ip: "192.168.1.1",
    status: "Success",
  },
  {
    id: "2",
    user: "hr@upteky.com",
    action: "READ",
    module: "Payroll",
    details: "Viewed payroll records for 'John Doe'.",
    timestamp: "2024-07-30 09:45:12",
    ip: "192.168.1.5",
    status: "Success",
  },
  {
    id: "3",
    user: "employee@upteky.com",
    action: "READ",
    module: "Payroll",
    details: "Attempted to access payroll data.",
    timestamp: "2024-07-30 09:30:05",
    ip: "192.168.1.10",
    status: "Failed",
  },
]

export default function AuditLogPage() {
  return (
    <div className="grid gap-8">
      <AuditLogClient />
      
      <Card>
        <CardHeader>
          <CardTitle>Historical Audit Logs</CardTitle>
          <CardDescription>
            A log of all significant actions performed within the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant={log.action === 'UPDATE' ? 'default' : 'secondary'}>{log.action}</Badge>
                  </TableCell>
                  <TableCell>{log.module}</TableCell>
                  <TableCell>{log.details}</TableCell>
                  <TableCell>{log.timestamp}</TableCell>
                   <TableCell>
                     <Badge variant={log.status === 'Success' ? 'outline' : 'destructive'}>{log.status}</Badge>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
