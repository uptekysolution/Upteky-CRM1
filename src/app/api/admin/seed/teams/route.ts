
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { initialTeams, initialTeamMembers, teamToolAccess } from '@/app/dashboard/_data/seed-data';
import { getSessionAndUserRole } from '@/lib/auth';

async function checkPermission(req: NextRequest, requiredPermissions: string[]): Promise<boolean> {
    const userRole = await getSessionAndUserRole(req); 
    if (!userRole || userRole !== 'Admin') { // Seeding should be strictly Admin
        console.warn(`Authorization failed for role '${userRole}'. Required: Admin`);
        return false;
    }
    return true;
}

export async function POST(req: NextRequest) {
    if (!await checkPermission(req, ['system:seed'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const batch = db.batch();

        // Seed Teams
        initialTeams.forEach(team => {
            const teamRef = db.collection("teams").doc(team.id);
            batch.set(teamRef, team);
        });

        // Seed Team Members
        initialTeamMembers.forEach(member => {
            const memberRef = db.collection("teamMembers").doc();
            batch.set(memberRef, member);
        });
        
        // Seed Team Tool Access
        teamToolAccess.forEach(access => {
            const accessRef = db.collection("teamToolAccess").doc();
            batch.set(accessRef, access);
        });

        await batch.commit();

        return NextResponse.json({ message: 'Teams data seeded successfully' }, { status: 200 });
    } catch (error) {
        console.error("Error seeding teams:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
