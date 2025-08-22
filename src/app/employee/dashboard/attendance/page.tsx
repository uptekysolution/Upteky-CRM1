'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckInOut } from "@/components/attendance/CheckInOut"
import { AttendanceTableClient } from "@/components/attendance/AttendanceTableClient"
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard"
import { LeaveRequestForm } from "@/components/attendance/LeaveRequestForm"
import { LeaveCalendar } from "@/components/ui/leave-calendar"
import { useLeaveManagement } from "@/hooks/useLeaveManagement"
import { safeFormat, getDaysBetween } from "@/utils/dateUtils"
import { Clock, Users, BarChart3, FileText, Check, X } from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { AttendancePermissionGuard } from "@/components/attendance-permission-guard"

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
        leaveRequests,
        submitLeaveRequest,
        isSubmitting,
        getMonthlyLeaveUsed,
        pendingRequests,
        approvedRequests,
        rejectedRequests
    } = useLeaveManagement({
        userRole: currentUserRole,
        currentUserId: currentUserId,
        currentUserName: currentUserName
    });

    return (
        <AttendancePermissionGuard>
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
                                <CardTitle>Request Leave</CardTitle>
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

                        {/* Pending Leave Requests */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Pending Leave Requests ({pendingRequests.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {pendingRequests.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No pending leave requests
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {pendingRequests.map((request) => (
                                            <div key={request.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-medium">
                                                                {safeFormat(request.startDate, 'MMM dd')} - {safeFormat(request.endDate, 'MMM dd')}
                                                            </span>
                                                            <Badge variant="secondary">
                                                                {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)}
                                                            </Badge>
                                                            <Badge variant="outline">
                                                                {getDaysBetween(request.startDate, request.endDate)} days
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            {request.reason}
                                                        </p>
                                                        <div className="text-xs text-muted-foreground">
                                                            Requested on {safeFormat(request.requestedAt, 'MMM dd, yyyy HH:mm')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Processed Leave Requests */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Processed Leave Requests ({approvedRequests.length + rejectedRequests.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {approvedRequests.length === 0 && rejectedRequests.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No processed leave requests
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {[...approvedRequests, ...rejectedRequests]
                                            .sort((a, b) => {
                                                const dateA = a.approvedAt || a.requestedAt;
                                                const dateB = b.approvedAt || b.requestedAt;
                                                return new Date(dateB).getTime() - new Date(dateA).getTime();
                                            })
                                            .map((request) => (
                                            <div key={request.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-medium">
                                                                {safeFormat(request.startDate, 'MMM dd')} - {safeFormat(request.endDate, 'MMM dd')}
                                                            </span>
                                                            <Badge variant="secondary">
                                                                {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)}
                                                            </Badge>
                                                            <Badge variant="outline">
                                                                {getDaysBetween(request.startDate, request.endDate)} days
                                                            </Badge>
                                                            {request.status === 'approved' ? (
                                                                <Badge variant="default" className="bg-green-100 text-green-800">
                                                                    <Check className="h-3 w-3 mr-1" />
                                                                    Approved
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="destructive">
                                                                    <X className="h-3 w-3 mr-1" />
                                                                    Rejected
                                                                </Badge>
                                                            )}
                                                            {request.status === 'approved' && request.paymentType && (
                                                                <Badge variant={request.paymentType === 'paid' ? 'default' : 'secondary'}>
                                                                    {request.paymentType === 'paid' ? 'Paid' : 'Unpaid'}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            {request.reason}
                                                        </p>
                                                        <div className="text-xs text-muted-foreground">
                                                            {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.approvedBy} on {request.approvedAt ? safeFormat(request.approvedAt, 'MMM dd, yyyy') : 'N/A'}
                                                        </div>
                                                        {request.status === 'rejected' && request.rejectionReason && (
                                                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                                                <strong>Rejection Reason:</strong> {request.rejectionReason}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Leave Calendar</CardTitle>
                                <CardContent className="p-0 pt-4">
                                    <LeaveCalendar 
                                        userRole={currentUserRole}
                                        leaveRequests={leaveRequests}
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
        </AttendancePermissionGuard>
    )
}