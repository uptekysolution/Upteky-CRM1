'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Check, X, Bell, Filter } from 'lucide-react';
import { LeaveRequestsTable } from '@/components/attendance/LeaveRequestsTable';
import { LeaveCalendar } from '@/components/ui/leave-calendar';
import { useLeaveManagement } from '@/hooks/useLeaveManagement';
import { LeaveStatus } from '@/types/leave';
import { useToast } from '@/hooks/use-toast';

// Mock admin user data - in real app, this would come from auth context
const currentUser = {
  id: 'user-admin',
  name: 'Admin User',
  role: 'Admin'
};

export default function AdminLeaveRequestsPage() {
  const [activeTab, setActiveTab] = useState('requests');
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>('all');
  const { toast } = useToast();

  const {
    leaveRequests,
    isLoading,
    isUpdating,
    updateLeaveRequestStatus,
    getPendingRequestsCount,
    pendingRequests,
    approvedRequests,
    rejectedRequests
  } = useLeaveManagement({
    userRole: currentUser.role,
    currentUserId: currentUser.id,
    currentUserName: currentUser.name
  });

  const handleStatusUpdate = async (requestId: string, status: LeaveStatus, rejectionReason?: string) => {
    try {
      await updateLeaveRequestStatus(requestId, status, rejectionReason);
      toast({
        title: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        description: `The leave request has been ${status} successfully.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update leave request status. Please try again.',
      });
      throw error;
    }
  };

  const getFilteredRequests = () => {
    if (statusFilter === 'all') return leaveRequests;
    return leaveRequests.filter(req => req.status === statusFilter);
  };

  const getStats = () => {
    return {
      total: leaveRequests.length,
      pending: pendingRequests.length,
      approved: approvedRequests.length,
      rejected: rejectedRequests.length
    };
  };

  const stats = getStats();

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
            Review and manage employee leave requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getPendingRequestsCount() > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              {getPendingRequestsCount()} Pending
            </Badge>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <Check className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <X className="h-4 w-4 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Leave Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {/* Filter Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter by Status:</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                  >
                    All ({stats.total})
                  </Button>
                  <Button
                    variant={statusFilter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('pending')}
                  >
                    Pending ({stats.pending})
                  </Button>
                  <Button
                    variant={statusFilter === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('approved')}
                  >
                    Approved ({stats.approved})
                  </Button>
                  <Button
                    variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('rejected')}
                  >
                    Rejected ({stats.rejected})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Requests Table */}
          <LeaveRequestsTable
            leaveRequests={getFilteredRequests()}
            onStatusUpdate={handleStatusUpdate}
            isLoading={isUpdating}
            userRole={currentUser.role}
          />
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leave Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['monthly', 'emergency', 'miscellaneous'].map((type) => {
                    const typeRequests = leaveRequests.filter(req => req.leaveType === type);
                    const approved = typeRequests.filter(req => req.status === 'approved').length;
                    const pending = typeRequests.filter(req => req.status === 'pending').length;
                    const rejected = typeRequests.filter(req => req.status === 'rejected').length;

                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{type} Leave</span>
                          <span className="text-sm text-muted-foreground">{typeRequests.length} total</span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="default" className="text-xs">
                            {approved} Approved
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {pending} Pending
                          </Badge>
                          <Badge variant="destructive" className="text-xs">
                            {rejected} Rejected
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 6 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    
                    // This would need to be enhanced with actual monthly data
                    const monthlyRequests = leaveRequests.filter(req => {
                      const requestDate = req.startDate.toDate ? req.startDate.toDate() : new Date(req.startDate);
                      return requestDate.getMonth() === date.getMonth() && 
                             requestDate.getFullYear() === date.getFullYear();
                    });

                    return (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{monthName}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {monthlyRequests.length} requests
                          </Badge>
                          <Badge variant="default" className="text-xs">
                            {monthlyRequests.filter(req => req.status === 'approved').length} approved
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <Calendar className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">View Calendar</div>
                      <div className="text-xs text-muted-foreground">See all leave dates</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <Clock className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">Pending Requests</div>
                      <div className="text-xs text-muted-foreground">{stats.pending} need attention</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <Check className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">Approved This Month</div>
                      <div className="text-xs text-muted-foreground">{stats.approved} requests</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

