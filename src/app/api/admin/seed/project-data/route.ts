import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';

async function checkPermission(req: NextRequest, requiredPermissions: string[]): Promise<boolean> {
    const userRole = await getSessionAndUserRole(req); 
    if (!userRole || userRole !== 'Admin') {
        console.warn(`Authorization failed for role '${userRole}'. Required: Admin`);
        return false;
    }
    return true;
}

export async function POST(req: NextRequest) {
    if (!await checkPermission(req, ['projects:edit'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const batch = db.batch();

        // Sample project tasks
        const sampleTasks = [
            {
                projectId: 'project-1',
                title: 'Design homepage',
                description: 'Create wireframes and mockups for the main homepage',
                status: 'in-progress',
                assignee: 'John Doe',
                dueDate: '2024-08-15',
                priority: 'high',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                projectId: 'project-1',
                title: 'Setup database',
                description: 'Configure database schema and connections',
                status: 'completed',
                assignee: 'Jane Smith',
                dueDate: '2024-08-10',
                priority: 'medium',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                projectId: 'project-1',
                title: 'Write API documentation',
                description: 'Document all API endpoints with examples',
                status: 'pending',
                assignee: 'Mike Johnson',
                dueDate: '2024-08-20',
                priority: 'low',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                projectId: 'project-2',
                title: 'User authentication',
                description: 'Implement user login and registration system',
                status: 'in-progress',
                assignee: 'Sarah Wilson',
                dueDate: '2024-08-18',
                priority: 'high',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        // Sample project files
        const sampleFiles = [
            {
                projectId: 'project-1',
                name: 'project-specs.pdf',
                type: 'PDF',
                size: '2.3 MB',
                uploadedBy: 'John Doe',
                uploadedAt: new Date('2024-08-01'),
                downloadUrl: null,
            },
            {
                projectId: 'project-1',
                name: 'wireframes.fig',
                type: 'FIG',
                size: '1.8 MB',
                uploadedBy: 'Jane Smith',
                uploadedAt: new Date('2024-08-02'),
                downloadUrl: null,
            },
            {
                projectId: 'project-1',
                name: 'api-docs.md',
                type: 'MD',
                size: '45 KB',
                uploadedBy: 'Mike Johnson',
                uploadedAt: new Date('2024-08-03'),
                downloadUrl: null,
            },
            {
                projectId: 'project-2',
                name: 'database-schema.sql',
                type: 'SQL',
                size: '12 KB',
                uploadedBy: 'Sarah Wilson',
                uploadedAt: new Date('2024-08-04'),
                downloadUrl: null,
            },
        ];

        // Sample project activity
        const sampleActivity = [
            {
                projectId: 'project-1',
                action: 'Project created',
                user: 'Admin User',
                details: 'Project "Mobile App Development" was created',
                timestamp: new Date('2024-08-01T10:30:00'),
            },
            {
                projectId: 'project-1',
                action: 'Status changed',
                user: 'John Doe',
                details: 'Project status changed from "Planning" to "Active"',
                timestamp: new Date('2024-08-02T14:15:00'),
            },
            {
                projectId: 'project-1',
                action: 'Team assigned',
                user: 'Admin User',
                details: 'Engineering team assigned to project',
                timestamp: new Date('2024-08-03T09:45:00'),
            },
            {
                projectId: 'project-1',
                action: 'Task completed',
                user: 'Jane Smith',
                details: 'Task "Setup database" marked as completed',
                timestamp: new Date('2024-08-04T11:20:00'),
            },
            {
                projectId: 'project-2',
                action: 'Project created',
                user: 'Admin User',
                details: 'Project "E-commerce Platform" was created',
                timestamp: new Date('2024-08-05T08:00:00'),
            },
        ];

        // Sample project assignments
        const sampleAssignments = [
            {
                projectId: 'project-1',
                teamId: 'team-eng',
            },
            {
                projectId: 'project-1',
                teamId: 'team-design',
            },
            {
                projectId: 'project-2',
                teamId: 'team-eng',
            },
        ];

        // Add tasks to batch
        sampleTasks.forEach(task => {
            const taskRef = db.collection('projectTasks').doc();
            batch.set(taskRef, task);
        });

        // Add files to batch
        sampleFiles.forEach(file => {
            const fileRef = db.collection('projectFiles').doc();
            batch.set(fileRef, file);
        });

        // Add activity to batch
        sampleActivity.forEach(activity => {
            const activityRef = db.collection('projectActivity').doc();
            batch.set(activityRef, activity);
        });

        // Add project assignments to batch
        sampleAssignments.forEach(assignment => {
            const assignmentRef = db.collection('projectAssignments').doc();
            batch.set(assignmentRef, assignment);
        });

        await batch.commit();

        return NextResponse.json({ 
            message: 'Project data seeded successfully',
            tasksCreated: sampleTasks.length,
            filesCreated: sampleFiles.length,
            activitiesCreated: sampleActivity.length,
            assignmentsCreated: sampleAssignments.length
        }, { status: 200 });
    } catch (error) {
        console.error("Error seeding project data:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
} 