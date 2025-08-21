
'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Calendar, ChevronLeft, ChevronRight, Send, Plus } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { Timesheet, TimesheetStatus, Project, User } from '@/types/timesheet';
import { TimesheetService } from '@/lib/timesheet-service';
import { UserService } from '@/lib/user-service';
import { TimesheetWeekGrid } from '@/components/timesheet/timesheet-week-grid';
import { useToast } from '@/hooks/use-toast';
import { cleanTimesheetEntry } from '@/utils/dateUtils';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function EmployeeTimesheetPage() {
  const { toast } = useToast();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTimesheet, setCurrentTimesheet] = useState<Timesheet | null>(null);
  const [currentUser, setCurrentUser] = useState<{ uid: string; name: string; email: string } | null>(null);

  const { weekStart, weekEnd } = TimesheetService.getWeekDates(currentWeek);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user details from Firestore
          const userDoc = await UserService.getUserById(user.uid);
          if (userDoc) {
            setCurrentUser({
              uid: user.uid,
              name: userDoc.name || userDoc.firstName + ' ' + userDoc.lastName || 'Unknown User',
              email: user.email || ''
            });
          } else {
            setCurrentUser({
              uid: user.uid,
              name: user.displayName || 'Unknown User',
              email: user.email || ''
            });
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
          setCurrentUser({
            uid: user.uid,
            name: user.displayName || 'Unknown User',
            email: user.email || ''
          });
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load data when user is authenticated
  useEffect(() => {
    if (currentUser?.uid) {
      loadData();
      const unsubscribe = TimesheetService.subscribeToEmployeeTimesheets(
        currentUser.uid,
        (timesheets) => {
          setTimesheets(timesheets);
          const current = timesheets.find(t => 
            t.weekStartDate.getTime() === weekStart.getTime()
          );
          setCurrentTimesheet(current || null);
        }
      );

      return () => unsubscribe();
    }
  }, [currentUser?.uid, currentWeek]);

  const loadData = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      const projectsData = await TimesheetService.getProjects();
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

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleToday = () => {
    setCurrentWeek(new Date());
  };

  const handleAddEntry = (entry: any) => {
    if (!currentUser?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to add time entries.",
        variant: "destructive",
      });
      return;
    }

    // Clean the entry object to remove undefined values
    const cleanEntry = cleanTimesheetEntry(entry);

    if (!currentTimesheet) {
      // Create new timesheet for current week
      const newTimesheet: Omit<Timesheet, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: currentUser.uid,
        employeeName: currentUser.name,
        employeeEmail: currentUser.email,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        entries: [cleanEntry],
        totalHours: cleanEntry.hours,
        status: TimesheetStatus.DRAFT
      };

      TimesheetService.createTimesheet(newTimesheet).then(() => {
        toast({
          title: "Entry Added",
          description: "Time entry has been added successfully.",
        });
      }).catch((error) => {
        toast({
          title: "Error",
          description: "Failed to add time entry.",
          variant: "destructive",
        });
      });
    } else {
      // Add to existing timesheet
      const updatedEntries = [...currentTimesheet.entries, cleanEntry];
      const totalHours = TimesheetService.calculateTotalHours(updatedEntries);
      
      TimesheetService.updateTimesheet(currentTimesheet.id, {
        entries: updatedEntries,
        totalHours
      }).then(() => {
        toast({
          title: "Entry Added",
          description: "Time entry has been added successfully.",
        });
      }).catch((error) => {
        toast({
          title: "Error",
          description: "Failed to add time entry.",
          variant: "destructive",
        });
      });
    }
  };

  const handleUpdateEntry = (entry: any) => {
    if (!currentTimesheet) return;

    // Clean the entry object to remove undefined values
    const cleanEntry = cleanTimesheetEntry(entry);

    const updatedEntries = currentTimesheet.entries.map(e => 
      e.id === entry.id ? cleanEntry : e
    );
    const totalHours = TimesheetService.calculateTotalHours(updatedEntries);
    
    TimesheetService.updateTimesheet(currentTimesheet.id, {
      entries: updatedEntries,
      totalHours
    }).then(() => {
      toast({
        title: "Entry Updated",
        description: "Time entry has been updated successfully.",
      });
    }).catch((error) => {
      toast({
        title: "Error",
        description: "Failed to update time entry.",
        variant: "destructive",
      });
    });
  };

  const handleDeleteEntry = (entryId: string) => {
    if (!currentTimesheet) return;

    const updatedEntries = currentTimesheet.entries.filter(e => e.id !== entryId);
    const totalHours = TimesheetService.calculateTotalHours(updatedEntries);
    
    TimesheetService.updateTimesheet(currentTimesheet.id, {
      entries: updatedEntries,
      totalHours
    }).then(() => {
      toast({
        title: "Entry Deleted",
        description: "Time entry has been deleted successfully.",
      });
    }).catch((error) => {
      toast({
        title: "Error",
        description: "Failed to delete time entry.",
        variant: "destructive",
      });
    });
  };

  const handleSubmitTimesheet = async () => {
    if (!currentTimesheet) {
      toast({
        title: "Error",
        description: "No timesheet to submit.",
        variant: "destructive",
      });
      return;
    }

    try {
      await TimesheetService.submitTimesheet(currentTimesheet.id);
      toast({
        title: "Timesheet Submitted",
        description: "Your timesheet has been submitted for approval.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit timesheet.",
        variant: "destructive",
      });
    }
  };

  const canEdit = !currentTimesheet || currentTimesheet.status === TimesheetStatus.DRAFT;
  const canSubmit = currentTimesheet && 
                   currentTimesheet.status === TimesheetStatus.DRAFT && 
                   currentTimesheet.entries.length > 0;

  // Show loading state while checking authentication
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading timesheet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Timesheet</h1>
          <p className="text-muted-foreground">Log your work hours and track your time</p>
          <p className="text-sm text-muted-foreground">Welcome, {currentUser.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Week of {format(weekStart, 'MMM d, yyyy')}
            </span>
            <div className="flex items-center gap-2">
              {currentTimesheet && (
                <Badge variant={
                  currentTimesheet.status === TimesheetStatus.DRAFT ? 'secondary' :
                  currentTimesheet.status === TimesheetStatus.SUBMITTED ? 'default' :
                  currentTimesheet.status === TimesheetStatus.APPROVED ? 'default' : 'destructive'
                }>
                  {currentTimesheet.status}
                </Badge>
              )}
              {canSubmit && (
                <Button onClick={handleSubmitTimesheet} size="sm">
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {currentTimesheet?.totalHours.toFixed(1) || '0.0'}h
              </div>
              <div className="text-sm text-muted-foreground">Total Hours</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {currentTimesheet?.entries.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Entries</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {((currentTimesheet?.totalHours || 0) / 7).toFixed(1)}h
              </div>
              <div className="text-sm text-muted-foreground">Average/Day</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Weekly Grid</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          {currentTimesheet ? (
            <TimesheetWeekGrid
              weekStart={weekStart}
              entries={currentTimesheet.entries}
              projects={projects}
              status={currentTimesheet.status}
              onAddEntry={handleAddEntry}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No timesheet for this week</h3>
                <p className="text-muted-foreground mb-4">
                  Start logging your time to create a timesheet for this week.
                </p>
                <Button onClick={() => handleAddEntry({
                  id: `entry-${Date.now()}`,
                  date: new Date(),
                  projectId: projects[0]?.id || '',
                  projectName: projects[0]?.name || '',
                  hours: 0,
                  notes: ''
                })}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Entry
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timesheet History</CardTitle>
            </CardHeader>
            <CardContent>
              {timesheets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No timesheet history found
                </div>
              ) : (
                <div className="space-y-4">
                  {timesheets.map((timesheet) => (
                    <div key={timesheet.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          Week of {format(timesheet.weekStartDate, 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {timesheet.entries.length} entries
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">{timesheet.totalHours.toFixed(1)}h</div>
                          <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                        <Badge variant={
                          timesheet.status === TimesheetStatus.DRAFT ? 'secondary' :
                          timesheet.status === TimesheetStatus.SUBMITTED ? 'default' :
                          timesheet.status === TimesheetStatus.APPROVED ? 'default' : 'destructive'
                        }>
                          {timesheet.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
