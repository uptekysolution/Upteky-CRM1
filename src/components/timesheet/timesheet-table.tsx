'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, CheckCircle, XCircle, Clock, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { Timesheet, TimesheetStatus, TimesheetFilters } from '@/types/timesheet';
import { TimesheetService } from '@/lib/timesheet-service';
import { useToast } from '@/hooks/use-toast';

interface TimesheetTableProps {
  timesheets: Timesheet[];
  filters: TimesheetFilters;
  onRefresh: () => void;
}

export function TimesheetTable({ timesheets, filters, onRefresh }: TimesheetTableProps) {
  const { toast } = useToast();
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleViewDetails = (timesheet: Timesheet) => {
    setSelectedTimesheet(timesheet);
    setShowDetailsDialog(true);
  };

  const handleApprove = async (timesheet: Timesheet) => {
    try {
      await TimesheetService.approveTimesheet(
        timesheet.id, 
        'admin', // This should come from auth context
        'Admin User' // This should come from auth context
      );
      toast({
        title: "Timesheet Approved",
        description: `Timesheet for ${timesheet.employeeName} has been approved.`,
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve timesheet.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (timesheet: Timesheet) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    try {
      await TimesheetService.rejectTimesheet(
        timesheet.id,
        'admin', // This should come from auth context
        'Admin User', // This should come from auth context
        rejectionReason
      );
      toast({
        title: "Timesheet Rejected",
        description: `Timesheet for ${timesheet.employeeName} has been rejected.`,
      });
      setShowRejectDialog(false);
      setRejectionReason('');
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject timesheet.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: TimesheetStatus) => {
    const variants = {
      [TimesheetStatus.DRAFT]: 'secondary',
      [TimesheetStatus.SUBMITTED]: 'default',
      [TimesheetStatus.APPROVED]: 'default',
      [TimesheetStatus.REJECTED]: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status}
      </Badge>
    );
  };

  const filteredTimesheets = timesheets.filter(timesheet => {
    if (filters.employeeId && timesheet.employeeId !== filters.employeeId) return false;
    if (filters.status && timesheet.status !== filters.status) return false;
    if (filters.dateRange?.start && timesheet.weekStartDate < filters.dateRange.start) return false;
    if (filters.dateRange?.end && timesheet.weekEndDate > filters.dateRange.end) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesEmployee = timesheet.employeeName.toLowerCase().includes(searchLower);
      const matchesProject = timesheet.entries.some(entry => 
        entry.projectName.toLowerCase().includes(searchLower)
      );
      if (!matchesEmployee && !matchesProject) return false;
    }
    return true;
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timesheets ({filteredTimesheets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTimesheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No timesheets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTimesheets.map((timesheet) => (
                    <TableRow key={timesheet.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{timesheet.employeeName}</div>
                            <div className="text-sm text-muted-foreground">{timesheet.employeeEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(timesheet.weekStartDate, 'MMM d')} - {format(timesheet.weekEndDate, 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{timesheet.totalHours.toFixed(1)}h</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {Array.from(new Set(timesheet.entries.map(e => e.projectName))).join(', ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(timesheet.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(timesheet)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {timesheet.status === TimesheetStatus.SUBMITTED && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(timesheet)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTimesheet(timesheet);
                                  setShowRejectDialog(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Timesheet Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Timesheet Details</DialogTitle>
          </DialogHeader>
          {selectedTimesheet && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Employee</div>
                  <div className="font-medium">{selectedTimesheet.employeeName}</div>
                  <div className="text-sm text-muted-foreground">{selectedTimesheet.employeeEmail}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Week</div>
                  <div className="font-medium">
                    {format(selectedTimesheet.weekStartDate, 'MMM d')} - {format(selectedTimesheet.weekEndDate, 'MMM d, yyyy')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total: {selectedTimesheet.totalHours.toFixed(1)}h
                  </div>
                </div>
              </div>

              {/* Entries Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTimesheet.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{format(entry.date, 'MMM d, yyyy')}</TableCell>
                        <TableCell className="font-medium">{entry.projectName}</TableCell>
                        <TableCell>{entry.taskName || '-'}</TableCell>
                        <TableCell>{entry.hours.toFixed(1)}h</TableCell>
                        <TableCell>
                          {entry.startTime && entry.endTime 
                            ? `${entry.startTime} - ${entry.endTime}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Status Info */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="font-medium">{getStatusBadge(selectedTimesheet.status)}</div>
                  </div>
                  {selectedTimesheet.submittedAt && (
                    <div>
                      <div className="text-sm text-muted-foreground">Submitted</div>
                      <div className="font-medium">{format(selectedTimesheet.submittedAt, 'MMM d, yyyy HH:mm')}</div>
                    </div>
                  )}
                  {selectedTimesheet.approvedAt && (
                    <div>
                      <div className="text-sm text-muted-foreground">Approved by</div>
                      <div className="font-medium">{selectedTimesheet.approvedByName}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(selectedTimesheet.approvedAt, 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                  )}
                  {selectedTimesheet.rejectedAt && (
                    <div>
                      <div className="text-sm text-muted-foreground">Rejected by</div>
                      <div className="font-medium">{selectedTimesheet.rejectedByName}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(selectedTimesheet.rejectedAt, 'MMM d, yyyy HH:mm')}
                      </div>
                      {selectedTimesheet.rejectionReason && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Reason: {selectedTimesheet.rejectionReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Timesheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Reason for Rejection *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this timesheet..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => selectedTimesheet && handleReject(selectedTimesheet)}
                variant="destructive"
              >
                Reject Timesheet
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
