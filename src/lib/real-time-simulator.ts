import { DashboardMetrics } from './analytics-service';

export class RealTimeSimulator {
  private static instance: RealTimeSimulator;
  private interval: NodeJS.Timeout | null = null;
  private callbacks: Set<(metrics: DashboardMetrics) => void> = new Set();
  private baseMetrics: DashboardMetrics;

  private constructor() {
    // Initialize with base metrics
    this.baseMetrics = this.generateBaseMetrics();
  }

  static getInstance(): RealTimeSimulator {
    if (!RealTimeSimulator.instance) {
      RealTimeSimulator.instance = new RealTimeSimulator();
    }
    return RealTimeSimulator.instance;
  }

  private generateBaseMetrics(): DashboardMetrics {
    const now = new Date();
    return {
      activeUsers: {
        count: 1257,
        change: 20.1,
        changeType: 'increase'
      },
      attendanceToday: {
        percentage: 92.0,
        change: 1.2,
        changeType: 'decrease',
        totalEmployees: 150,
        presentToday: 138
      },
      openTasks: {
        count: 84,
        change: 12,
        changeType: 'increase',
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
           createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
         },
         {
           id: '2',
           customerName: 'Olivia Smith',
           email: 'olivia@example.com',
           source: 'Referral',
           status: 'New',
           value: 1500,
           createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
         },
         {
           id: '3',
           customerName: 'Noah Williams',
           email: 'noah@example.com',
           source: 'Website',
           status: 'Contacted',
           value: 3000,
           createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
         }
       ],
             systemHealth: {
         uptime: 99.9,
         activeSessions: 45,
         lastBackup: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
         storageUsage: 75.5
       },
             userActivity: [
         {
           userId: 'user1',
           userName: 'John Doe',
           action: 'login',
           timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
           module: 'dashboard'
         },
         {
           userId: 'user2',
           userName: 'Jane Smith',
           action: 'create',
           timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
           module: 'tasks'
         },
         {
           userId: 'user3',
           userName: 'Mike Johnson',
           action: 'update',
           timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
           module: 'attendance'
         }
       ]
    };
  }

  private generateRandomVariation(base: number, maxVariation: number = 0.1): number {
    const variation = (Math.random() - 0.5) * 2 * maxVariation;
    return Math.max(0, base * (1 + variation));
  }

  private updateMetrics(): DashboardMetrics {
    const now = new Date();
    
    // Simulate realistic variations
    const updatedMetrics: DashboardMetrics = {
      ...this.baseMetrics,
      activeUsers: {
        ...this.baseMetrics.activeUsers,
        count: Math.round(this.generateRandomVariation(this.baseMetrics.activeUsers.count, 0.05))
      },
      attendanceToday: {
        ...this.baseMetrics.attendanceToday,
        presentToday: Math.round(this.generateRandomVariation(this.baseMetrics.attendanceToday.presentToday, 0.02)),
        percentage: Math.round(this.generateRandomVariation(this.baseMetrics.attendanceToday.percentage, 0.01) * 100) / 100
      },
      openTasks: {
        ...this.baseMetrics.openTasks,
        count: Math.round(this.generateRandomVariation(this.baseMetrics.openTasks.count, 0.1)),
        overdue: Math.round(this.generateRandomVariation(this.baseMetrics.openTasks.overdue, 0.2))
      },
      pendingApprovals: {
        ...this.baseMetrics.pendingApprovals,
        count: Math.round(this.generateRandomVariation(this.baseMetrics.pendingApprovals.count, 0.15)),
        timesheets: Math.round(this.generateRandomVariation(this.baseMetrics.pendingApprovals.timesheets, 0.3)),
        leaveRequests: Math.round(this.generateRandomVariation(this.baseMetrics.pendingApprovals.leaveRequests, 0.2))
      },
      systemHealth: {
        ...this.baseMetrics.systemHealth,
        activeSessions: Math.round(this.generateRandomVariation(this.baseMetrics.systemHealth.activeSessions, 0.3)),
        storageUsage: Math.round(this.generateRandomVariation(this.baseMetrics.systemHealth.storageUsage, 0.02) * 100) / 100
      },
      userActivity: [
        ...this.baseMetrics.userActivity.slice(0, 2), // Keep most recent activities
                 {
           userId: `user${Math.floor(Math.random() * 100)}`,
           userName: this.getRandomName(),
           action: this.getRandomAction(),
           timestamp: new Date(now.getTime() - Math.random() * 60 * 60 * 1000).toISOString(), // Random time in last hour
           module: this.getRandomModule()
         }
      ]
    };

    // Update base metrics occasionally
    if (Math.random() < 0.1) { // 10% chance to update base metrics
      this.baseMetrics = updatedMetrics;
    }

    return updatedMetrics;
  }

  private getRandomName(): string {
    const names = ['Alice Brown', 'Bob Wilson', 'Carol Davis', 'David Miller', 'Eva Garcia', 'Frank Rodriguez'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomAction(): string {
    const actions = ['login', 'logout', 'create', 'update', 'delete', 'view'];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  private getRandomModule(): string {
    const modules = ['dashboard', 'attendance', 'tasks', 'payroll', 'timesheet', 'leads'];
    return modules[Math.floor(Math.random() * modules.length)];
  }

  startSimulation(intervalMs: number = 3600000): void { // Default to 1 hour
    if (this.interval) {
      this.stopSimulation();
    }

    this.interval = setInterval(() => {
      const updatedMetrics = this.updateMetrics();
      const processedMetrics = this.processDates(updatedMetrics);
      this.callbacks.forEach(callback => callback(processedMetrics));
    }, intervalMs);
  }

  stopSimulation(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  subscribe(callback: (metrics: DashboardMetrics) => void): () => void {
    this.callbacks.add(callback);
    
    // Return initial metrics immediately with processed dates
    callback(this.processDates(this.updateMetrics()));
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  getCurrentMetrics(): DashboardMetrics {
    return this.processDates(this.updateMetrics());
  }

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

  cleanup(): void {
    this.stopSimulation();
    this.callbacks.clear();
  }
}

export const realTimeSimulator = RealTimeSimulator.getInstance();
