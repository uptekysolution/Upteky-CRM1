
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// GET /api/internal/timesheets - List timesheets based on user role
export async function GET(req: NextRequest) {
    const userId = req.headers.get('X-User-Id');
    const userRole = req.headers.get('X-User-Role');

    if (!userId || !userRole) {
        return NextResponse.json({ message: 'User ID and Role are required headers' }, { status: 400 });
    }

    try {
        const snapshot = await db.collection('timesheets').get();
        let allEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (userRole === 'Admin' || userRole === 'HR') {
            return NextResponse.json(allEntries);
        }

        if (userRole === 'Team Lead') {
            // Find which teams the user is a lead of.
            const leadTeamsSnapshot = await db.collection('teamMembers')
                .where('userId', '==', userId)
                .get();
            const teamIds = leadTeamsSnapshot.docs.map(doc => doc.data().teamId);

            if (teamIds.length === 0) {
                // Not a lead of any team, just return own timesheets
                return NextResponse.json(allEntries.filter(entry => entry.userId === userId));
            }

            // Get all members of those teams.
            function chunkArray(array, size) {
                const result = [];
                for (let i = 0; i < array.length; i += size) {
                    result.push(array.slice(i, i + size));
                }
                return result;
            }
            let teamMembersDocs = [];
            for (const chunk of chunkArray(teamIds, 30)) {
                const snap = await db.collection('teamMembers')
                    .where('teamId', 'in', chunk)
                    .get();
                teamMembersDocs.push(...snap.docs);
            }
            const teamMemberUserIds = teamMembersDocs.map(doc => doc.data().userId);
            return NextResponse.json(allEntries.filter(entry => teamMemberUserIds.includes(entry.userId)));
        }

        // Default to Employee role: only see their own timesheets
        return NextResponse.json(allEntries.filter(entry => entry.userId === userId));
    } catch (error) {
        console.error("Error fetching timesheets:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/internal/timesheets - Create a new timesheet entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, user, userId, task, hours, status } = body;
    if (!date || !user || !userId || !task || hours === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    const newEntry = {
      date,
      user,
      userId,
      task,
      hours: Number(hours),
      status: status || 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const docRef = await db.collection('timesheets').add(newEntry);
    return NextResponse.json({ id: docRef.id, ...newEntry }, { status: 201 });
  } catch (error) {
    console.error('Error creating timesheet entry:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
