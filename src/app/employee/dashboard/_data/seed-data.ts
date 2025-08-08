
import { Timestamp } from 'firebase/firestore';

export const initialUsers = [
    { id: "user-admin", name: "Admin User", email: "admin@upteky.com", role: "Admin", status: "Active", firstName: "Admin", lastName: "User" },
    { id: "user-tl-john", name: "John Doe", email: "john.doe@upteky.com", role: "Team Lead", status: "Active", firstName: "John", lastName: "Doe" },
    { id: "user-emp-jane", name: "Jane Smith", email: "jane.smith@upteky.com", role: "Employee", status: "Active", firstName: "Jane", lastName: "Smith" },
    { id: "user-hr-peter", name: "Peter Jones", email: "peter.jones@upteky.com", role: "HR", status: "Inactive", firstName: "Peter", lastName: "Jones" },
    { id: "user-subadmin", name: "Sub Admin", email: "subadmin@upteky.com", role: "Sub-Admin", status: "Active", firstName: "Sub", lastName: "Admin" },
    { id: "user-hr-alisha", name: "Alisha Anand", email: "alisha.anand@upteky.com", role: "HR", status: "Active", firstName: "Alisha", lastName: "Anand" },
    { id: "user-bd-alex", name: "Alex Ray", email: "alex.ray@upteky.com", role: "Business Development", status: "Active", firstName: "Alex", lastName: "Ray" },
    { id: "user-bd-sam", name: "Sam Wilson", email: "sam.wilson@upteky.com", role: "Business Development", status: "Active", firstName: "Sam", lastName: "Wilson" },
];

export const allPermissions = {
  'dashboard:view': { id: 1, name: 'dashboard:view', description: 'View main dashboard' },
  'attendance:view:own': { id: 2, name: 'attendance:view:own', description: 'View own attendance' },
  'attendance:view:team': { id: 3, name: 'attendance:view:team', description: 'View team attendance' },
  'attendance:view:all': { id: 4, name: 'attendance:view:all', description: 'View all attendance' },
  'payroll:view:own': { id: 5, name: 'payroll:view:own', description: 'View own payroll' },
  'payroll:view:all': { id: 6, name: 'payroll:view:all', description: 'View all payroll (except Admins)' },
  'clients:view': { id: 7, name: 'clients:view', description: 'View all clients' },
  'tickets:view': { id: 8, name: 'tickets:view', description: 'View all support tickets' },
  'lead-generation:view': { id: 10, name: 'lead-generation:view', description: 'Access lead generation tools' },
  'tasks:view': { id: 11, name: 'tasks:view', description: 'View tasks' },
  'timesheet:view': { id: 12, name: 'timesheet:view', description: 'View timesheets' },
  'users:manage': { id: 13, name: 'users:manage', description: 'Manage users (create, edit, delete)' },
  'permissions:manage': { id: 14, name: 'permissions:manage', description: 'Manage roles and permissions' },
  'audit-log:view': { id: 15, name: 'audit-log:view', description: 'View audit logs' },
  'teams:manage': { id: 16, name: 'teams:manage', description: 'Manage teams and projects' },
} as const;
type PermissionName = keyof typeof allPermissions;


export const initialRolePermissions: Record<string, PermissionName[]> = {
  Admin: Object.keys(allPermissions) as PermissionName[],
  'Sub-Admin': ['dashboard:view', 'attendance:view:all', 'payroll:view:all', 'clients:view', 'tickets:view', 'lead-generation:view', 'tasks:view', 'timesheet:view', 'users:manage', 'permissions:manage'],
  HR: ['dashboard:view', 'attendance:view:all', 'payroll:view:all', 'tasks:view', 'timesheet:view', 'users:manage', 'audit-log:view', 'clients:view', 'tickets:view'],
  'Team Lead': ['dashboard:view', 'attendance:view:team', 'payroll:view:own', 'clients:view', 'tickets:view', 'lead-generation:view', 'tasks:view', 'timesheet:view'],
  Employee: ['dashboard:view', 'attendance:view:own', 'payroll:view:own', 'tasks:view', 'timesheet:view'],
  'Business Development': ['dashboard:view', 'clients:view', 'lead-generation:view'],
};


export const initialTeams = [
    { id: 'team-eng', name: 'Engineering', description: 'The core engineering department responsible for product development.', teamType: 'Department', createdAt: Timestamp.now() },
    { id: 'team-phoenix', name: 'Project Phoenix', description: 'A cross-functional team assembled to deliver the Phoenix project.', teamType: 'Project', createdAt: Timestamp.now() },
    { id: 'team-security', name: 'Security Task Force', description: 'A temporary group to address the recent security audit findings.', teamType: 'Task Force', createdAt: Timestamp.now() }
];

export const initialProjects = [
    { id: 'proj-phoenix', name: 'Project Phoenix', description: 'A major initiative to rebuild the main application.', status: 'Active', createdAt: Timestamp.now() },
    { id: 'proj-q3-marketing', name: 'Q3 Marketing Campaign', description: 'The marketing campaign for the third quarter.', status: 'Planning', createdAt: Timestamp.now() },
];

export const initialTeamMembers = [
    // Engineering Team
    { teamId: 'team-eng', userId: 'user-tl-john', teamRole: 'Engineering Lead', reportsToMemberId: null },
    { teamId: 'team-eng', userId: 'user-emp-jane', teamRole: 'Frontend Developer', reportsToMemberId: 'user-tl-john' },
    
    // Project Phoenix Team (cross-functional)
    { teamId: 'team-phoenix', userId: 'user-tl-john', teamRole: 'Technical Lead', reportsToMemberId: null },
    { teamId: 'team-phoenix', userId: 'user-bd-alex', teamRole: 'Business Analyst', reportsToMemberId: 'user-tl-john' },
    
    // Security Task Force
    { teamId: 'team-security', userId: 'user-admin', teamRole: 'Task Force Lead', reportsToMemberId: null },
    { teamId: 'team-security', userId: 'user-tl-john', teamRole: 'Security Consultant', reportsToMemberId: 'user-admin' },
];

export const projectAssignments = [
    { projectId: 'proj-phoenix', teamId: 'team-phoenix' },
    { projectId: 'proj-phoenix', teamId: 'team-eng' },
];

export const teamToolAccess = [
    { teamId: 'team-eng', toolId: 'Tasks' },
    { teamId: 'team-eng', toolId: 'Timesheet' },
    { teamId: 'team-phoenix', toolId: 'Tasks' },
    { teamId: 'team-security', toolId: 'Audit Log' },
];

export const initialTasks = [
    { id: 'task-1', title: 'Develop new homepage design', description: 'Create a new design for the company homepage.', assignee: 'user-emp-jane', dueDate: '2024-08-15', status: 'In Progress', progress: 60, priority: 'High', linkedTicketId: null },
    { id: 'task-2', title: 'Fix login page bug', description: 'Users are reporting a bug on the login page.', assignee: 'user-tl-john', dueDate: '2024-08-10', status: 'In Review', progress: 100, priority: 'High', linkedTicketId: null },
];

export const initialTools = [
    { id: 'Dashboard', name: 'Dashboard' },
    { id: 'Attendance', name: 'Attendance' },
    { id: 'Payroll', name: 'Payroll' },
    { id: 'CRM', name: 'CRM' },
    { id: 'Projects', name: 'Projects' },
    { id: 'Lead Generation', name: 'Lead Generation' },
    { id: 'Tasks', name: 'Tasks' },
    { id: 'Timesheet', name: 'Timesheet' },
    { id: 'User Management', name: 'User Management' },
    { id: 'Permissions', name: 'Permissions' },
    { id: 'Audit Log', name: 'Audit Log' },
];

export const initialClients = [
    {
        id: 'client-acme-corp',
        name: 'Acme Corporation',
        status: 'Active',
        address: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zip: '12345'
        },
        primaryContactId: 'contact-john-doe',
        createdAt: Timestamp.now(),
    },
    {
        id: 'client-globex-inc',
        name: 'Globex Inc.',
        status: 'Prospect',
        address: {
            street: '456 Market St',
            city: 'Someville',
            state: 'NY',
            zip: '54321'
        },
        primaryContactId: 'contact-jane-smith',
        createdAt: Timestamp.now(),
    }
];

export const initialContacts = [
    {
        id: 'contact-john-doe',
        clientId: 'client-acme-corp',
        name: 'John Doe',
        email: 'john.doe@acmecorp.com',
        phone: '111-222-3333',
        roleInCompany: 'Project Manager',
        hasPortalAccess: true,
        portalUserId: null
    },
    {
        id: 'contact-jane-smith',
        clientId: 'client-globex-inc',
        name: 'Jane Smith',
        email: 'jane.smith@globexinc.com',
        phone: '444-555-6666',
        roleInCompany: 'CEO',
        hasPortalAccess: false,
        portalUserId: null
    }
];

export const initialTickets = [
    {
        id: 'ticket-1',
        clientId: 'client-acme-corp',
        contactId: 'contact-john-doe',
        ticketNumber: 1001,
        title: 'Cannot access new feature',
        description: 'We are trying to use the new reporting feature but it seems to be disabled for our account.',
        category: 'Technical Support',
        priority: 'High',
        status: 'Open',
        assignedToTeamId: null,
        assignedToUserId: 'user-tl-john',
        createdAt: Timestamp.now(),
        resolvedAt: null,
        linkedTaskId: null,
    },
    {
        id: 'ticket-2',
        clientId: 'client-globex-inc',
        contactId: 'contact-jane-smith',
        ticketNumber: 1002,
        title: 'Billing question',
        description: 'I have a question about our last invoice.',
        category: 'Billing Question',
        priority: 'Medium',
        status: 'In Progress',
        assignedToTeamId: null,
        assignedToUserId: 'user-hr-alisha',
        createdAt: Timestamp.now(),
        resolvedAt: null,
        linkedTaskId: null,
    }
];

export const initialTicketReplies = [
    {
        id: 'reply-1',
        ticketId: 'ticket-1',
        authorId: 'user-tl-john',
        authorName: 'John Doe (Upteky)',
        message: 'Thanks for reaching out. I am looking into this now.',
        isInternalNote: false,
        createdAt: Timestamp.now()
    },
     {
        id: 'reply-2',
        ticketId: 'ticket-1',
        authorId: 'user-tl-john',
        authorName: 'John Doe (Upteky)',
        message: 'It seems the feature flag was not enabled for their account. I have enabled it now.',
        isInternalNote: true,
        createdAt: Timestamp.now()
    }
];

export const initialOfficeLocations = [
    {
        id: 'office-hq-mumbai',
        name: 'Upteky HQ (Mumbai)',
        latitude: 19.0760,
        longitude: 72.8777,
        radiusMeters: 100,
        whitelistedIps: ['203.0.113.1', '203.0.113.2', '203.0.113.5'],
        isActive: true,
    },
    {
        id: 'office-satellite-delhi',
        name: 'Upteky Satellite (Delhi)',
        latitude: 28.6139,
        longitude: 77.2090,
        radiusMeters: 150,
        whitelistedIps: [],
        isActive: true,
    }
];
