
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getSessionAndUserRole } from '@/lib/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';

// GET /api/overtime/pending
export async function GET(req: NextRequest) {
    const userRole = await getSessionAndUserRole(req);
    const userId = req.headers.get('X-User-Id');

    // Permissions: Admin and HR can see all. Team Leads can only see their team's.
    if (!userRole || !['Admin', 'HR', 'Team Lead'].includes(userRole)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        let q = query(
            collection(db, 'attendanceRecords'),
            where('overtimeApprovalStatus', '==', 'Pending'),
            where('potentialOvertimeHours', '>', 0)
        );

        const recordsSnapshot = await getDocs(q);
        let pendingRecords = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // If user is a Team Lead, filter records to only their team members
        if (userRole === 'Team Lead') {
            // This is a simplified team lookup. A real app would have a more robust way
            // to find a lead's direct reports.
            const leadTeamsSnapshot = await getDocs(
                query(collection(db, 'teamMembers'), where('userId', '==', userId))
            );
            const teamIds = leadTeamsSnapshot.docs.map(doc => doc.data().teamId);

            if (teamIds.length > 0) {
                 const teamMembersSnapshot = await getDocs(
                    query(collection(db, 'teamMembers'), where('teamId', 'in', teamIds))
                );
                const teamMemberUserIds = teamMembersSnapshot.docs.map(doc => doc.data().userId);
                
                pendingRecords = pendingRecords.filter(record => teamMemberUserIds.includes(record.userId));
            } else {
                // If the lead is not part of any team, they can't see any requests.
                pendingRecords = [];
            }
        }
        
        return NextResponse.json(pendingRecords);

    } catch (error) {
        console.error("Error fetching pending overtime:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
