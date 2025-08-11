import { useState, useEffect, useCallback } from 'react';
import { LeaveRequest, LeaveRequestFormData, LeaveStatus } from '@/types/leave';
import { useToast } from '@/hooks/use-toast';

interface UseLeaveManagementProps {
  userRole: string;
  currentUserId?: string;
  currentUserName?: string;
}

interface LeaveBalance {
  monthly: { allocated: number; used: number; pending: number; remaining: number };
  emergency: { allocated: number; used: number; pending: number; remaining: number };
  miscellaneous: { allocated: number; used: number; pending: number; remaining: number };
}

export function useLeaveManagement({ 
  userRole, 
  currentUserId, 
  currentUserName 
}: UseLeaveManagementProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Fetch leave requests
  const fetchLeaveRequests = useCallback(async () => {
    try {
      console.log('Fetching leave requests...');
      setIsLoading(true);
      const params = new URLSearchParams();
      
      if (currentUserId) {
        params.append('userId', currentUserId);
      }
      
      // Add date filters for current month
      const now = new Date();
      params.append('month', (now.getMonth() + 1).toString());
      params.append('year', now.getFullYear().toString());

      console.log('Leave requests URL params:', params.toString());

      const response = await fetch(`/api/internal/leave-requests?${params}`, {
        headers: { 'X-User-Role': userRole }
      });

      console.log('Leave requests response status:', response.status);
      console.log('Leave requests response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Leave requests response not ok:', response.status, errorText);
        throw new Error(`Failed to fetch leave requests: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Leave requests data received:', data);
      setLeaveRequests(data.leaveRequests || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      // Don't show error toast for leave requests as empty data is expected
      setLeaveRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, userRole]);

  // Fetch leave balance
  const fetchLeaveBalance = useCallback(async () => {
    if (!currentUserId) {
      console.log('No currentUserId provided, skipping fetchLeaveBalance');
      return;
    }

    try {
      console.log('Fetching leave balance for user:', currentUserId);
      
      const params = new URLSearchParams({
        userId: currentUserId,
        month: (new Date().getMonth() + 1).toString(),
        year: new Date().getFullYear().toString()
      });

      console.log('Request URL params:', params.toString());

      const response = await fetch(`/api/internal/leave-balance?${params}`, {
        headers: { 'X-User-Role': userRole }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not ok:', response.status, errorText);
        throw new Error(`Failed to fetch leave balance: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Leave balance data received:', data);
      setLeaveBalance(data.leaveBalance);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      // Don't show error toast for leave balance as default values are expected
      // Set default leave balance
      setLeaveBalance({
        monthly: { allocated: 2, used: 0, pending: 0, remaining: 2 },
        emergency: { allocated: -1, used: 0, pending: 0, remaining: -1 },
        miscellaneous: { allocated: -1, used: 0, pending: 0, remaining: -1 }
      });
    }
  }, [currentUserId, userRole]);

  // Submit new leave request
  const submitLeaveRequest = useCallback(async (formData: LeaveRequestFormData) => {
    if (!currentUserId || !currentUserName) {
      throw new Error('User information required');
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/internal/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole
        },
        body: JSON.stringify({
          userId: currentUserId,
          userName: currentUserName,
          leaveType: formData.leaveType,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString(),
          reason: formData.reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit leave request');
      }

      const data = await response.json();
      
      // Add the new request to the list
      setLeaveRequests(prev => [data.leaveRequest, ...prev]);
      
      // Refresh leave balance
      await fetchLeaveBalance();

      return data.leaveRequest;
    } catch (error) {
      console.error('Error submitting leave request:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUserId, currentUserName, userRole, fetchLeaveBalance]);

  // Update leave request status (approve/reject)
  const updateLeaveRequestStatus = useCallback(async (
    requestId: string, 
    status: LeaveStatus, 
    rejectionReason?: string
  ) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/internal/leave-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole
        },
        body: JSON.stringify({
          status,
          rejectionReason,
          approvedBy: currentUserName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update leave request');
      }

      const data = await response.json();
      
      // Update the request in the list
      setLeaveRequests(prev => 
        prev.map(req => 
          req.id === requestId ? data.leaveRequest : req
        )
      );

      // Refresh leave balance if the user is updating their own request
      if (data.leaveRequest.userId === currentUserId) {
        await fetchLeaveBalance();
      }

      return data.leaveRequest;
    } catch (error) {
      console.error('Error updating leave request:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [userRole, currentUserName, currentUserId, fetchLeaveBalance]);

  // Delete leave request
  const deleteLeaveRequest = useCallback(async (requestId: string) => {
    try {
      const response = await fetch(`/api/internal/leave-requests/${requestId}`, {
        method: 'DELETE',
        headers: { 'X-User-Role': userRole }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete leave request');
      }

      // Remove the request from the list
      setLeaveRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Refresh leave balance
      await fetchLeaveBalance();

      toast({
        title: 'Leave Request Deleted',
        description: 'The leave request has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting leave request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete leave request.',
      });
      throw error;
    }
  }, [userRole, fetchLeaveBalance, toast]);

  // Get pending requests count for notifications
  const getPendingRequestsCount = useCallback(() => {
    return leaveRequests.filter(req => req.status === 'pending').length;
  }, [leaveRequests]);

  // Get monthly leave used
  const getMonthlyLeaveUsed = useCallback(() => {
    return leaveBalance?.monthly.used || 0;
  }, [leaveBalance]);

  // Initialize data
  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveBalance();
  }, [fetchLeaveRequests, fetchLeaveBalance]);

  return {
    // State
    leaveRequests,
    leaveBalance,
    isLoading,
    isSubmitting,
    isUpdating,
    
    // Actions
    submitLeaveRequest,
    updateLeaveRequestStatus,
    deleteLeaveRequest,
    fetchLeaveRequests,
    fetchLeaveBalance,
    
    // Computed values
    getPendingRequestsCount,
    getMonthlyLeaveUsed,
    
    // Filters
    pendingRequests: leaveRequests.filter(req => req.status === 'pending'),
    approvedRequests: leaveRequests.filter(req => req.status === 'approved'),
    rejectedRequests: leaveRequests.filter(req => req.status === 'rejected'),
  };
}

