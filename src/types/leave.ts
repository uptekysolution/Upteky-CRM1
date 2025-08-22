// Leave request types
export type LeaveType = 'monthly' | 'emergency' | 'miscellaneous';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type LeavePaymentType = 'paid' | 'unpaid';

// Form data interface
export interface LeaveRequestFormData {
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
}

// Leave request interface
export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  role: string;
  leaveType: LeaveType;
  startDate: any; // Firestore Timestamp or string
  endDate: any; // Firestore Timestamp or string
  reason: string;
  status: LeaveStatus;
  requestedAt: any; // Firestore Timestamp or string
  approvedBy?: string | null;
  approvedAt?: any; // Firestore Timestamp or string
  rejectionReason?: string;
  paymentType?: LeavePaymentType; // New field for paid/unpaid
}

// Leave balance interface
export interface LeaveBalance {
  monthly: {
    allocated: number;
    used: number;
    pending: number;
    remaining: number;
  };
  emergency: {
    allocated: number;
    used: number;
    pending: number;
    remaining: number;
  };
  miscellaneous: {
    allocated: number;
    used: number;
    pending: number;
    remaining: number;
  };
}

// Leave approval request interface
export interface LeaveApprovalRequest {
  status: LeaveStatus;
  rejectionReason?: string;
  approvedBy?: string;
  paymentType?: LeavePaymentType; // New field for paid/unpaid
}
