'use client'

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, FileText, Plus, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeaveRequestForm } from '@/components/attendance/LeaveRequestForm';
import { LeaveCalendar } from '@/components/ui/leave-calendar';
import { useLeaveManagement } from '@/hooks/useLeaveManagement';
import { LeaveRequest, LeaveStatus } from '@/types/leave';
import { useToast } from '@/hooks/use-toast';
import { safeFormat, getDaysBetween } from '@/utils/dateUtils';

// Mock user data - in real app, this would come from auth context
const currentUser = {
  id: 'user-emp-jane',
  name: 'Jane Smith',
  role: 'Employee'
};

const getStatusBadge = (status: LeaveStatus) => {
  switch (status) {
    case 'approved':
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <Check className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive">
          <X className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getLeaveTypeBadge = (leaveType: string) => {
  switch (leaveType) {
    case 'monthly':
      return <Badge variant="outline" className="text-blue-600 border-blue-200">Monthly</Badge>;
    case 'emergency':
      return <Badge variant="outline" className="text-red-600 border-red-200">Emergency</Badge>;
    case 'miscellaneous':
      return <Badge variant="outline" className="text-purple-600 border-purple-200">Miscellaneous</Badge>;
    default:
      return <Badge variant="outline">{leaveType}</Badge>;
  }
};

export default function LeaveRequestsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const { toast } = useToast();

  const {
    leaveRequests,
    leaveBalance,
    isLoading,
    isSubmitting,
    isUpdating,
    submitLeaveRequest,
    updateLeaveRequestStatus,
    deleteLeaveRequest,
    getPendingRequestsCount,
    getMonthlyLeaveUsed,
    pendingRequests,
    approvedRequests,
    rejectedRequests
  } = useLeaveManagement({
    userRole: currentUser.role,
    currentUserId: currentUser.id,
    currentUserName: currentUser.name
  });

  const handleSubmitRequest = async (formData: any) => {
    try {
      await submitLeaveRequest(formData);
      setShowRequestForm(false);
      toast({
        title: 'Leave Request Submitted',
        description: 'Your leave request has been submitted successfully and is pending approval.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'Failed to submit leave request. Please try again.',
      });
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteLeaveRequest(requestId);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete leave request. Please try again.',
      });
    }
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">
            Request and manage your leave applications
          </p>
        </div>
        <Button onClick={() => setShowRequestForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Request Leave
        </Button>
      </div>

      {/* Leave Balance Summary */}
      {leaveBalance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Leave Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {leaveBalance.monthly.remaining}
                </div>
                <p className="text-sm text-blue-700">Monthly Leave Remaining</p>
                <p className="text-xs text-blue-600 mt-1">
                  {leaveBalance.monthly.used}/{leaveBalance.monthly.allocated} used
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {leaveBalance.emergency.used}
                </div>
                <p className="text-sm text-green-700">Emergency Leave Used</p>
                <p className="text-xs text-green-600 mt-1">
                  {leaveBalance.emergency.pending} pending
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">
                  {leaveBalance.miscellaneous.used}
                </div>
                <p className="text-sm text-purple-700">Miscellaneous Leave Used</p>
                <p className="text-xs text-purple-600 mt-1">
                  {leaveBalance.miscellaneous.pending} pending
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {leaveRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No leave requests found
                  </p>
                ) : (
                  <div className="space-y-3">
                    {leaveRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {safeFormat(request.startDate, 'MMM dd')} - {safeFormat(request.endDate, 'MMM dd')}
                            </span>
                            {getStatusBadge(request.status)}
                            {getLeaveTypeBadge(request.leaveType)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {request.reason}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getDaysBetween(request.startDate, request.endDate)} days
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pending Requests</span>
                    <Badge variant="secondary">{pendingRequests.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Approved This Month</span>
                    <Badge variant="default">{approvedRequests.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Leave Used</span>
                    <Badge variant="outline">{getMonthlyLeaveUsed()}/2</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Requests</span>
                    <Badge variant="outline">{leaveRequests.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <LeaveCalendar
            leaveRequests={leaveRequests}
            userRole={currentUser.role}
            currentUserId={currentUser.id}
            showLeaveRequests={true}
          />
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {leaveRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No leave requests found
                </p>
              ) : (
                <div className="space-y-3">
                  {leaveRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">
                              {safeFormat(request.startDate, 'MMM dd, yyyy')} - {safeFormat(request.endDate, 'MMM dd, yyyy')}
                            </span>
                            {getStatusBadge(request.status)}
                            {getLeaveTypeBadge(request.leaveType)}
                            <Badge variant="outline">
                              {getDaysBetween(request.startDate, request.endDate)} days
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {request.reason}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Requested on {safeFormat(request.requestedAt, 'MMM dd, yyyy HH:mm')}
                            {request.approvedBy && (
                              <span> • Processed by {request.approvedBy}</span>
                            )}
                            {request.approvedAt && (
                              <span> on {safeFormat(request.approvedAt, 'MMM dd, yyyy')}</span>
                            )}
                          </div>
                          {request.rejectionReason && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              <strong>Rejection Reason:</strong> {request.rejectionReason}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          {request.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRequest(request.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Leave Request Form Dialog */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Request Leave</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRequestForm(false)}
                >
                  ×
                </Button>
              </div>
              <LeaveRequestForm
                onSubmit={handleSubmitRequest}
                isLoading={isSubmitting}
                monthlyLeaveUsed={getMonthlyLeaveUsed()}
                maxMonthlyLeave={2}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

