import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';
import { Timestamp } from 'firebase-admin/firestore';

// GET - Fetch leave balance for a user
export async function GET(req: NextRequest) {
  try {
    console.log('Leave balance API called');
    
    const userRole = await getSessionAndUserRole(req);
    console.log('User role:', userRole);
    
    if (!userRole) {
      console.log('No user role found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    console.log('Request params:', { userId, month, year });

    if (!userId) {
      console.log('No userId provided, returning 400');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Test Firestore connection first
    try {
      console.log('Testing Firestore connection...');
      const testSnapshot = await db.collection('LeaveRequests').limit(1).get();
      console.log('Firestore connection successful, collection exists');
    } catch (firestoreError) {
      console.error('Firestore connection failed:', firestoreError);
      // Return default leave balance instead of error
      const defaultLeaveBalance = {
        monthly: { allocated: 2, used: 0, pending: 0, remaining: 2 },
        emergency: { allocated: -1, used: 0, pending: 0, remaining: -1 },
        miscellaneous: { allocated: -1, used: 0, pending: 0, remaining: -1 }
      };
      
      return NextResponse.json({
        leaveBalance: defaultLeaveBalance,
        recentHistory: [],
        month: month ? parseInt(month) : new Date().getMonth(),
        year: year ? parseInt(year) : new Date().getFullYear(),
        userId
      });
    }

    // Use current month/year if not provided
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    console.log('Target month/year:', { targetMonth, targetYear });

    // Calculate date range for the month
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);

    console.log('Date range:', { startDate, endDate });

    // Fetch all leave requests for the user in the specified month
    let leaveRequestsSnapshot;
    try {
      leaveRequestsSnapshot = await db.collection('LeaveRequests')
        .where('userId', '==', userId)
        .where('startDate', '>=', Timestamp.fromDate(startDate))
        .where('startDate', '<=', Timestamp.fromDate(endDate))
        .get();
    } catch (queryError) {
      console.error('Error querying leave requests:', queryError);
      // If the query fails, try a simpler query without date filters
      console.log('Trying simpler query without date filters...');
      try {
        leaveRequestsSnapshot = await db.collection('LeaveRequests')
          .where('userId', '==', userId)
          .get();
      } catch (simpleQueryError) {
        console.error('Simple query also failed:', simpleQueryError);
        // Return default leave balance
        const defaultLeaveBalance = {
          monthly: { allocated: 2, used: 0, pending: 0, remaining: 2 },
          emergency: { allocated: -1, used: 0, pending: 0, remaining: -1 },
          miscellaneous: { allocated: -1, used: 0, pending: 0, remaining: -1 }
        };
        
        return NextResponse.json({
          leaveBalance: defaultLeaveBalance,
          recentHistory: [],
          month: targetMonth,
          year: targetYear,
          userId
        });
      }
    }

    console.log('Found leave requests:', leaveRequestsSnapshot.size);

    // Calculate leave balance by type
    const leaveBalance = {
      monthly: {
        allocated: 2, // Fixed 2 days per month
        used: 0,
        pending: 0,
        remaining: 2
      },
      emergency: {
        allocated: -1, // Unlimited
        used: 0,
        pending: 0,
        remaining: -1
      },
      miscellaneous: {
        allocated: -1, // Unlimited
        used: 0,
        pending: 0,
        remaining: -1
      }
    };

    // Process leave requests
    leaveRequestsSnapshot.forEach((doc) => {
      const request = doc.data();
      console.log('Processing leave request:', request);
      
      // Check if the request has the required fields
      if (!request.startDate || !request.endDate || !request.leaveType) {
        console.log('Skipping request with missing fields:', request);
        return;
      }
      
      const start = request.startDate.toDate();
      const end = request.endDate.toDate();
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const leaveType = request.leaveType;
      if (leaveBalance[leaveType]) {
        if (request.status === 'approved') {
          leaveBalance[leaveType].used += days;
        } else if (request.status === 'pending') {
          leaveBalance[leaveType].pending += days;
        }
      }
    });

    // Calculate remaining days for monthly leave
    if (leaveBalance.monthly.allocated > 0) {
      leaveBalance.monthly.remaining = Math.max(0, leaveBalance.monthly.allocated - leaveBalance.monthly.used);
    }

    console.log('Calculated leave balance:', leaveBalance);

    // Get recent leave history (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let recentHistorySnapshot;
    try {
      recentHistorySnapshot = await db.collection('LeaveRequests')
        .where('userId', '==', userId)
        .where('requestedAt', '>=', Timestamp.fromDate(sixMonthsAgo))
        .orderBy('requestedAt', 'desc')
        .limit(20)
        .get();
    } catch (historyError) {
      console.error('Error fetching recent history:', historyError);
      // If the query fails, try without date filter
      try {
        recentHistorySnapshot = await db.collection('LeaveRequests')
          .where('userId', '==', userId)
          .limit(20)
          .get();
      } catch (simpleHistoryError) {
        console.error('Simple history query also failed:', simpleHistoryError);
        recentHistorySnapshot = { docs: [] };
      }
    }

    const recentHistory = recentHistorySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Recent history count:', recentHistory.length);

    const response = {
      leaveBalance,
      recentHistory,
      month: targetMonth,
      year: targetYear,
      userId
    };

    console.log('Returning response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    // Return default leave balance instead of error
    const defaultLeaveBalance = {
      monthly: { allocated: 2, used: 0, pending: 0, remaining: 2 },
      emergency: { allocated: -1, used: 0, pending: 0, remaining: -1 },
      miscellaneous: { allocated: -1, used: 0, pending: 0, remaining: -1 }
    };
    
    return NextResponse.json({
      leaveBalance: defaultLeaveBalance,
      recentHistory: [],
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      userId: 'unknown'
    });
  }
}

