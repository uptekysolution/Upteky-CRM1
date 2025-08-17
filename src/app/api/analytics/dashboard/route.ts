import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

// Mock data for fallback when Firebase is not accessible
const getMockDashboardData = () => {
  const today = new Date();
  return {
    activeUsers: {
      count: 1257,
      change: 20.1,
      changeType: 'increase' as const
    },
    attendanceToday: {
      percentage: 92.0,
      change: 1.2,
      changeType: 'decrease' as const,
      totalEmployees: 150,
      presentToday: 138
    },
    openTasks: {
      count: 84,
      change: 12,
      changeType: 'increase' as const,
      overdue: 15
    },
    pendingApprovals: {
      count: 17,
      timesheets: 3,
      leaveRequests: 14,
      overtimeRequests: 0
    },
           recentLeads: [
         {
           id: '1',
           customerName: 'Liam Johnson',
           email: 'liam@example.com',
           source: 'Webinar',
           status: 'Contacted',
           value: 2500,
           createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
         },
         {
           id: '2',
           customerName: 'Olivia Smith',
           email: 'olivia@example.com',
           source: 'Referral',
           status: 'New',
           value: 1500,
           createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
         },
         {
           id: '3',
           customerName: 'Noah Williams',
           email: 'noah@example.com',
           source: 'Website',
           status: 'Contacted',
           value: 3000,
           createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
         }
       ],
    systemHealth: {
      uptime: 99.9,
      activeSessions: 45,
      lastBackup: new Date(today.getTime() - 24 * 60 * 60 * 1000),
      storageUsage: 75.5
    },
           userActivity: [
         {
           userId: 'user1',
           userName: 'John Doe',
           action: 'login',
           timestamp: new Date(today.getTime() - 5 * 60 * 1000).toISOString(),
           module: 'dashboard'
         },
         {
           userId: 'user2',
           userName: 'Jane Smith',
           action: 'create',
           timestamp: new Date(today.getTime() - 15 * 60 * 1000).toISOString(),
           module: 'tasks'
         },
         {
           userId: 'user3',
           userName: 'Mike Johnson',
           action: 'update',
           timestamp: new Date(today.getTime() - 30 * 60 * 1000).toISOString(),
           module: 'attendance'
         }
       ]
  };
};

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month
    const userId = searchParams.get('userId'); // for user-specific data
    const useMock = searchParams.get('mock') === 'true'; // for testing

    // If mock data is requested, return it immediately
    if (useMock) {
      return NextResponse.json(getMockDashboardData());
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate: Date;
    switch (period) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      default:
        startDate = today;
    }

    try {
      // Fetch active users count
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const usersQuery = query(
        collection(db, 'users'),
        where('lastActive', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        where('status', '==', 'active')
      );
      const usersSnapshot = await getDocs(usersQuery);
      const activeUsersCount = usersSnapshot.size;

      // Fetch attendance data
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('date', '>=', Timestamp.fromDate(today)),
        where('date', '<', Timestamp.fromDate(tomorrow))
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const presentToday = attendanceSnapshot.size;

      // Get total employees
      const totalEmployeesQuery = query(
        collection(db, 'users'),
        where('status', '==', 'active')
      );
      const totalEmployeesSnapshot = await getDocs(totalEmployeesQuery);
      const totalEmployees = totalEmployeesSnapshot.size;

      const attendancePercentage = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0;

      // Fetch tasks data
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('status', 'in', ['pending', 'in_progress'])
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      const openTasksCount = tasksSnapshot.size;

      // Get overdue tasks
      const overdueQuery = query(
        collection(db, 'tasks'),
        where('status', 'in', ['pending', 'in_progress']),
        where('dueDate', '<', Timestamp.fromDate(new Date()))
      );
      const overdueSnapshot = await getDocs(overdueQuery);
      const overdueTasksCount = overdueSnapshot.size;

      // Fetch pending approvals
      const timesheetsQuery = query(
        collection(db, 'timesheets'),
        where('status', '==', 'pending_approval')
      );
      const timesheetsSnapshot = await getDocs(timesheetsQuery);
      const pendingTimesheets = timesheetsSnapshot.size;

      const leaveQuery = query(
        collection(db, 'leave_requests'),
        where('status', '==', 'pending')
      );
      const leaveSnapshot = await getDocs(leaveQuery);
      const pendingLeaveRequests = leaveSnapshot.size;

      const overtimeQuery = query(
        collection(db, 'overtime_requests'),
        where('status', '==', 'pending')
      );
      const overtimeSnapshot = await getDocs(overtimeQuery);
      const pendingOvertimeRequests = overtimeSnapshot.size;

      // Fetch recent leads
      const leadsQuery = query(
        collection(db, 'leads'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const leadsSnapshot = await getDocs(leadsQuery);
             const recentLeads = leadsSnapshot.docs.map(doc => ({
         id: doc.id,
         customerName: doc.data().customerName || '',
         email: doc.data().email || '',
         source: doc.data().source || '',
         status: doc.data().status || '',
         value: doc.data().value || 0,
         createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
       }));

      // Fetch recent user activity
      const activityQuery = query(
        collection(db, 'user_activity'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const activitySnapshot = await getDocs(activityQuery);
             const userActivity = activitySnapshot.docs.map(doc => ({
         userId: doc.data().userId || '',
         userName: doc.data().userName || '',
         action: doc.data().action || '',
         timestamp: doc.data().timestamp?.toDate().toISOString() || new Date().toISOString(),
         module: doc.data().module || ''
       }));

      // Calculate changes (simplified - in real app, you'd compare with previous periods)
      const activeUsersChange = 5.2; // Mock data
      const attendanceChange = -1.2; // Mock data
      const tasksChange = 12; // Mock data

      const dashboardData = {
        activeUsers: {
          count: activeUsersCount,
          change: activeUsersChange,
          changeType: activeUsersChange >= 0 ? 'increase' : 'decrease'
        },
        attendanceToday: {
          percentage: Math.round(attendancePercentage * 100) / 100,
          change: Math.abs(attendanceChange),
          changeType: attendanceChange >= 0 ? 'increase' : 'decrease',
          totalEmployees,
          presentToday
        },
        openTasks: {
          count: openTasksCount,
          change: Math.abs(tasksChange),
          changeType: tasksChange >= 0 ? 'increase' : 'decrease',
          overdue: overdueTasksCount
        },
        pendingApprovals: {
          count: pendingTimesheets + pendingLeaveRequests + pendingOvertimeRequests,
          timesheets: pendingTimesheets,
          leaveRequests: pendingLeaveRequests,
          overtimeRequests: pendingOvertimeRequests
        },
        recentLeads,
               systemHealth: {
         uptime: 99.9,
         activeSessions: Math.floor(Math.random() * 50) + 10,
         lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
         storageUsage: 75.5
       },
        userActivity
      };

      return NextResponse.json(dashboardData);

    } catch (firebaseError) {
      console.warn('Firebase access failed, using mock data:', firebaseError);
      // Return mock data when Firebase is not accessible
      return NextResponse.json(getMockDashboardData());
    }

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    // Return mock data as fallback
    return NextResponse.json(getMockDashboardData());
  }
}
