'use client'

import { useEffect, useState } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { analyticsService, DashboardMetrics } from "@/lib/analytics-service"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function EnhancedDashboardChart() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await analyticsService.getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Subscribe to real-time updates
    const unsubscribe = analyticsService.subscribeToDashboardMetrics((data) => {
      setMetrics(data);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>Loading real-time data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Unable to load analytics data
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const attendanceData = [
    { name: 'Present', value: metrics.attendanceToday.presentToday, color: '#00C49F' },
    { name: 'Absent', value: metrics.attendanceToday.totalEmployees - metrics.attendanceToday.presentToday, color: '#FF8042' }
  ];

  const taskStatusData = [
    { name: 'Open', value: metrics.openTasks.count, color: '#0088FE' },
    { name: 'Overdue', value: metrics.openTasks.overdue, color: '#FF0000' }
  ];

  const approvalData = [
    { name: 'Timesheets', value: metrics.pendingApprovals.timesheets, color: '#8884D8' },
    { name: 'Leave Requests', value: metrics.pendingApprovals.leaveRequests, color: '#FFBB28' },
    { name: 'Overtime', value: metrics.pendingApprovals.overtimeRequests, color: '#00C49F' }
  ];

  const systemHealthData = [
    { name: 'Uptime', value: metrics.systemHealth.uptime, color: '#00C49F' },
    { name: 'Storage Usage', value: metrics.systemHealth.storageUsage, color: '#FF8042' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-Time Analytics</CardTitle>
        <CardDescription>Live system metrics and performance indicators</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Today's Attendance</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {metrics.attendanceToday.percentage}%
                  </div>
                  <div className="text-sm text-muted-foreground">Attendance Rate</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Present Today:</span>
                    <Badge variant="outline">{metrics.attendanceToday.presentToday}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Employees:</span>
                    <Badge variant="outline">{metrics.attendanceToday.totalEmployees}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Change from yesterday:</span>
                    <Badge variant={metrics.attendanceToday.changeType === 'increase' ? 'default' : 'destructive'}>
                      {metrics.attendanceToday.changeType === 'increase' ? '+' : '-'}{metrics.attendanceToday.change}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Task Status</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {metrics.openTasks.count}
                  </div>
                  <div className="text-sm text-muted-foreground">Open Tasks</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Overdue Tasks:</span>
                    <Badge variant="destructive">{metrics.openTasks.overdue}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Change from last week:</span>
                    <Badge variant={metrics.openTasks.changeType === 'increase' ? 'default' : 'destructive'}>
                      {metrics.openTasks.changeType === 'increase' ? '+' : '-'}{metrics.openTasks.change}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Pending Approvals</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={approvalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {metrics.pendingApprovals.count}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Pending</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Timesheets:</span>
                    <Badge variant="outline">{metrics.pendingApprovals.timesheets}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Leave Requests:</span>
                    <Badge variant="outline">{metrics.pendingApprovals.leaveRequests}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Overtime Requests:</span>
                    <Badge variant="outline">{metrics.pendingApprovals.overtimeRequests}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">System Health</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={systemHealthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="value" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {metrics.systemHealth.uptime}%
                  </div>
                  <div className="text-sm text-muted-foreground">System Uptime</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Active Sessions:</span>
                    <Badge variant="outline">{metrics.systemHealth.activeSessions}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Storage Usage:</span>
                    <Badge variant="outline">{metrics.systemHealth.storageUsage}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Backup:</span>
                    <Badge variant="outline">
                      {metrics.systemHealth.lastBackup.toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
