'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Activity, 
  Users, 
  Clock, 
  CheckSquare, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  AlertCircle,
  Wifi,
  Server,
  Database,
  Shield
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SystemMetrics {
  uptime: number
  responseTime: number
  activeSessions: number
  memoryUsage: number
  cpuUsage: number
  databaseConnections: number
  errorRate: number
  lastUpdated: Date
}

interface AttendanceMetrics {
  presentToday: number
  totalEmployees: number
  attendanceRate: number
  lateArrivals: number
  earlyDepartures: number
  remoteWorkers: number
}

interface TaskMetrics {
  openTasks: number
  completedToday: number
  overdueTasks: number
  highPriority: number
  inProgress: number
}

interface ApprovalMetrics {
  pendingTimesheets: number
  pendingLeaveRequests: number
  pendingExpenses: number
  totalPending: number
}

export function RealTimeAnalytics() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    uptime: 99.9,
    responseTime: 45,
    activeSessions: 1200,
    memoryUsage: 2.1,
    cpuUsage: 65,
    databaseConnections: 45,
    errorRate: 0.1,
    lastUpdated: new Date()
  })

  const [attendanceMetrics, setAttendanceMetrics] = useState<AttendanceMetrics>({
    presentToday: 138,
    totalEmployees: 150,
    attendanceRate: 92,
    lateArrivals: 8,
    earlyDepartures: 3,
    remoteWorkers: 25
  })

  const [taskMetrics, setTaskMetrics] = useState<TaskMetrics>({
    openTasks: 58,
    completedToday: 12,
    overdueTasks: 11,
    highPriority: 8,
    inProgress: 23
  })

  const [approvalMetrics, setApprovalMetrics] = useState<ApprovalMetrics>({
    pendingTimesheets: 1,
    pendingLeaveRequests: 23,
    pendingExpenses: 5,
    totalPending: 29
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('attendance')
  const { toast } = useToast()

  const fetchMetrics = useCallback(async () => {
    try {
      setIsRefreshing(true)
      setError(null)

      // Simulate API calls with realistic delays
      await Promise.all([
        new Promise(resolve => setTimeout(resolve, 300)),
        new Promise(resolve => setTimeout(resolve, 500)),
        new Promise(resolve => setTimeout(resolve, 400))
      ])

      // Update system metrics with realistic variations
      setSystemMetrics(prev => ({
        ...prev,
        responseTime: Math.max(30, Math.min(80, prev.responseTime + (Math.random() - 0.5) * 10)),
        activeSessions: Math.max(800, Math.min(1500, prev.activeSessions + (Math.random() - 0.5) * 100)),
        memoryUsage: Math.max(1.5, Math.min(3.0, prev.memoryUsage + (Math.random() - 0.5) * 0.2)),
        cpuUsage: Math.max(40, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        lastUpdated: new Date()
      }))

      // Update attendance metrics
      setAttendanceMetrics(prev => ({
        ...prev,
        presentToday: Math.max(130, Math.min(150, prev.presentToday + (Math.random() - 0.5) * 4)),
        attendanceRate: Math.max(85, Math.min(98, prev.attendanceRate + (Math.random() - 0.5) * 2)),
        lastUpdated: new Date()
      }))

      // Update task metrics
      setTaskMetrics(prev => ({
        ...prev,
        openTasks: Math.max(40, Math.min(80, prev.openTasks + (Math.random() - 0.5) * 6)),
        completedToday: Math.max(8, Math.min(20, prev.completedToday + (Math.random() - 0.5) * 4)),
        lastUpdated: new Date()
      }))

      // Update approval metrics
      setApprovalMetrics(prev => ({
        ...prev,
        pendingTimesheets: Math.max(0, Math.min(10, prev.pendingTimesheets + (Math.random() - 0.5) * 2)),
        pendingLeaveRequests: Math.max(15, Math.min(35, prev.pendingLeaveRequests + (Math.random() - 0.5) * 4)),
        totalPending: prev.pendingTimesheets + prev.pendingLeaveRequests + prev.pendingExpenses,
        lastUpdated: new Date()
      }))

    } catch (err) {
      console.error('Error fetching real-time metrics:', err)
      setError('Failed to load real-time analytics')
      toast({
        variant: 'destructive',
        title: 'Analytics Error',
        description: 'Unable to load real-time metrics. Please try again.'
      })
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchMetrics()

    // Auto-refresh every 30 seconds for real-time feel
    const interval = setInterval(fetchMetrics, 30 * 1000)

    return () => clearInterval(interval)
  }, []) // Remove fetchMetrics from dependencies to prevent infinite loops

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return <TrendingUp className="h-3 w-3 text-green-600" />
    if (value <= thresholds.warning) return <AlertCircle className="h-3 w-3 text-yellow-600" />
    return <TrendingDown className="h-3 w-3 text-red-600" />
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Real-Time Analytics
          </CardTitle>
          <CardDescription>Error loading analytics data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-center">
            <div>
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchMetrics}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-Time Analytics
            </CardTitle>
            <CardDescription>
              Live system metrics and performance indicators
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Live
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMetrics}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Approvals</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {attendanceMetrics.attendanceRate.toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground">Attendance Rate</div>
                <div className="text-xs text-green-600 mt-1">
                  {attendanceMetrics.presentToday.toFixed(2)} of {attendanceMetrics.totalEmployees} present
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(attendanceMetrics.remoteWorkers)}
                </div>
                <div className="text-sm text-muted-foreground">Remote Workers</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.round(attendanceMetrics.lateArrivals)}
                </div>
                <div className="text-sm text-muted-foreground">Late Arrivals</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(taskMetrics.openTasks)}
                </div>
                <div className="text-sm text-muted-foreground">Open Tasks</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(taskMetrics.completedToday)}
                </div>
                <div className="text-sm text-muted-foreground">Completed Today</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {Math.round(taskMetrics.overdueTasks)}
                </div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(approvalMetrics.totalPending)}
                </div>
                <div className="text-sm text-muted-foreground">Total Pending</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(approvalMetrics.pendingLeaveRequests)}
                </div>
                <div className="text-sm text-muted-foreground">Leave Requests</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {Math.round(approvalMetrics.pendingTimesheets)}
                </div>
                <div className="text-sm text-muted-foreground">Timesheets</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getStatusColor(systemMetrics.uptime, { good: 99.5, warning: 99.0 })}`}>
                  {systemMetrics.uptime.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Uptime</div>
                {getStatusIcon(systemMetrics.uptime, { good: 99.5, warning: 99.0 })}
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getStatusColor(systemMetrics.responseTime, { good: 50, warning: 100 })}`}>
                  {Math.round(systemMetrics.responseTime)}ms
                </div>
                <div className="text-sm text-muted-foreground">Response Time</div>
                {getStatusIcon(systemMetrics.responseTime, { good: 50, warning: 100 })}
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(systemMetrics.activeSessions).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Active Sessions</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getStatusColor(systemMetrics.memoryUsage, { good: 2.0, warning: 2.5 })}`}>
                  {systemMetrics.memoryUsage.toFixed(1)}GB
                </div>
                <div className="text-sm text-muted-foreground">Memory Usage</div>
                {getStatusIcon(systemMetrics.memoryUsage, { good: 2.0, warning: 2.5 })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
          Last updated: {systemMetrics.lastUpdated.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}
