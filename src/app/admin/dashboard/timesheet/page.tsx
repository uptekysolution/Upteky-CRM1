
'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, TrendingUp, Calendar, Plus } from 'lucide-react';
import { Timesheet, TimesheetStatus, TimesheetFilters, Project, User } from '@/types/timesheet';
import { TimesheetService } from '@/lib/timesheet-service';
import { UserService } from '@/lib/user-service';
import { TimesheetFiltersComponent } from '@/components/timesheet/timesheet-filters';
import { TimesheetTable } from '@/components/timesheet/timesheet-table';
import { useToast } from '@/hooks/use-toast';
import { initializeSampleData } from '@/lib/sample-data';

export default function AdminTimesheetPage() {
  const { toast } = useToast();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<TimesheetFilters>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHours: 0,
    totalEntries: 0,
    approvedHours: 0,
    pendingHours: 0,
    rejectedHours: 0,
    submittedCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  });

  useEffect(() => {
    loadData();
    const unsubscribe = TimesheetService.subscribeToAllTimesheets((timesheets) => {
      setTimesheets(timesheets);
      calculateStats(timesheets);
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, projectsData] = await Promise.all([
        UserService.getEmployees(),
        TimesheetService.getProjects()
      ]);
      setEmployees(employeesData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (timesheets: Timesheet[]) => {
    const stats = {
      totalHours: 0,
      totalEntries: 0,
      approvedHours: 0,
      pendingHours: 0,
      rejectedHours: 0,
      submittedCount: 0,
      approvedCount: 0,
      rejectedCount: 0
    };

    timesheets.forEach(timesheet => {
      stats.totalHours += timesheet.totalHours;
      stats.totalEntries += timesheet.entries.length;

      switch (timesheet.status) {
        case TimesheetStatus.APPROVED:
          stats.approvedHours += timesheet.totalHours;
          stats.approvedCount++;
          break;
        case TimesheetStatus.SUBMITTED:
          stats.pendingHours += timesheet.totalHours;
          stats.submittedCount++;
          break;
        case TimesheetStatus.REJECTED:
          stats.rejectedHours += timesheet.totalHours;
          stats.rejectedCount++;
          break;
      }
    });

    setStats(stats);
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleInitializeData = async () => {
    try {
      await initializeSampleData();
      await loadData();
      toast({
        title: "Sample Data Created",
        description: "Sample projects have been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create sample data.",
        variant: "destructive",
      });
    }
  };

  const filteredTimesheets = timesheets.filter(timesheet => {
    if (filters.employeeId && timesheet.employeeId !== filters.employeeId) return false;
    if (filters.status && timesheet.status !== filters.status) return false;
    if (filters.dateRange?.start && timesheet.weekStartDate < filters.dateRange.start) return false;
    if (filters.dateRange?.end && timesheet.weekEndDate > filters.dateRange.end) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesEmployee = timesheet.employeeName.toLowerCase().includes(searchLower);
      const matchesProject = timesheet.entries.some(entry => 
        entry.projectName.toLowerCase().includes(searchLower)
      );
      if (!matchesEmployee && !matchesProject) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading timesheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timesheet Management</h1>
          <p className="text-muted-foreground">Monitor and approve employee timesheets</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleInitializeData} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Initialize Data
          </Button>
          <Button onClick={handleRefresh} variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalEntries} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Badge variant="secondary">{stats.submittedCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {stats.submittedCount} timesheets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Badge variant="default">{stats.approvedCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedCount} timesheets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <Badge variant="destructive">{stats.rejectedCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejectedHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {stats.rejectedCount} timesheets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TimesheetFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        employees={employees}
        projects={projects}
      />

      {/* Tabs */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <TimesheetTable
            timesheets={filteredTimesheets}
            filters={filters}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employee Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.map(employee => {
                    const employeeTimesheets = timesheets.filter(t => t.employeeId === employee.id);
                    const totalHours = employeeTimesheets.reduce((sum, t) => sum + t.totalHours, 0);
                    const pendingCount = employeeTimesheets.filter(t => t.status === TimesheetStatus.SUBMITTED).length;
                    
                    return (
                      <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">{employee.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{totalHours.toFixed(1)}h</div>
                          {pendingCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {pendingCount} pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Project Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Project Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map(project => {
                    const projectHours = timesheets.reduce((sum, timesheet) => {
                      return sum + timesheet.entries
                        .filter(entry => entry.projectId === project.id)
                        .reduce((entrySum, entry) => entrySum + entry.hours, 0);
                    }, 0);
                    
                    return (
                      <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-muted-foreground">{project.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{projectHours.toFixed(1)}h</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
