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
import AuditLogTable from "./audit-log-table"

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
          <AuditLogTable />
        </CardContent>
      </Card>
    </div>
  )
}
