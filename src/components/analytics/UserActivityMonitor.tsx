'use client'

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Activity, Users, Clock, AlertTriangle, CheckCircle, Server } from "lucide-react";
import { analyticsService, DashboardMetrics } from "@/lib/analytics-service";

interface UserActivity {
  userId: string;
  userName: string;
  action: string;
  timestamp: Date;
  module: string;
}

export function UserActivityMonitor() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await analyticsService.getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Subscribe to real-time updates
    const unsubscribe = analyticsService.subscribeToDashboardMetrics((data) => {
      setMetrics(data);
    });

    return () => unsubscribe();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'logout':
        return <Activity className="h-4 w-4 text-gray-500" />;
      case 'create':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'update':
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'delete':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getModuleColor = (module: string) => {
    switch (module.toLowerCase()) {
      case 'attendance':
        return 'bg-blue-100 text-blue-800';
      case 'payroll':
        return 'bg-green-100 text-green-800';
      case 'tasks':
        return 'bg-purple-100 text-purple-800';
      case 'timesheet':
        return 'bg-orange-100 text-orange-800';
      case 'leads':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Activity Monitor</CardTitle>
          <CardDescription>Loading real-time activity...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Activity Monitor</CardTitle>
          <CardDescription>No activity data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Unable to load activity data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Health Overview
          </CardTitle>
          <CardDescription>Real-time system performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.systemHealth.uptime}%
              </div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.systemHealth.activeSessions}
              </div>
              <div className="text-sm text-muted-foreground">Active Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {metrics.systemHealth.storageUsage}%
              </div>
              <div className="text-sm text-muted-foreground">Storage Usage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.activeUsers.count}
              </div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Activity Feed
          </CardTitle>
          <CardDescription>Live user actions and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full">
            <div className="space-y-4">
              {metrics.userActivity.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No recent activity
                </div>
              ) : (
                metrics.userActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.userName}`} />
                      <AvatarFallback>{activity.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">
                          {activity.userName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getActionIcon(activity.action)}
                        <p className="text-sm text-muted-foreground">
                          {activity.action} in {activity.module}
                        </p>
                        <Badge variant="outline" className={`text-xs ${getModuleColor(activity.module)}`}>
                          {activity.module}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Quick Statistics
          </CardTitle>
          <CardDescription>Key metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.attendanceToday.presentToday}/{metrics.attendanceToday.totalEmployees}
              </div>
              <div className="text-sm text-muted-foreground">Present Today</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {metrics.openTasks.count}
              </div>
              <div className="text-sm text-muted-foreground">Open Tasks</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {metrics.pendingApprovals.count}
              </div>
              <div className="text-sm text-muted-foreground">Pending Approvals</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.recentLeads.length}
              </div>
              <div className="text-sm text-muted-foreground">Recent Leads</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
