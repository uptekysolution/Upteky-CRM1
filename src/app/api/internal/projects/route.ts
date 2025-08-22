import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';

async function checkPermission(req: NextRequest): Promise<{ hasPermission: boolean; userRole: string | null; userId: string | null }> {
    const userRole = await getSessionAndUserRole(req); 
    const userId = req.headers.get('X-User-ID');

    if (!userRole) {
        console.warn('Authentication failed: No user role found.');
        return { hasPermission: false, userRole: null, userId: null };
    }

    // Allow access for Admin, Client, and Employee roles
    const allowedRoles = ['Admin', 'Client', 'Employee', 'Team Lead', 'Sub-Admin'];
    const hasPermission = allowedRoles.includes(userRole);

    return { hasPermission, userRole, userId };
}

// GET /api/internal/projects - Get projects based on user role
export async function GET(req: NextRequest) {
    const { hasPermission, userRole, userId } = await checkPermission(req);
    
    if (!hasPermission) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('clientId');
        const status = searchParams.get('status');

        let query: any = db.collection('projects');
        
        // Role-based filtering
        if (userRole === 'Client' && clientId) {
            // Clients can only see their own projects
            query = query.where('clientId', '==', clientId);
        } else if (userRole === 'Employee' && userId) {
            // Employees can see projects assigned to their teams
            // First get the user's team assignments
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const teamId = userData?.teamId;
                
                if (teamId) {
                    // Get projects assigned to this team
                    const teamAssignments = await db.collection('projectAssignments')
                        .where('teamId', '==', teamId)
                        .get();
                    
                    const projectIds = teamAssignments.docs.map(doc => doc.data().projectId);
                    
                    if (projectIds.length > 0) {
                        query = query.where('__name__', 'in', projectIds);
                    } else {
                        // No projects assigned to this team
                        return NextResponse.json([]);
                    }
                } else {
                    // User not assigned to any team
                    return NextResponse.json([]);
                }
            } else {
                // User document not found
                return NextResponse.json([]);
            }
        } else if (userRole === 'Admin' || userRole === 'Sub-Admin' || userRole === 'Team Lead') {
            // Admins can see all projects, but can filter by client
            if (clientId) {
                query = query.where('clientId', '==', clientId);
            }
        }
        
        if (status) {
            query = query.where('status', '==', status);
        }

        const projectsSnapshot = await query.get();
        const projectsList = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(projectsList);
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
