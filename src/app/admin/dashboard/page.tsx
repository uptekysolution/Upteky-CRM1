"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

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
import { CalendarCheck2, CheckSquare, Clock, Users, Target, TrendingUp, TrendingDown, Activity, Server } from "lucide-react"
import dynamic from "next/dynamic"
const DashboardChart = dynamic(() => import("./dashboard-chart").then(m => m.DashboardChart), { ssr: false })
const EnhancedDashboardChart = dynamic(
  () => import("@/components/analytics/EnhancedDashboardChart").then(m => m.EnhancedDashboardChart),
  { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading analytics…</div> }
)
const UserActivityMonitor = dynamic(
  () => import("@/components/analytics/UserActivityMonitor").then(m => m.UserActivityMonitor),
  { ssr: false, loading: () => <div className="h-[200px] flex items-center justify-center text-muted-foreground">Loading activity…</div> }
)
import { useAnalytics } from "@/hooks/use-analytics"
import { useRolePermissions } from "@/hooks/use-role-permissions"
import { RealTimeIndicator } from "@/components/analytics/RealTimeIndicator"

export default function Dashboard() {
  const [userName, setUserName] = useState<string>("");
  const { metrics, loading, error, lastUpdated } = useAnalytics({
    autoRefresh: true,
    refreshInterval: 3600000, // 1 hour (3600000 ms)
    enableRealTime: true
  });
  const { hasAnyPermission, isLoading: permissionsLoading } = useRolePermissions();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserName("");
        return;
      }

      let resolvedName: string | null = user.displayName || null;

      // Try Firestore user document for a preferred name
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          resolvedName = data?.name || data?.fullName || resolvedName;
        }
      } catch (e) {
        // Silent fail, fallback to auth/displayName or email
      }

      if (!resolvedName) {
        const localPart = user.email?.split("@")[0] ?? "User";
        resolvedName = localPart
          .split(/[._-]+/)
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }

      setUserName(resolvedName);
    });

    return () => unsubscribe();
  }, []);



  const getChangeIcon = (changeType: 'increase' | 'decrease') => {
    return changeType === 'increase' ?
      <TrendingUp className="h-4 w-4 text-green-500" /> :
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getChangeColor = (changeType: 'increase' | 'decrease') => {
    return changeType === 'increase' ? 'text-green-600' : 'text-red-600';
  };

  if (permissionsLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Welcome back, {userName || "User"}!</h1>
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {userName || "User"}!</h1>
            <p className="text-muted-foreground">Here's a summary of your workspace with analytics that refresh every hour.</p>
          </div>
          {lastUpdated && (
            <div className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        {error && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Note:</span> Using simulated data due to backend connection issues.
              Real-time updates are still active.
            </p>
          </div>
        )}
        <div className="mt-2">
          <RealTimeIndicator
            isLive={!error}
            lastUpdated={lastUpdated}
          />
        </div>
      </div>

      {/* Real-time Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {hasAnyPermission(['users:manage']) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.activeUsers.count.toLocaleString() || '0'}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {metrics?.activeUsers.change && (
                  <>
                    {getChangeIcon(metrics.activeUsers.changeType)}
                    <span className={getChangeColor(metrics.activeUsers.changeType)}>
                      {metrics.activeUsers.change.toFixed(1)}% from last month
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {hasAnyPermission(['attendance:view:all', 'attendance:view:team', 'attendance:view:own']) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Attendance Today
              </CardTitle>
              <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.attendanceToday.percentage.toFixed(1) || '0'}%
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {metrics?.attendanceToday.change && (
                  <>
                    {getChangeIcon(metrics.attendanceToday.changeType)}
                    <span className={getChangeColor(metrics.attendanceToday.changeType)}>
                      {metrics.attendanceToday.change.toFixed(1)}% from yesterday
                    </span>
                  </>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {metrics?.attendanceToday.presentToday || 0} of {metrics?.attendanceToday.totalEmployees || 0} present
              </div>
            </CardContent>
          </Card>
        )}

        {hasAnyPermission(['tasks:view']) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.openTasks.count || 0}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {metrics?.openTasks.change && (
                  <>
                    {getChangeIcon(metrics.openTasks.changeType)}
                    <span className={getChangeColor(metrics.openTasks.changeType)}>
                      {metrics.openTasks.change} since last week
                    </span>
                  </>
                )}
              </div>
              {metrics?.openTasks.overdue && metrics.openTasks.overdue > 0 && (
                <div className="text-xs text-red-600 mt-1">
                  {metrics.openTasks.overdue} overdue
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {hasAnyPermission(['timesheet:view']) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Approvals
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.pendingApprovals.count || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                {metrics?.pendingApprovals.timesheets || 0} timesheets, {metrics?.pendingApprovals.leaveRequests || 0} leave requests
              </div>
              {metrics?.pendingApprovals.overtimeRequests && metrics.pendingApprovals.overtimeRequests > 0 && (
                <div className="text-xs text-orange-600 mt-1">
                  {metrics.pendingApprovals.overtimeRequests} overtime requests
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Real-Time Analytics - Full Width */}
      {hasAnyPermission(['lead-generation:view']) && (
        <div className="mt-6">
          <EnhancedDashboardChart />
        </div>
      )}

      {/* Recent Leads - Full Width */}
      {hasAnyPermission(['crm:view:all', 'crm:view:team', 'crm:view:own']) && (
        <div className="mt-6">
          <Card>
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
                  {metrics?.recentLeads.length ? (
                    metrics.recentLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="font-medium">{lead.customerName}</div>
                          <div className="hidden text-sm text-muted-foreground md:inline">
                            {lead.email}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {lead.source}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge className="text-xs" variant="outline">
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">${lead.value.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No recent leads
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Activity Monitor */}
      <div className="mt-6">
        <UserActivityMonitor />
      </div>

      {/* System Health Indicators */}
      {metrics?.systemHealth && (
        <div className="grid gap-4 md:gap-8 lg:grid-cols-3 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.systemHealth.uptime}%
              </div>
              <p className="text-xs text-muted-foreground">
                Last backup: {metrics.systemHealth.lastBackup.toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.systemHealth.activeSessions}
              </div>
              <p className="text-xs text-muted-foreground">
                Current active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {metrics.systemHealth.storageUsage}%
              </div>
              <p className="text-xs text-muted-foreground">
                Database storage utilization
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
