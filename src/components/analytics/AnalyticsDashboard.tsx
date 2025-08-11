'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAttendanceAnalytics } from '@/hooks/useAttendanceAnalytics'
import { TrendsChart } from './TrendsChart'
import { GeofenceComplianceChart } from './GeofenceCompliance'
import { LeaveTracker } from './LeaveTracker'
import { HolidayCalendar } from './HolidayCalendar'
import { TeamMetricsTable } from './TeamMetrics'
import { BarChart3, PieChart, Calendar, Users, TrendingUp } from 'lucide-react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

interface AnalyticsDashboardProps {
  userRole: string
  userId: string
  teamId?: string
}

export function AnalyticsDashboard({ userRole, userId, teamId }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState('3months')
  const [startDate, setStartDate] = useState<string>()
  const [endDate, setEndDate] = useState<string>()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentUserData, setCurrentUserData] = useState<any>(null)

  // Get current user if userId is not provided
  useEffect(() => {
    if (!userId) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user)
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid))
            if (userDoc.exists()) {
              const data = userDoc.data()
              setCurrentUserData({
                role: data.role || 'Employee',
                teamId: data.teamId || null,
                name: data.name || data.email || 'Unknown',
                email: data.email || ''
              })
            } else {
              setCurrentUserData({ role: 'Employee', name: 'Unknown', email: user.email || '' })
            }
          } catch (error) {
            console.error('Error fetching user data:', error)
            setCurrentUserData({ role: 'Employee', name: 'Unknown', email: user.email || '' })
          }
        }
      })

      return () => unsubscribe()
    }
  }, [userId])

  // Use provided props or current user data
  const effectiveUserRole = userId ? userRole : currentUserData?.role || 'Employee'
  const effectiveUserId = userId || currentUser?.uid || ''
  const effectiveTeamId = teamId || currentUserData?.teamId

  const {
    records,
    leaveBalance,
    teamMetrics,
    monthlyTrends,
    geofenceCompliance,
    loading,
    error,
    refreshLeaveBalance,
    getUserPermissions
  } = useAttendanceAnalytics(startDate, endDate, effectiveUserRole, effectiveUserId, effectiveTeamId)

  const permissions = getUserPermissions()

  // Calculate date range
  React.useEffect(() => {
    const now = new Date()
    let start: Date

    switch (dateRange) {
      case '1month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case '3months':
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        break
      case '6months':
        start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        break
      case '1year':
        start = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        break
      default:
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    }

    setStartDate(start.toISOString().split('T')[0])
    setEndDate(now.toISOString().split('T')[0])
  }, [dateRange])

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading analytics</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive attendance insights and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{records.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <PieChart className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Geofence Compliance</p>
                <p className="text-2xl font-bold">{geofenceCompliance.percentage.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leave Remaining</p>
                <p className="text-2xl font-bold">{leaveBalance?.remaining || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teams</p>
                <p className="text-2xl font-bold">{teamMetrics.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          {/* <TabsTrigger value="leave" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Leave</span>
          </TabsTrigger> */}
          {(permissions.canViewAll || permissions.canViewTeam) && (
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Teams</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <TrendsChart data={monthlyTrends} loading={loading} />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <GeofenceComplianceChart data={geofenceCompliance} loading={loading} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <HolidayCalendar 
            records={records} 
            loading={loading} 
            onRefresh={refreshLeaveBalance}
            userRole={effectiveUserRole}
            teamId={effectiveTeamId}
          />
        </TabsContent>

        {/* <TabsContent value="leave" className="space-y-4">
          <LeaveTracker 
            leaveBalance={leaveBalance} 
            loading={loading} 
            onRefresh={refreshLeaveBalance}
          />
        </TabsContent> */}

        {(permissions.canViewAll || permissions.canViewTeam) && (
          <TabsContent value="teams" className="space-y-4">
            <TeamMetricsTable data={teamMetrics} loading={loading} />
          </TabsContent>
        )}
      </Tabs>

      {/* Role-based Access Notice */}
      {!permissions.canViewAll && !permissions.canViewTeam && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You can only view your own analytics data. 
              Contact your administrator for broader access.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
