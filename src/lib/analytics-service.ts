import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';
import { realTimeSimulator } from './real-time-simulator';

export interface DashboardMetrics {
  activeUsers: {
    count: number;
    change: number;
    changeType: 'increase' | 'decrease';
  };
  attendanceToday: {
    percentage: number;
    change: number;
    changeType: 'increase' | 'decrease';
    totalEmployees: number;
    presentToday: number;
  };
  openTasks: {
    count: number;
    change: number;
    changeType: 'increase' | 'decrease';
    overdue: number;
  };
  pendingApprovals: {
    count: number;
    timesheets: number;
    leaveRequests: number;
    overtimeRequests: number;
  };
  recentLeads: Array<{
    id: string;
    customerName: string;
    email: string;
    source: string;
    status: string;
    value: number;
    createdAt: Date;
  }>;
  systemHealth: {
    uptime: number;
    activeSessions: number;
    lastBackup: Date;
    storageUsage: number;
  };
  userActivity: Array<{
    userId: string;
    userName: string;
    action: string;
    timestamp: Date;
    module: string;
  }>;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private listeners: Map<string, () => void> = new Map();
  private lastMetrics: DashboardMetrics | null = null;
  private updateCallbacks: Set<(metrics: DashboardMetrics) => void> = new Set();

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Get real-time dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // First try to get data from the API endpoint
      const response = await fetch('/api/analytics/dashboard');
      if (response.ok) {
        const data = await response.json();
        // Convert ISO strings back to Date objects
        const processedData = this.processDates(data);
        this.lastMetrics = processedData;
        return processedData;
      }

      // Fallback to direct Firebase queries
      const [
        activeUsers,
        attendanceData,
        tasksData,
        approvalsData,
        leadsData,
        systemHealth,
        userActivity
      ] = await Promise.all([
        this.getActiveUsersCount(),
        this.getAttendanceMetrics(),
        this.getTasksMetrics(),
        this.getPendingApprovals(),
        this.getRecentLeads(),
        this.getSystemHealth(),
        this.getRecentUserActivity()
      ]);

      const metrics = {
        activeUsers,
        attendanceToday: attendanceData,
        openTasks: tasksData,
        pendingApprovals: approvalsData,
        recentLeads: leadsData,
        systemHealth,
        userActivity
      };

      this.lastMetrics = metrics;
      return metrics;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      // Return last known metrics or mock data
      if (this.lastMetrics) {
        return this.lastMetrics;
      }
      throw error;
    }
  }

  // Subscribe to real-time dashboard updates
  subscribeToDashboardMetrics(callback: (metrics: DashboardMetrics) => void): () => void {
    // Add callback to the set
    this.updateCallbacks.add(callback);

    // If we have last metrics, call immediately
    if (this.lastMetrics) {
      callback(this.lastMetrics);
    }

    // Start real-time simulation for dynamic updates
    realTimeSimulator.startSimulation(3600000); // Update every 1 hour

    // Subscribe to real-time simulator
    const simulatorUnsubscribe = realTimeSimulator.subscribe((metrics) => {
      this.lastMetrics = metrics;
      this.updateCallbacks.forEach(cb => cb(metrics));
    });

    // Set up polling as backup
    const interval = setInterval(async () => {
      try {
        const metrics = await this.getDashboardMetrics();
        this.updateCallbacks.forEach(cb => cb(metrics));
      } catch (error) {
        console.error('Error in dashboard metrics polling:', error);
      }
    }, 3600000); // Update every 1 hour

    // Try to set up Firebase real-time listener if possible
    let firebaseUnsubscribe: (() => void) | null = null;
    try {
      firebaseUnsubscribe = onSnapshot(
        collection(db, 'dashboard_metrics'),
        async (snapshot) => {
          try {
            const metrics = await this.getDashboardMetrics();
            this.updateCallbacks.forEach(cb => cb(metrics));
          } catch (error) {
            console.error('Error in dashboard metrics subscription:', error);
          }
        },
        (error) => {
          console.warn('Firebase real-time subscription failed, using simulator:', error);
        }
      );
    } catch (error) {
      console.warn('Firebase real-time listener setup failed, using simulator:', error);
    }

    // Return cleanup function
    return () => {
      this.updateCallbacks.delete(callback);
      simulatorUnsubscribe();
      clearInterval(interval);
      if (firebaseUnsubscribe) {
        firebaseUnsubscribe();
      }
    };
  }

  // Manual refresh method
  async refreshMetrics(): Promise<DashboardMetrics> {
    const metrics = await this.getDashboardMetrics();
    this.updateCallbacks.forEach(cb => cb(metrics));
    return metrics;
  }

  private async getActiveUsersCount() {
    try {
      // Get users who have been active in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const usersQuery = query(
        collection(db, 'users'),
        where('lastActive', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        where('status', '==', 'active')
      );

      const usersSnapshot = await getDocs(usersQuery);
      const currentCount = usersSnapshot.size;

      // Get count from 60 days ago for comparison
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const previousQuery = query(
        collection(db, 'users'),
        where('lastActive', '>=', Timestamp.fromDate(sixtyDaysAgo)),
        where('lastActive', '<', Timestamp.fromDate(thirtyDaysAgo)),
        where('status', '==', 'active')
      );

      const previousSnapshot = await getDocs(previousQuery);
      const previousCount = previousSnapshot.size;

      const change = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;

      return {
        count: currentCount,
        change: Math.abs(change),
        changeType: change >= 0 ? 'increase' : 'decrease'
      };
    } catch (error) {
      console.error('Error getting active users count:', error);
      return { count: 0, change: 0, changeType: 'increase' };
    }
  }

  private async getAttendanceMetrics() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's attendance
      const todayQuery = query(
        collection(db, 'attendance'),
        where('date', '>=', Timestamp.fromDate(today)),
        where('date', '<', Timestamp.fromDate(tomorrow))
      );

      const todaySnapshot = await getDocs(todayQuery);
      const presentToday = todaySnapshot.size;

      // Get total employees
      const usersQuery = query(
        collection(db, 'users'),
        where('status', '==', 'active')
      );
      const usersSnapshot = await getDocs(usersQuery);
      const totalEmployees = usersSnapshot.size;

      const percentage = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0;

      // Get yesterday's attendance for comparison
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayQuery = query(
        collection(db, 'attendance'),
        where('date', '>=', Timestamp.fromDate(yesterday)),
        where('date', '<', Timestamp.fromDate(today))
      );

      const yesterdaySnapshot = await getDocs(yesterdayQuery);
      const presentYesterday = yesterdaySnapshot.size;
      const yesterdayPercentage = totalEmployees > 0 ? (presentYesterday / totalEmployees) * 100 : 0;

      const change = percentage - yesterdayPercentage;

      return {
        percentage: Math.round(percentage * 100) / 100,
        change: Math.abs(change),
        changeType: change >= 0 ? 'increase' : 'decrease',
        totalEmployees,
        presentToday
      };
    } catch (error) {
      console.error('Error getting attendance metrics:', error);
      return {
        percentage: 0,
        change: 0,
        changeType: 'increase',
        totalEmployees: 0,
        presentToday: 0
      };
    }
  }

  private async getTasksMetrics() {
    try {
      // Get open tasks
      const openTasksQuery = query(
        collection(db, 'tasks'),
        where('status', 'in', ['pending', 'in_progress'])
      );

      const openTasksSnapshot = await getDocs(openTasksQuery);
      const currentCount = openTasksSnapshot.size;

      // Get overdue tasks
      const now = new Date();
      const overdueQuery = query(
        collection(db, 'tasks'),
        where('status', 'in', ['pending', 'in_progress']),
        where('dueDate', '<', Timestamp.fromDate(now))
      );

      const overdueSnapshot = await getDocs(overdueQuery);
      const overdue = overdueSnapshot.size;

      // Get tasks from last week for comparison
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const lastWeekQuery = query(
        collection(db, 'tasks'),
        where('status', 'in', ['pending', 'in_progress']),
        where('createdAt', '>=', Timestamp.fromDate(lastWeek))
      );

      const lastWeekSnapshot = await getDocs(lastWeekQuery);
      const lastWeekCount = lastWeekSnapshot.size;

      const change = currentCount - lastWeekCount;

      return {
        count: currentCount,
        change: Math.abs(change),
        changeType: change >= 0 ? 'increase' : 'decrease',
        overdue
      };
    } catch (error) {
      console.error('Error getting tasks metrics:', error);
      return { count: 0, change: 0, changeType: 'increase', overdue: 0 };
    }
  }

  private async getPendingApprovals() {
    try {
      // Get pending timesheets
      const timesheetsQuery = query(
        collection(db, 'timesheets'),
        where('status', '==', 'pending_approval')
      );
      const timesheetsSnapshot = await getDocs(timesheetsQuery);
      const timesheets = timesheetsSnapshot.size;

      // Get pending leave requests
      const leaveQuery = query(
        collection(db, 'leave_requests'),
        where('status', '==', 'pending')
      );
      const leaveSnapshot = await getDocs(leaveQuery);
      const leaveRequests = leaveSnapshot.size;

      // Get pending overtime requests
      const overtimeQuery = query(
        collection(db, 'overtime_requests'),
        where('status', '==', 'pending')
      );
      const overtimeSnapshot = await getDocs(overtimeQuery);
      const overtimeRequests = overtimeSnapshot.size;

      return {
        count: timesheets + leaveRequests + overtimeRequests,
        timesheets,
        leaveRequests,
        overtimeRequests
      };
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      return { count: 0, timesheets: 0, leaveRequests: 0, overtimeRequests: 0 };
    }
  }

  private async getRecentLeads() {
    try {
      const leadsQuery = query(
        collection(db, 'leads'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const leadsSnapshot = await getDocs(leadsQuery);
      const leads = leadsSnapshot.docs.map(doc => ({
        id: doc.id,
        customerName: doc.data().customerName || '',
        email: doc.data().email || '',
        source: doc.data().source || '',
        status: doc.data().status || '',
        value: doc.data().value || 0,
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      return leads;
    } catch (error) {
      console.error('Error getting recent leads:', error);
      return [];
    }
  }

  private async getSystemHealth() {
    try {
      // This would typically come from a system monitoring service
      // For now, we'll return mock data
      return {
        uptime: 99.9,
        activeSessions: Math.floor(Math.random() * 50) + 10,
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        storageUsage: 75.5
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        uptime: 0,
        activeSessions: 0,
        lastBackup: new Date(),
        storageUsage: 0
      };
    }
  }

  private async getRecentUserActivity() {
    try {
      const activityQuery = query(
        collection(db, 'user_activity'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      const activitySnapshot = await getDocs(activityQuery);
      const activities = activitySnapshot.docs.map(doc => ({
        userId: doc.data().userId || '',
        userName: doc.data().userName || '',
        action: doc.data().action || '',
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        module: doc.data().module || ''
      }));

      return activities;
    } catch (error) {
      console.error('Error getting recent user activity:', error);
      return [];
    }
  }

  // Process dates from API response
  private processDates(data: any): DashboardMetrics {
    return {
      ...data,
      systemHealth: {
        ...data.systemHealth,
        lastBackup: new Date(data.systemHealth.lastBackup)
      },
      recentLeads: data.recentLeads.map((lead: any) => ({
        ...lead,
        createdAt: new Date(lead.createdAt)
      })),
      userActivity: data.userActivity.map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp)
      }))
    };
  }

  // Cleanup all listeners
  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    this.updateCallbacks.clear();
  }
}

export const analyticsService = AnalyticsService.getInstance();
