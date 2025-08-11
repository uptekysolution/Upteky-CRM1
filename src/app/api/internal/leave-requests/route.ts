import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';
import { Timestamp } from 'firebase-admin/firestore';
import { LeaveRequest, LeaveStatus } from '@/types/leave';

function toIso(ts: any): string | null {
  if (!ts) return null;
  if (typeof ts === 'string') return ts;
  try {
    if (typeof ts.toDate === 'function') {
      return ts.toDate().toISOString();
    }
  } catch {}
  return null;
}

function serializeLeaveRequest(id: string, data: any) {
  return {
    id,
    userId: data.userId ?? null,
    userName: data.userName ?? 'Unknown',
    role: data.role ?? 'Employee',
    leaveType: data.leaveType ?? 'monthly',
    startDate: toIso(data.startDate),
    endDate: toIso(data.endDate),
    reason: data.reason ?? '',
    status: data.status ?? 'pending',
    requestedAt: toIso(data.requestedAt),
    approvedBy: data.approvedBy ?? null,
    approvedAt: toIso(data.approvedAt),
  };
}

// GET - Fetch leave requests based on user role and permissions
export async function GET(req: NextRequest) {
  try {
    console.log('Leave requests API called');
    
    const userRole = await getSessionAndUserRole(req);
    console.log('User role:', userRole);
    
    if (!userRole) {
      console.log('No user role found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') as LeaveStatus | null;
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    console.log('Request params:', { userId, status, month, year });

    // If no userId is provided, return empty array for now
    if (!userId && (userRole === 'Employee' || userRole === 'Team Lead')) {
      console.log('No userId provided for restricted role, returning empty array');
      return NextResponse.json({ leaveRequests: [] });
    }

    let query = db.collection('LeaveRequests');

    // Apply filters based on user role and permissions
    if (userRole === 'Employee' || userRole === 'Team Lead') {
      query = query.where('userId', '==', userId as string);
    }
    // HR, Admin and Sub-Admin can see all requests (no additional filters)

    // Apply status filter
    if (status) {
      query = query.where('status', '==', status);
    }

    // Apply date filters if provided
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      console.log('Date range:', { startDate, endDate });
      
      query = query
        .where('startDate', '>=', Timestamp.fromDate(startDate))
        .where('startDate', '<=', Timestamp.fromDate(endDate));
    }

    // Order by requested date (newest first)
    query = query.orderBy('requestedAt', 'desc');

    console.log('Executing Firestore query...');
    
    let snapshot;
    try {
      snapshot = await query.get();
      console.log('Found leave requests:', snapshot.size);
    } catch (error) {
      console.error('Error querying leave requests:', error);
      // If the query fails, return empty array instead of error
      console.log('Returning empty array due to query error');
      return NextResponse.json({ leaveRequests: [] });
    }

    // Serialize first
    const raw = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

    // Gather unique userIds needing backfill
    const uniqueUserIds = Array.from(
      new Set(
        raw
          .map(r => r.data.userId as string | undefined)
          .filter(Boolean)
      )
    );

    // Fetch user docs in parallel
    const userIdToName = new Map<string, string>();
    try {
      await Promise.all(
        uniqueUserIds.map(async uid => {
          try {
            // Try lowercase 'users'
            let userDoc = await db.collection('users').doc(uid).get();
            if (!userDoc.exists) {
              // Fallback to capitalized 'Users'
              userDoc = await db.collection('Users').doc(uid).get();
            }
            const udata = userDoc.exists ? (userDoc.data() as any) : null;
            const name = udata?.name || udata?.displayName || udata?.fullName || udata?.userName || null;
            if (name) userIdToName.set(uid, name);
          } catch (e) {
            console.warn('Failed fetching user doc for', uid, e);
          }
        })
      );
    } catch (e) {
      console.warn('User backfill batch failed', e);
    }

    const leaveRequests = raw.map(({ id, data }) => {
      const serialized = serializeLeaveRequest(id, data);
      const needsBackfill = !serialized.userName || serialized.userName === 'Unknown' || serialized.userName === 'Employee' || serialized.userName === 'User';
      if (needsBackfill && serialized.userId && userIdToName.has(serialized.userId)) {
        serialized.userName = userIdToName.get(serialized.userId)!;
      }
      return serialized;
    });

    console.log('Returning leave requests:', leaveRequests.length);

    return NextResponse.json({ leaveRequests });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    // Return empty array instead of error to prevent client-side failures
    return NextResponse.json({ leaveRequests: [] });
  }
}

// POST - Create a new leave request
export async function POST(req: NextRequest) {
  try {
    console.log('Creating leave request...');
    
    const userRole = await getSessionAndUserRole(req);
    console.log('User role:', userRole);
    
    if (!userRole) {
      console.log('No user role found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    let { userId, userName, leaveType, startDate, endDate, reason } = body;

    console.log('Request body:', { userId, userName, leaveType, startDate, endDate, reason });

    // Validate required fields
    if (!userId || !leaveType || !startDate || !endDate || !reason) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Resolve userName from users collection if not provided or generic
    const needsName = !userName || ['Unknown', 'Employee', 'User'].includes(userName);
    if (needsName) {
      try {
        let userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) userDoc = await db.collection('Users').doc(userId).get();
        const udata = userDoc.exists ? (userDoc.data() as any) : null;
        const resolved = udata?.name || udata?.displayName || udata?.fullName || udata?.userName || null;
        if (resolved) userName = resolved;
      } catch (e) {
        console.warn('Failed resolving user name for', userId, e);
      }
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      console.log('Start date in past');
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    if (end < start) {
      console.log('End date before start date');
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Validate monthly leave limits
    if (leaveType === 'monthly') {
      const month = start.getMonth();
      const year = start.getFullYear();
      
      console.log('Checking monthly leave limits for:', { month, year });
      
      try {
        // Check existing monthly leave for this user and month
        const existingMonthlyLeave = await db.collection('LeaveRequests')
          .where('userId', '==', userId)
          .where('leaveType', '==', 'monthly')
          .where('status', '==', 'approved')
          .where('startDate', '>=', Timestamp.fromDate(new Date(year, month, 1)))
          .where('startDate', '<=', Timestamp.fromDate(new Date(year, month + 1, 0)))
          .get();

        const usedDays = existingMonthlyLeave.docs.reduce((total, doc) => {
          const data = doc.data();
          const s = (data.startDate as Timestamp).toDate();
          const e = (data.endDate as Timestamp).toDate();
          const days = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return total + days;
        }, 0);

        const requestedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        console.log('Leave usage:', { usedDays, requestedDays });
        
        if (usedDays + requestedDays > 2) {
          console.log('Monthly leave limit exceeded');
          return NextResponse.json(
            { error: `Monthly leave limit exceeded. You have ${usedDays}/2 days used.` },
            { status: 400 }
          );
        }
      } catch (error) {
        console.log('Error checking monthly leave limits, proceeding anyway:', error);
      }
    }

    // Create the leave request
    const leaveRequest: Omit<LeaveRequest, 'id'> = {
      userId,
      userName: userName || 'Unknown',
      role: userRole,
      leaveType,
      startDate: Timestamp.fromDate(start),
      endDate: Timestamp.fromDate(end),
      reason: reason.trim(),
      status: 'pending',
      requestedAt: Timestamp.now(),
    } as any;

    console.log('Creating leave request:', leaveRequest);

    try {
      const docRef = await db.collection('LeaveRequests').add(leaveRequest);
      
      // Get the created document
      const createdDoc = await docRef.get();
      const createdRequest = serializeLeaveRequest(createdDoc.id, createdDoc.data());

      console.log('Leave request created successfully:', createdRequest.id);

      return NextResponse.json({ 
        leaveRequest: createdRequest,
        message: 'Leave request created successfully' 
      });
    } catch (error) {
      console.error('Error creating leave request in Firestore:', error);
      return NextResponse.json(
        { error: 'Failed to create leave request in database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json(
      { error: 'Failed to create leave request', details: (error as any).message },
      { status: 500 }
    );
  }
}

