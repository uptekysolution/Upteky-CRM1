import { LeaveRequest, LeavePaymentType } from '@/types/leave';

export interface LeaveValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate leave request data
 */
export function validateLeaveRequest(request: Partial<LeaveRequest>): LeaveValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!request.userId) errors.push('User ID is required');
  if (!request.userName) errors.push('User name is required');
  if (!request.leaveType) errors.push('Leave type is required');
  if (!request.startDate) errors.push('Start date is required');
  if (!request.endDate) errors.push('End date is required');
  if (!request.reason) errors.push('Reason is required');

  // Date validation
  if (request.startDate && request.endDate) {
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      errors.push('Start date cannot be in the past');
    }

    if (end < start) {
      errors.push('End date must be after start date');
    }
  }

  // Reason length validation
  if (request.reason && request.reason.trim().length < 10) {
    errors.push('Reason must be at least 10 characters long');
  }

  // Leave type validation
  if (request.leaveType && !['monthly', 'emergency', 'miscellaneous'].includes(request.leaveType)) {
    errors.push('Invalid leave type');
  }

  // Status validation
  if (request.status && !['pending', 'approved', 'rejected'].includes(request.status)) {
    errors.push('Invalid status');
  }

  // Payment type validation for approved requests
  if (request.status === 'approved' && request.paymentType) {
    if (!['paid', 'unpaid'].includes(request.paymentType)) {
      errors.push('Payment type must be either "paid" or "unpaid"');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate leave approval data
 */
export function validateLeaveApproval(
  status: string,
  rejectionReason?: string,
  paymentType?: string
): LeaveValidationResult {
  const errors: string[] = [];

  // Status validation
  if (!['approved', 'rejected'].includes(status)) {
    errors.push('Status must be either "approved" or "rejected"');
  }

  // Rejection reason validation
  if (status === 'rejected' && (!rejectionReason || rejectionReason.trim().length === 0)) {
    errors.push('Rejection reason is required for rejected requests');
  }

  // Payment type validation for approved requests
  if (status === 'approved') {
    if (!paymentType) {
      errors.push('Payment type is required for approved requests');
    } else if (!['paid', 'unpaid'].includes(paymentType)) {
      errors.push('Payment type must be either "paid" or "unpaid"');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if user can approve a leave request based on role hierarchy
 */
export function canApproveLeave(userRole: string, targetUserRole: string): boolean {
  switch (userRole) {
    case 'Admin':
      return true;
    case 'HR':
      return targetUserRole !== 'Admin' && targetUserRole !== 'Sub-Admin';
    case 'Sub-Admin':
      return targetUserRole === 'Employee' || targetUserRole === 'Team Lead';
    default:
      return false;
  }
}

/**
 * Check if user can delete a leave request
 */
export function canDeleteLeave(
  userRole: string,
  requestUserId: string,
  currentUserId: string,
  requestStatus: string
): boolean {
  // Admins and HR can delete any pending request
  if (userRole === 'Admin' || userRole === 'HR') {
    return requestStatus === 'pending';
  }

  // Users can only delete their own pending requests
  return requestUserId === currentUserId && requestStatus === 'pending';
}

/**
 * Calculate the number of days between two dates
 */
export function calculateLeaveDays(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return daysDiff + 1; // Include both start and end dates
}

/**
 * Check if leave dates overlap with existing approved leave
 */
export function checkLeaveOverlap(
  userId: string,
  startDate: Date,
  endDate: Date,
  excludeRequestId?: string
): boolean {
  // This would typically query the database
  // For now, return false (no overlap)
  return false;
}
