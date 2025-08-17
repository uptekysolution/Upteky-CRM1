"use client";
import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarCheck2, CheckSquare, Clock, Users, Target, TrendingUp, TrendingDown, RefreshCw, AlertCircle, Activity } from "lucide-react"
import { DashboardChart } from "./dashboard-chart"
import { RealTimeAnalytics } from "@/components/analytics/RealTimeAnalytics"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorBoundary } from "@/components/ErrorBoundary"
// import { usePerformanceMonitor, useDataFetchMonitor } from "@/hooks/usePerformanceMonitor"

// Enhanced mock permissions with better structure
const mockPermissions = {
  Admin: { 'users:manage': true, 'attendance:view:all': true, 'tasks:view': true, 'timesheet:view': true, 'crm:view:all': true, 'lead-generation:view': true },
  HR: { 'users:manage': true, 'attendance:view:all': true, 'tasks:view': true, 'timesheet:view': true, 'crm:view:all': false, 'lead-generation:view': false },
  'Team Lead': { 'users:manage': false, 'attendance:view:team': true, 'tasks:view': true, 'timesheet:view': true, 'crm:view:team': true, 'lead-generation:view': true },
  Employee: { 'users:manage': false, 'attendance:view:own': true, 'tasks:view': true, 'timesheet:view': true, 'crm:view:all': false, 'lead-generation:view': false },
  'Business Development': { 'users:manage': false, 'attendance:view:all': false, 'tasks:view': false, 'timesheet:view': false, 'crm:view:own': true, 'lead-generation:view': true }
};

interface DashboardMetrics {
  activeUsers: number;
  attendanceToday: number;
  openTasks: number;
  pendingApprovals: number;
  lastUpdated: Date;
}

interface RealTimeData {
  isLive: boolean;
  lastRefresh: Date;
  error: string | null;
}

function DashboardContent() {
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeUsers: 0,
    attendanceToday: 0,
    openTasks: 0,
    pendingApprovals: 0,
    lastUpdated: new Date()
  });
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    isLive: false,
    lastRefresh: new Date(),
    error: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Performance monitoring temporarily disabled to prevent infinite loops
  // const { monitorAsyncOperation } = usePerformanceMonitor('Dashboard')
  // const { recordFetch } = useDataFetchMonitor('Dashboard')

  // Get user permissions based on role
  const userPermissions = (mockPermissions as any)[userRole] || {};

  // Fetch real-time metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setRealTimeData(prev => ({ ...prev, error: null }));

      // Simulate real-time data fetching with error handling
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Fetch attendance data
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('date', '>=', Timestamp.fromDate(startOfDay))
      );
      
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const presentCount = attendanceSnapshot.docs.filter(doc => 
        doc.data().status === 'present' || doc.data().status === 'checked-in'
      ).length;
      
      // Fetch tasks data
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('status', '==', 'open')
      );
      
      const tasksSnapshot = await getDocs(tasksQuery);
      
      // Fetch pending approvals
      const approvalsQuery = query(
        collection(db, 'leave_requests'),
        where('status', '==', 'pending')
      );
      
      const approvalsSnapshot = await getDocs(approvalsQuery);
      
      // Calculate metrics with realistic data
      const totalEmployees = 150; // This would come from user count
      const attendancePercentage = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;
      
      const newMetrics: DashboardMetrics = {
        activeUsers: Math.floor(Math.random() * 200) + 1100, // Simulate active users
        attendanceToday: attendancePercentage,
        openTasks: tasksSnapshot.size,
        pendingApprovals: approvalsSnapshot.size,
        lastUpdated: new Date()
      };

      setMetrics(newMetrics);
      setRealTimeData({
        isLive: true,
        lastRefresh: new Date(),
        error: null
      });

    } catch (error) {
      console.error('Error fetching metrics:', error);
      setRealTimeData(prev => ({
        ...prev,
        error: 'Failed to fetch real-time data'
      }));
      toast({
        variant: 'destructive',
        title: 'Data Fetch Error',
        description: 'Unable to load real-time metrics. Please try again.'
      });
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
      
      // Performance monitoring removed to prevent infinite loops
      // const fetchDuration = performance.now() - fetchStartTime;
      // recordFetch(fetchDuration, !realTimeData.error);
    }
  }, [toast]); // Simplified dependencies to prevent infinite loops

  // Auto-refresh every 1 hour
  useEffect(() => {
    fetchMetrics();
    
    const interval = setInterval(() => {
      fetchMetrics();
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []); // Remove fetchMetrics dependency to prevent infinite loops

  // User authentication and role fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserName("");
        setUserRole("");
        setIsLoading(false);
        return;
      }

      try {
        let resolvedName: string | null = user.displayName || null;

        // Try Firestore user document for a preferred name and role
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          resolvedName = data?.name || data?.fullName || resolvedName;
          setUserRole(data?.role || "Employee");
        } else {
          setUserRole("Employee");
        }

        if (!resolvedName) {
          const localPart = user.email?.split("@")[0] ?? "User";
          resolvedName = localPart
            .split(/[._-]+/)
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        }

        setUserName(resolvedName);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserName("User");
        setUserRole("Employee");
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Performance monitoring removed to prevent infinite loops
  // useEffect(() => {
  //   startRender();
  //   return () => {
  //     endRender();
  //   };
  // }, []);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header with real-time status */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {userName || "User"}!</h1>
            <p className="text-muted-foreground">Here's a summary of your workspace with real-time analytics.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Real-time status indicator */}
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${realTimeData.isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className={realTimeData.isLive ? 'text-green-600' : 'text-gray-500'}>
                {realTimeData.isLive ? 'Live' : 'Offline'}
              </span>
                           <span className="text-muted-foreground">
               Updated {realTimeData.lastRefresh.toLocaleTimeString()} | Auto-refresh: 1 hour
             </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMetrics}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {realTimeData.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">{realTimeData.error}</span>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {userPermissions['users:manage'] && (
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeUsers.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-600" />
                +20.1% from last month
              </div>
            </CardContent>
          </Card>
        )}
        
        {(userPermissions['attendance:view:all'] || userPermissions['attendance:view:team'] || userPermissions['attendance:view:own']) && (
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Attendance Today
              </CardTitle>
              <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.attendanceToday}%</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 text-red-600" />
                -1.2% from yesterday
              </div>
            </CardContent>
          </Card>
        )}
        
        {userPermissions['tasks:view'] && (
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.openTasks}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-600" />
                +12 since last week
              </div>
            </CardContent>
          </Card>
        )}
        
        {userPermissions['timesheet:view'] && (
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Approvals
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingApprovals}</div>
              <div className="text-xs text-muted-foreground">
                3 timesheets, 14 leave requests
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts and Tables Section */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mt-8">
        {(userPermissions['crm:view:all'] || userPermissions['crm:view:team'] || userPermissions['crm:view:own']) && (
          <Card className="xl:col-span-2 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>
                A summary of the most recent leads generated this month.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Source
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Status
                    </TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium">Liam Johnson</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        liam@example.com
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Webinar
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className="text-xs" variant="outline">
                        Contacted
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">$2,500.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium">Olivia Smith</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        olivia@example.com
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Referral
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className="text-xs" variant="secondary">
                        New
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">$1,500.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium">Noah Williams</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        noah@example.com
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Website
                    </TableCell>
                     <TableCell className="hidden sm:table-cell">
                      <Badge className="text-xs" variant="outline">
                        Contacted
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">$3,000.00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        
        {userPermissions['lead-generation:view'] && (
          <DashboardChart />
        )}
      </div>

      {/* Real-Time Analytics */}
      <div className="mt-8">
        <RealTimeAnalytics />
      </div>
    </>
  )
}

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  )
}
