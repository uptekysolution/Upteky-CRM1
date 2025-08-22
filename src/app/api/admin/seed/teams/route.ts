
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';

async function checkPermission(req: NextRequest): Promise<boolean> {
    const userRole = await getSessionAndUserRole(req); 
    return userRole === 'Admin';
}

// POST /api/admin/seed/teams - Seed initial team data
export async function POST(req: NextRequest) {
    if (!await checkPermission(req)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const seedTeams = [
            {
                name: 'Development Team',
                description: 'Core development team responsible for software development',
                teamType: 'Department',
                createdAt: Timestamp.now(),
            },
            {
                name: 'Design Team',
                description: 'UI/UX design team for user interface and experience',
                teamType: 'Department',
                createdAt: Timestamp.now(),
            },
            {
                name: 'QA Team',
                description: 'Quality assurance team for testing and validation',
                teamType: 'Department',
                createdAt: Timestamp.now(),
            },
            {
                name: 'Project Alpha Team',
                description: 'Dedicated team for Project Alpha implementation',
                teamType: 'Project',
                createdAt: Timestamp.now(),
            },
            {
                name: 'Support Team',
                description: 'Customer support and maintenance team',
                teamType: 'Department',
                createdAt: Timestamp.now(),
            }
        ];

        const batch = db.batch();
        const createdTeams = [];

        for (const teamData of seedTeams) {
            const teamRef = db.collection('teams').doc();
            batch.set(teamRef, teamData);
            createdTeams.push({ id: teamRef.id, ...teamData });
        }

        await batch.commit();

        return NextResponse.json({ 
            message: 'Teams seeded successfully', 
            count: createdTeams.length,
            teams: createdTeams 
        });
    } catch (error) {
        console.error("Error seeding teams:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
