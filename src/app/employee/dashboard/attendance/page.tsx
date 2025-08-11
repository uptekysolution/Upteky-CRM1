'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckInOut } from "@/components/attendance/CheckInOut"
import { AttendanceTableClient } from "@/components/attendance/AttendanceTableClient"
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard"
import { LeaveRequestForm } from "@/components/attendance/LeaveRequestForm"
import { LeaveCalendar } from "@/components/ui/leave-calendar"
import { useLeaveManagement } from "@/hooks/useLeaveManagement"
import { Clock, Users, BarChart3, FileText } from 'lucide-react'

export default function EmployeeAttendancePage() {
    const { submitLeaveRequest } = useLeaveManagement({
        userRole: "Employee",
        currentUserId: "employee",
        currentUserName: "Employee"
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
                <p className="text-muted-foreground">
                    Check in/out and view your attendance records with geolocation tracking.
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
                        My Records
                    </TabsTrigger>
                    <TabsTrigger value="leave-management" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Leave Management
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        My Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="checkinout" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Check In/Out</CardTitle>
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
                                <CardTitle>Leave Management</CardTitle>
                                <CardContent className="p-0 pt-4">
                                    <LeaveRequestForm onSubmit={submitLeaveRequest} />
                                </CardContent>
                            </CardHeader>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Leave Calendar</CardTitle>
                                <CardContent className="p-0 pt-4">
                                    <LeaveCalendar 
                                        userRole="Employee"
                                        attendanceData={[]}
                                        currentUser={{ id: "employee", name: "Employee", role: "Employee" }}
                                    />
                                </CardContent>
                            </CardHeader>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <AnalyticsDashboard 
                        userRole=""
                        userId=""
                        teamId=""
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}