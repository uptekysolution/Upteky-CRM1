export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  createdBy: string;
  createdById?: string;
  createdByRole?: string;
  assignedById?: string;
  assignedByRole?: string;
  createdAt: Date;
  updatedAt: Date;
  progress: number;
  tags?: string[];
  attachments?: string[];
  estimatedHours?: number;
  actualHours?: number;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface Meeting {
  id: string;
  title: string;
  agenda: string;
  date: Date;
  startTime: string;
  endTime: string;
  participants: MeetingParticipant[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  location?: string;
  meetingLink?: string;
  status: MeetingStatus;
  notes?: string;
  attachments?: string[];
}

export interface MeetingParticipant {
  userId: string;
  userName: string;
  userEmail: string;
  attended: boolean;
  response: 'accepted' | 'declined' | 'pending';
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  IN_REVIEW = 'In Review',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export enum MeetingStatus {
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface TaskFilters {
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface MeetingFilters {
  participantId?: string;
  status?: MeetingStatus;
  date?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'task' | 'meeting';
  data: Task | Meeting;
  color?: string;
}
