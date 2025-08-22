import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';

async function checkPermission(req: NextRequest): Promise<boolean> {
    const role = await getSessionAndUserRole(req);
    return Boolean(role); // any authenticated role can read basic user directory; UI guards apply
}

// GET /api/internal/users?role=Employee
export async function GET(req: NextRequest) {
    if (!await checkPermission(req)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    try {
        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role');
        const limitParam = Number(searchParams.get('limit') || 100);

        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('users');
        if (role) {
            query = query.where('role', '==', role);
        }
        const snapshot = await query.limit(limitParam).get();
        const users = snapshot.docs.map(d => {
            const data = d.data() as any;
            return {
                id: d.id,
                name: data.name || data.fullName || '',
                email: data.email || '',
                role: data.role || '',
                teamId: data.teamId || null,
            };
        });
        return NextResponse.json(users);
    } catch (e) {
        console.error('Error listing users:', e);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


