'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckInOut } from "@/components/attendance/CheckInOut"
import { AttendanceTableClient } from "@/components/attendance/AttendanceTableClient"
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard"
import { Clock, Users, BarChart3 } from 'lucide-react'

export default function EmployeeAttendancePage() {
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