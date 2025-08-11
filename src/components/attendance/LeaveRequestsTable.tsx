'use client'

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Check, X, Clock, Eye, MoreVertical, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { LeaveRequest, LeaveStatus } from '@/types/leave';
import { useToast } from '@/hooks/use-toast';
import { safeToDate, safeFormat, getDaysBetween } from '@/utils/dateUtils';

interface LeaveRequestsTableProps {
  leaveRequests?: LeaveRequest[];
  onStatusUpdate: (requestId: string, status: LeaveStatus, rejectionReason?: string) => Promise<void>;
  isLoading?: boolean;
  userRole: string;
}

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

const getDaysRequested = (startDate: any, endDate: any) => {
  return getDaysBetween(startDate, endDate);
};

export function LeaveRequestsTable({ 
  leaveRequests, 
  onStatusUpdate, 
  isLoading = false,
  userRole 
}: LeaveRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const canApprove = (request: LeaveRequest) => {
    if (userRole === 'Admin') return true;
    if (userRole === 'HR') return request.role !== 'Admin' && request.role !== 'Sub-Admin';
    if (userRole === 'Sub-Admin') return request.role === 'Employee' || request.role === 'Team Lead';
    return false;
  };

  const handleStatusUpdate = async (status: LeaveStatus) => {
    if (!selectedRequest) return;

    if (status === 'rejected' && !rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejecting this leave request.',
      });
      return;
    }

    setIsUpdating(true);
    try {
      await onStatusUpdate(
        selectedRequest.id, 
        status, 
        status === 'rejected' ? rejectionReason : undefined
      );
      
      toast({
        title: `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        description: `The leave request has been ${status} successfully.`,
      });
      
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Failed to update leave request status. Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Add null checks for leaveRequests
  const requests = leaveRequests || [];
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading leave requests...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Leave Requests ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pending leave requests</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.userName}</div>
                        <div className="text-sm text-muted-foreground">{request.role}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getLeaveTypeBadge(request.leaveType)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{safeFormat(request.startDate, 'MMM dd, yyyy')}</div>
                        <div className="text-muted-foreground">to {safeFormat(request.endDate, 'MMM dd, yyyy')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getDaysRequested(request.startDate, request.endDate)} days
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={request.reason}>
                        {request.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {safeFormat(request.requestedAt, 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedRequest(request)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {canApprove(request) && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleStatusUpdate('approved')}
                                className="text-green-600"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setSelectedRequest(request)}
                                className="text-red-600"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Leave Requests ({processedRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed By</TableHead>
                  <TableHead>Processed On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.userName}</div>
                        <div className="text-sm text-muted-foreground">{request.role}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getLeaveTypeBadge(request.leaveType)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{safeFormat(request.startDate, 'MMM dd, yyyy')}</div>
                        <div className="text-muted-foreground">to {safeFormat(request.endDate, 'MMM dd, yyyy')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getDaysRequested(request.startDate, request.endDate)} days
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {request.approvedBy || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {request.approvedAt ? safeFormat(request.approvedAt, 'MMM dd, yyyy') : '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Leave Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>
              Review the leave request details and take appropriate action.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Employee</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.userName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.role}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Leave Type</Label>
                  <div className="mt-1">{getLeaveTypeBadge(selectedRequest.leaveType)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Days Requested</Label>
                  <p className="text-sm text-muted-foreground">
                    {getDaysRequested(selectedRequest.startDate, selectedRequest.endDate)} days
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <p className="text-sm text-muted-foreground">
                    {safeFormat(selectedRequest.startDate, 'EEEE, MMMM dd, yyyy')} to{' '}
                    {safeFormat(selectedRequest.endDate, 'EEEE, MMMM dd, yyyy')}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Reason</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRequest.reason}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Requested On</Label>
                  <p className="text-sm text-muted-foreground">
                    {safeFormat(selectedRequest.requestedAt, 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              {/* Monthly Leave Warning */}
              {selectedRequest.leaveType === 'monthly' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This is a monthly leave request. Please ensure the employee hasn't exceeded their monthly limit.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && canApprove(selectedRequest) && (
                <div className="space-y-4">
                  {/* Rejection Reason Input */}
                  <div>
                    <Label htmlFor="rejectionReason" className="text-sm font-medium">
                      Rejection Reason (required for rejection)
                    </Label>
                    <Textarea
                      id="rejectionReason"
                      placeholder="Provide a reason for rejecting this leave request..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(null);
                        setRejectionReason('');
                      }}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Rejecting...' : 'Reject Request'}
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('approved')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Approving...' : 'Approve Request'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
