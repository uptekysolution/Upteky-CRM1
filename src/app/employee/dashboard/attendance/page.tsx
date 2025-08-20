'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckInOut } from "@/components/attendance/CheckInOut"
import { AttendanceTableClient } from "@/components/attendance/AttendanceTableClient"
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard"
import { LeaveRequestForm } from "@/components/attendance/LeaveRequestForm"
import { LeaveCalendar } from "@/components/ui/leave-calendar"
import { useLeaveManagement } from "@/hooks/useLeaveManagement"
import { Clock, Users, BarChart3, FileText } from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function EmployeeAttendancePage() {
    const [currentUserId, setCurrentUserId] = useState<string>("")
    const [currentUserName, setCurrentUserName] = useState<string>("")
    const [currentUserRole, setCurrentUserRole] = useState<string>("Employee")
    const [currentTeamId, setCurrentTeamId] = useState<string | undefined>(undefined)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setCurrentUserId("")
                setCurrentUserName("")
                setCurrentUserRole("Employee")
                setCurrentTeamId(undefined)
                return
            }
            setCurrentUserId(user.uid)
            let resolvedName: string | null = user.displayName || null
            let resolvedRole: string | null = null
            let resolvedTeamId: string | undefined = undefined
            try {
                const snap = await getDoc(doc(db, 'users', user.uid))
                if (snap.exists()) {
                    const data = snap.data() as any
                    resolvedName = data?.name || data?.fullName || resolvedName
                    resolvedRole = data?.role || null
                    resolvedTeamId = data?.teamId || undefined
                }
            } catch {}
            if (!resolvedName) {
                const localPart = user.email?.split('@')[0] ?? 'User'
                resolvedName = localPart
                    .split(/[._-]+/)
                    .filter(Boolean)
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')
            }
            setCurrentUserName(resolvedName)
            setCurrentUserRole(resolvedRole || 'Employee')
            setCurrentTeamId(resolvedTeamId)
        })
        return () => unsubscribe()
    }, [])

    const {
        submitLeaveRequest,
        isSubmitting,
        getMonthlyLeaveUsed,
    } = useLeaveManagement({
        userRole: currentUserRole,
        currentUserId: currentUserId,
        currentUserName: currentUserName
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
                                    <LeaveRequestForm 
                                        onSubmit={submitLeaveRequest} 
                                        isLoading={isSubmitting}
                                        monthlyLeaveUsed={getMonthlyLeaveUsed()}
                                        maxMonthlyLeave={2}
                                    />
                                </CardContent>
                            </CardHeader>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Leave Calendar</CardTitle>
                                <CardContent className="p-0 pt-4">
                                    <LeaveCalendar 
                                        userRole={currentUserRole}
                                        leaveRequests={[]}
                                        currentUserId={currentUserId}
                                    />
                                </CardContent>
                            </CardHeader>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <AnalyticsDashboard 
                        userRole={currentUserRole}
                        userId={currentUserId}
                        teamId={currentTeamId}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}