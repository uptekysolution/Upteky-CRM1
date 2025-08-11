'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckInOut } from "@/components/attendance/CheckInOut"
import { AttendanceTableClient } from "@/components/attendance/AttendanceTableClient"
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard"
import { LeaveRequestsTable } from "@/components/attendance/LeaveRequestsTable"
import { LeaveCalendar } from "@/components/ui/leave-calendar"
import { useLeaveManagement } from "@/hooks/useLeaveManagement"
import { Clock, Users, BarChart3, Calendar, FileText } from 'lucide-react'

export default function AdminAttendancePage() {
    const { 
        leaveRequests, 
        leaveBalance, 
        pendingRequestsCount, 
        submitLeaveRequest, 
        updateLeaveRequestStatus, 
        deleteLeaveRequest,
        isLoading 
    } = useLeaveManagement({
        userRole: "Admin",
        currentUserId: "admin",
        currentUserName: "Admin"
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
                <p className="text-muted-foreground">
                    Manage employee attendance with geolocation tracking and real-time monitoring.
                </p>
            </div>

            <Tabs defaultValue="checkinout" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="checkinout" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Check In/Out
                    </TabsTrigger>
                    <TabsTrigger value="records" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Attendance Records
                    </TabsTrigger>
                    <TabsTrigger value="leave-management" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Leave Management
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="checkinout" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance Check-In/Out</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CheckInOut />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="records" className="space-y-4">
                    <AttendanceTableClient />
                </TabsContent>

                <TabsContent value="leave-management" className="space-y-4">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Leave Requests</CardTitle>
                                <CardContent className="p-0 pt-4">
                                    <LeaveRequestsTable 
                                        userRole="Admin"
                                        leaveRequests={leaveRequests}
                                        onStatusUpdate={updateLeaveRequestStatus}
                                        isLoading={isLoading}
                                    />
                                </CardContent>
                            </CardHeader>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Leave Calendar</CardTitle>
                                <CardContent className="p-0 pt-4">
                                    <LeaveCalendar 
                                        userRole="Admin"
                                        attendanceData={[]}
                                        currentUser={{ id: "admin", name: "Admin", role: "Admin" }}
                                    />
                                </CardContent>
                            </CardHeader>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <AnalyticsDashboard 
                        userRole="Admin"
                        userId=""
                        teamId=""
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}