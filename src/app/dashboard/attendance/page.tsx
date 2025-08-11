
'use client'
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Clock, Edit, MoreVertical, ThumbsUp, Send, AlertTriangle, FileText, Calendar } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Line, LineChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LeaveRequestForm } from "@/components/attendance/LeaveRequestForm"
import { LeaveCalendar } from "@/components/ui/leave-calendar"
import { useLeaveManagement } from "@/hooks/useLeaveManagement"


const attendanceData = [
    {
        id: '1',
        userId: 'user-tl-john',
        user: 'John Doe', // For display purposes
        role: 'Team Lead', // For display purposes
        date: '2024-07-29',
        clockInTime: '2024-07-29T09:05:00Z',
        clockInLocation: { latitude: 19.0760, longitude: 72.8777, ipAddress: '203.0.113.1', accuracy: 10 },
        clockInPhotoUrl: 'https://placehold.co/100x100.png',
        clockInDeviceId: 'device-abc-123',
        clockOutTime: '2024-07-29T17:30:00Z',
        clockOutLocation: { latitude: 19.0760, longitude: 72.8777, ipAddress: '203.0.113.1', accuracy: 12 },
        clockOutPhotoUrl: 'https://placehold.co/100x100.png',
        clockOutDeviceId: 'device-abc-123',
        totalHours: 8.42,
        regularHours: 8,
        potentialOvertimeHours: 0.42,
        approvedOvertimeHours: 0,
        status: 'Present',
        approvedByUserId: null,
        approvedAt: null,
        verificationStatus: 'Verified',
        verificationDetails: null,
        overtimeApprovalStatus: 'Pending',
        overtimeApprovedByUserId: null,
        overtimeApprovedAt: null,
        overtimeReason: 'Finishing up the Q3 report.',
        adminComment: null,
    },
    {
        id: '2',
        userId: 'user-emp-jane',
        user: 'Jane Smith',
        role: 'Employee',
        teamId: 1,
        date: '2024-07-29',
        clockInTime: null,
        clockInLocation: null,
        clockInPhotoUrl: null,
        clockInDeviceId: null,
        clockOutTime: null,
        clockOutLocation: null,
        clockOutPhotoUrl: null,
        clockOutDeviceId: null,
        totalHours: 0,
        regularHours: 0,
        potentialOvertimeHours: 0,
        approvedOvertimeHours: 0,
        status: 'Absent',
        approvedByUserId: null,
        approvedAt: null,
        verificationStatus: 'N/A',
        verificationDetails: null,
        overtimeApprovalStatus: 'N/A',
        overtimeApprovedByUserId: null,
        overtimeApprovedAt: null,
        overtimeReason: null,
        adminComment: null,
    },
    {
        id: '3',
        userId: 'user-hr-peter',
        user: 'Peter Jones',
        role: 'HR',
        date: '2024-07-29',
        clockInTime: '2024-07-29T09:45:00Z',
        clockInLocation: { latitude: 19.0760, longitude: 72.8777, ipAddress: '203.0.113.5', accuracy: 500 },
        clockInPhotoUrl: 'https://placehold.co/100x100.png',
        clockInDeviceId: 'device-def-456',
        clockOutTime: '2024-07-29T18:00:00Z',
        clockOutLocation: { latitude: 19.0760, longitude: 72.8777, ipAddress: '203.0.113.5', accuracy: 520 },
        clockOutPhotoUrl: 'https://placehold.co/100x100.png',
        clockOutDeviceId: 'device-def-456',
        totalHours: 8.25,
        regularHours: 8.0,
        potentialOvertimeHours: 0.25,
        approvedOvertimeHours: 0.25,
        status: 'Present',
        approvedByUserId: 'user-admin',
        approvedAt: '2024-07-30T10:00:00Z',
        verificationStatus: 'Location Mismatch',
        verificationDetails: 'Clock-in location accuracy (500m) is outside the allowed radius (100m).',
        overtimeApprovalStatus: 'Approved',
        overtimeApprovedByUserId: 'user-admin',
        overtimeApprovedAt: '2024-07-30T11:00:00Z',
        overtimeReason: 'Client call ran late.',
        adminComment: 'Approved due to client commitment.',
    },
];

const teamMembers = [
    { teamId: 1, userId: 'user-tl-john', role: 'lead' },
    { teamId: 1, userId: 'user-emp-jane', role: 'member' },
    { teamId: 1, userId: 'user-bd-sam', role: 'member' },
];


const trendData = [
  { name: 'Mon', Present: 90, Absent: 5, Late: 5 },
  { name: 'Tue', Present: 95, Absent: 2, Late: 3 },
  { name: 'Wed', Present: 88, Absent: 8, Late: 4 },
  { name: 'Thu', Present: 92, Absent: 4, Late: 4 },
  { name: 'Fri', Present: 98, Absent: 1, Late: 1 },
];

const chartConfig = {
  Present: { label: "Present", color: "hsl(var(--chart-1))" },
  Absent: { label: "Absent", color: "hsl(var(--chart-2))" },
  Late: { label: "Late", color: "hsl(var(--chart-3))" },
}

// Mock user for demonstration. In a real app, this would come from an auth context.
const currentUser = { id: "user-tl-john", name: "John Doe", role: "Team Lead" }; // Can be 'Employee', 'Team Lead', 'HR', 'Admin'


const getVisibleData = () => {
    switch (currentUser.role) {
        case 'Admin':
        case 'Sub-Admin':
            return attendanceData;
        case 'HR':
            return attendanceData.filter(d => d.role !== 'Admin' && d.role !== 'Sub-Admin');
        case 'Team Lead':
            const leadTeam = teamMembers.find(m => m.userId === currentUser.id && m.role === 'lead');
            if (!leadTeam) return attendanceData.filter(d => d.userId === currentUser.id);

            const teamMemberIds = teamMembers.filter(m => m.teamId === leadTeam.teamId).map(m => m.userId);
            return attendanceData.filter(d => teamMemberIds.includes(d.userId));
        case 'Employee':
             return attendanceData.filter(d => d.userId === currentUser.id);
        default:
            return [];
    }
}

const canEdit = (record: typeof attendanceData[0]) => {
    if (currentUser.role === 'Admin') return true;
    if (currentUser.role === 'HR') return record.role !== 'Admin' && record.role !== 'Sub-Admin';
    if (currentUser.role === 'Team Lead') {
        const leadTeam = teamMembers.find(m => m.userId === currentUser.id && m.role === 'lead');
        if (!leadTeam) return record.userId === currentUser.id;
        const teamMemberIds = teamMembers.filter(m => m.teamId === leadTeam.teamId).map(m => m.userId);
        return teamMemberIds.includes(record.userId);
    }
    if (currentUser.role === 'Employee') return record.userId === currentUser.name;
    return false;
}

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Present': return 'default';
        case 'Absent': return 'destructive';
        case 'Pending Approval': return 'secondary';
        default: return 'outline';
    }
}

const getVerificationStatusVariant = (status: string) => {
    switch (status) {
        case 'Verified': return 'default';
        case 'Location Mismatch': return 'destructive';
        case 'IP Mismatch': return 'destructive';
        case 'Pending Review': return 'secondary';
        default: return 'outline';
    }
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'Present': return <Check className="h-4 w-4 text-green-500" />;
        case 'Absent': return <X className="h-4 w-4 text-red-500" />;
        case 'Pending Approval': return <Clock className="h-4 w-4 text-yellow-500" />;
        default: return null;
    }
}

const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    // When an ISO string is passed to the Date constructor, it's parsed as UTC.
    // toLocaleTimeString then correctly converts it to the runtime's local timezone.
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AttendancePage() {
  const visibleRecords = getVisibleData();
  const { leaveRequests, leaveBalance, pendingRequestsCount, submitLeaveRequest } = useLeaveManagement({
    userRole: currentUser.role,
    currentUserId: currentUser.id,
    currentUserName: currentUser.name
  });

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>My Attendance</CardTitle>
                <CardDescription>Record and view your daily attendance. Actions are required for non-admin roles.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-start gap-4">
                <Button disabled={currentUser.role === 'Admin' || currentUser.role === 'Sub-Admin'}>
                    <Clock className="mr-2 h-4 w-4" /> Check In
                </Button>
                <Button variant="outline" disabled={currentUser.role === 'Admin' || currentUser.role === 'Sub-Admin'}>
                    Check Out
                </Button>
            </CardContent>
        </Card>

        <Tabs defaultValue="records" className="space-y-4">
            <TabsList>
                <TabsTrigger value="records" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Attendance Records
                </TabsTrigger>
                <TabsTrigger value="leave-management" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Leave Management
                </TabsTrigger>
                <TabsTrigger value="trends" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Weekly Trends
                </TabsTrigger>
            </TabsList>

            <TabsContent value="records" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Attendance Records</CardTitle>
                        <CardDescription>
                            {currentUser.role === 'Team Lead' ? "Your team's attendance data." : "Viewing all accessible attendance records."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden sm:table-cell">Check-In</TableHead>
                                <TableHead className="hidden sm:table-cell">Check-Out</TableHead>
                                <TableHead className="hidden lg:table-cell">Verification</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleRecords.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell>{record.date}</TableCell>
                                <TableCell className="font-medium">{record.user}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(record.status)} className="flex w-fit items-center gap-1">
                                        {getStatusIcon(record.status)}
                                        <span>{record.status}</span>
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">{formatTime(record.clockInTime)}</TableCell>
                                <TableCell className="hidden sm:table-cell">{formatTime(record.clockOutTime)}</TableCell>
                                 <TableCell className="hidden lg:table-cell">
                                    <Badge variant={getVerificationStatusVariant(record.verificationStatus)} className="flex w-fit items-center gap-1">
                                        {record.verificationStatus !== 'Verified' && <AlertTriangle className="h-4 w-4" />}
                                        <span>{record.verificationStatus}</span>
                                    </Badge>
                                 </TableCell>
                                <TableCell className="text-right">
                                   {canEdit(record) && (
                                     <DropdownMenu>
                                       <DropdownMenuTrigger asChild>
                                         <Button variant="ghost" size="icon">
                                           <MoreVertical className="h-4 w-4" />
                                           <span className="sr-only">Actions</span>
                                         </Button>
                                       </DropdownMenuTrigger>
                                       <DropdownMenuContent align="end">
                                         <DropdownMenuItem>
                                           <Edit className="mr-2 h-4 w-4" />
                                           <span>Edit Record</span>
                                         </DropdownMenuItem>
                                         {(currentUser.role === 'Team Lead' || currentUser.role === 'HR' || currentUser.role === 'Admin') && (
                                             <DropdownMenuItem>
                                                <ThumbsUp className="mr-2 h-4 w-4" />
                                                <span>Approve</span>
                                             </DropdownMenuItem>
                                         )}
                                       </DropdownMenuContent>
                                     </DropdownMenu>
                                   )}
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="leave-management" className="space-y-4">
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Leave Management</CardTitle>
                            <CardDescription>Request and manage your leave applications.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row items-center justify-start gap-4">
                            <LeaveRequestForm onSubmit={submitLeaveRequest} />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Leave Calendar</CardTitle>
                            <CardDescription>View your approved and pending leave days on the calendar.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 pt-4">
                            <LeaveCalendar 
                                userRole={currentUser.role}
                                attendanceData={visibleRecords}
                                currentUser={currentUser}
                            />
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Attendance Trends</CardTitle>
                        <CardDescription>A visual overview of attendance this week.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <LineChart data={trendData} margin={{ left: 12, right: 12 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                  dataKey="name"
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={8}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Line dataKey="Present" type="monotone" stroke="var(--color-Present)" strokeWidth={2} dot={false} />
                                <Line dataKey="Absent" type="monotone" stroke="var(--color-Absent)" strokeWidth={2} dot={false} />
                                <Line dataKey="Late" type="monotone" stroke="var(--color-Late)" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
