export interface Project {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimesheetEntry {
  id: string;
  date: Date;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskName?: string;
  hours: number;
  notes?: string;
  startTime?: string;
  endTime?: string;
}

export enum TimesheetStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface Timesheet {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  weekStartDate: Date;
  weekEndDate: Date;
  entries: TimesheetEntry[];
  totalHours: number;
  status: TimesheetStatus;
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  approvedByName?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimesheetFilters {
  employeeId?: string;
  projectId?: string;
  status?: TimesheetStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee' | 'manager';
  department?: string;
  position?: string;
  avatar?: string;
  isActive: boolean;
}

export interface TimesheetStats {
  totalHours: number;
  totalEntries: number;
  approvedHours: number;
  pendingHours: number;
  rejectedHours: number;
  projectBreakdown: {
    projectId: string;
    projectName: string;
    hours: number;
  }[];
  employeeBreakdown: {
    employeeId: string;
    employeeName: string;
    hours: number;
  }[];
}
