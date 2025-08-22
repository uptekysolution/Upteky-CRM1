
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';

async function checkPermission(req: NextRequest): Promise<boolean> {
    const userRole = await getSessionAndUserRole(req); 
    return userRole === 'Admin';
}

// POST /api/admin/seed/projects - Seed initial project data
export async function POST(req: NextRequest) {
    if (!await checkPermission(req)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        // First, get some clients to assign to projects
        const clientsSnapshot = await db.collection('clients').limit(3).get();
        const clientIds = clientsSnapshot.docs.map(doc => doc.id);

        // Get some teams to assign to projects
        const teamsSnapshot = await db.collection('teams').limit(2).get();
        const teamIds = teamsSnapshot.docs.map(doc => doc.id);

        const seedProjects = [
            {
                name: 'Website Redesign',
                description: 'Complete redesign of company website with modern UI/UX',
                status: 'Active',
                clientId: clientIds[0] || null,
                progress: 65,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            },
            {
                name: 'Mobile App Development',
                description: 'iOS and Android app development for client platform',
                status: 'Planning',
                clientId: clientIds[1] || null,
                progress: 15,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            },
            {
                name: 'E-commerce Platform',
                description: 'Full-stack e-commerce solution with payment integration',
                status: 'Active',
                clientId: clientIds[2] || null,
                progress: 80,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            },
            {
                name: 'CRM System Implementation',
                description: 'Custom CRM system development and deployment',
                status: 'On Hold',
                clientId: clientIds[0] || null,
                progress: 30,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            },
            {
                name: 'Data Migration Project',
                description: 'Legacy system data migration to new platform',
                status: 'Completed',
                clientId: clientIds[1] || null,
                progress: 100,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            }
        ];

        const batch = db.batch();
        const createdProjects = [];

        for (const projectData of seedProjects) {
            const projectRef = db.collection('projects').doc();
            batch.set(projectRef, projectData);
            createdProjects.push({ id: projectRef.id, ...projectData });
        }

        await batch.commit();

        // Create some project-team assignments
        if (teamIds.length > 0 && createdProjects.length > 0) {
            const assignmentBatch = db.batch();
            
            // Assign first team to first 2 projects
            for (let i = 0; i < Math.min(2, createdProjects.length); i++) {
                const assignmentRef = db.collection('projectAssignments').doc();
                assignmentBatch.set(assignmentRef, {
                    projectId: createdProjects[i].id,
                    teamId: teamIds[0],
                    assignedAt: Timestamp.now()
                });
            }

            // Assign second team to next 2 projects
            if (teamIds.length > 1) {
                for (let i = 2; i < Math.min(4, createdProjects.length); i++) {
                    const assignmentRef = db.collection('projectAssignments').doc();
                    assignmentBatch.set(assignmentRef, {
                        projectId: createdProjects[i].id,
                        teamId: teamIds[1],
                        assignedAt: Timestamp.now()
                    });
                }
            }

            await assignmentBatch.commit();
        }

        return NextResponse.json({ 
            message: 'Projects seeded successfully', 
            count: createdProjects.length,
            projects: createdProjects 
        });
    } catch (error) {
        console.error("Error seeding projects:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
