
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';




async function checkPermission(req: NextRequest, requiredPermissions: string[]): Promise<boolean> {
    const userRole = await getSessionAndUserRole(req); 

    if (!userRole) {
        console.warn('Authentication failed: No user role found.');
        return false;
    }

    const rolePermissionsMap: { [key: string]: string[] } = {
        'Admin': ['teams:create', 'teams:view'],
    };

    const userPermissions = rolePermissionsMap[userRole] || [];
    const hasPermission = requiredPermissions.every(perm => userPermissions.includes(perm));

    if (!hasPermission) {
        console.warn(`Authorization failed for role '${userRole}'. Required: [${requiredPermissions.join(', ')}]`);
    }

    return hasPermission;
}

// POST /api/admin/teams - Create a new team
export async function POST(req: NextRequest) {
    if (!await checkPermission(req, ['teams:create'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, description, teamType } = body;

        if (!name || !teamType) {
            return NextResponse.json({ message: 'Name and teamType are required' }, { status: 400 });
        }

        const newTeam = {
            name,
            description: description || '',
            teamType,
            createdAt: Timestamp.now(),
        };

        const docRef = await db.collection('teams').add(newTeam);
        return NextResponse.json({ id: docRef.id, ...newTeam }, { status: 201 });
    } catch (error) {
        console.error("Error creating team:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// GET /api/admin/teams - List all teams
export async function GET(req: NextRequest) {
    if (!await checkPermission(req, ['teams:view'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const teamsSnapshot = await db.collection('teams').get();
        const teamsList = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(teamsList);
    } catch (error) {
        console.error("Error fetching teams:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
