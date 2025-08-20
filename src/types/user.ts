export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  department?: string;
  position?: string;
  hireDate?: Date;
  location?: string;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserRole = 
  | 'Admin'
  | 'Sub-Admin'
  | 'HR'
  | 'Team Lead'
  | 'Employee'
  | 'Business Development'
  | 'Client';

export type UserStatus = 'Active' | 'Inactive' | 'Suspended';

export interface Team {
  id: string;
  name: string;
  description?: string;
  teamType: TeamType;
  createdAt: Date;
  updatedAt?: Date;
}

export type TeamType = 'Department' | 'Project' | 'Task Force' | 'Team';

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  reportsToMemberId?: string | null;
  joinedAt: Date;
}

export type TeamMemberRole = 'member' | 'lead';

export interface UserPermission {
  id: string;
  userId: string;
  permissionName: string;
  granted: boolean;
  grantedAt?: Date;
  grantedBy?: string;
}

export interface RolePermission {
  role: UserRole;
  permissions: string[];
}

export interface UserProfile {
  userId: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  certifications?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  details?: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserSearchFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  team?: string;
  location?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  position?: string;
  phone?: string;
  location?: string;
  hireDate?: Date;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  position?: string;
  phone?: string;
  location?: string;
  hireDate?: Date;
  bio?: string;
}

export interface TeamAssignmentRequest {
  userId: string;
  teamId: string;
  role: TeamMemberRole;
  reportsToMemberId?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  usersByRole: Record<UserRole, number>;
  usersByDepartment: Record<string, number>;
  recentRegistrations: number;
  averageTeamSize: number;
}
