
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
import { CalendarCheck2, CheckSquare, Clock, Users, Target } from "lucide-react"
import dynamic from "next/dynamic"
const DashboardChart = dynamic(() => import("./dashboard-chart").then(m => m.DashboardChart), { ssr: false })

// This is a simplified mock. In a real app, this logic would be in the layout
// and passed down through context or a state manager.
const mockPermissions = {
  Admin: { 'users:manage': true, 'attendance:view:all': true, 'tasks:view': true, 'timesheet:view': true, 'crm:view:all': true, 'lead-generation:view': true },
  HR: { 'users:manage': true, 'attendance:view:all': true, 'tasks:view': true, 'timesheet:view': true, 'crm:view:all': false, 'lead-generation:view': false },
  'Team Lead': { 'users:manage': false, 'attendance:view:team': true, 'tasks:view': true, 'timesheet:view': true, 'crm:view:team': true, 'lead-generation:view': true },
  Employee: { 'users:manage': false, 'attendance:view:own': true, 'tasks:view': true, 'timesheet:view': true, 'crm:view:all': false, 'lead-generation:view': false },
  'Business Development': { 'users:manage': false, 'attendance:view:all': false, 'tasks:view': false, 'timesheet:view': false, 'crm:view:own': true, 'lead-generation:view': true }
};


// Mock user object. In a real app, this would come from an auth context.
const currentUser = {
    name: "Alisha Anand",
    role: "HR", // Possible roles: 'Admin', 'HR', 'Team Lead', 'Employee', 'Business Development'
};

const userPermissions = (mockPermissions as any)[currentUser.role] || {};

export default function Dashboard() {
  return (
    <>
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Welcome back, {currentUser.name}!</h1>
        <p className="text-muted-foreground">Here's a summary of your workspace.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {userPermissions['users:manage'] && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,257</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
        )}
        {(userPermissions['attendance:view:all'] || userPermissions['attendance:view:team'] || userPermissions['attendance:view:own']) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Attendance Today
              </CardTitle>
              <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">
                -1.2% from yesterday
              </p>
            </CardContent>
          </Card>
        )}
        {userPermissions['tasks:view'] && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">84</div>
              <p className="text-xs text-muted-foreground">
                +12 since last week
              </p>
            </CardContent>
          </Card>
        )}
        {userPermissions['timesheet:view'] && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Approvals
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">17</div>
              <p className="text-xs text-muted-foreground">
                3 timesheets, 14 leave requests
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        {(userPermissions['crm:view:all'] || userPermissions['crm:view:team'] || userPermissions['crm:view:own']) && (
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>
                A summary of the most recent leads generated this month.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Source
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Status
                    </TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium">Liam Johnson</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        liam@example.com
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Webinar
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className="text-xs" variant="outline">
                        Contacted
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">$2,500.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium">Olivia Smith</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        olivia@example.com
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Referral
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className="text-xs" variant="secondary">
                        New
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">$1,500.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium">Noah Williams</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        noah@example.com
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Website
                    </TableCell>
                     <TableCell className="hidden sm:table-cell">
                      <Badge className="text-xs" variant="outline">
                        Contacted
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">$3,000.00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        {userPermissions['lead-generation:view'] && (
            <DashboardChart />
        )}
      </div>
    </>
  )
}
