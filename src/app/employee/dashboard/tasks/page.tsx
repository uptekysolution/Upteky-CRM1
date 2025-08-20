
'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Calendar, List, Filter, Users, Clock, CheckSquare, User } from "lucide-react";
import { Task, TaskStatus, TaskPriority, TaskFilters, Meeting, MeetingStatus } from '@/types/task';
import { TaskService } from '@/lib/task-service';
import { MeetingService } from '@/lib/meeting-service';
import { UserService, User as UserType } from '@/lib/user-service';
import { TaskModal } from '@/components/tasks/task-modal';
import { MeetingModal } from '@/components/tasks/meeting-modal';
import { TaskCard } from '@/components/tasks/task-card';
import { MeetingCard } from '@/components/tasks/meeting-card';
import { TaskCalendar } from '@/components/tasks/task-calendar';
import { TaskFilters as TaskFiltersComponent } from '@/components/tasks/task-filters';
import { FloatingActionButton } from '@/components/tasks/floating-action-button';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function EmployeeTasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [currentUser, setCurrentUser] = useState<{ uid: string; name: string; email: string } | null>(null);
  
  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);
  
  // Filter states
  const [taskFilters, setTaskFilters] = useState<TaskFilters>({});
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

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

  // Load initial data when user is authenticated
  useEffect(() => {
    if (currentUser?.uid) {
      loadInitialData();
    }
  }, [currentUser?.uid]);

  // Apply filters when tasks or filters change
  useEffect(() => {
    applyTaskFilters();
  }, [tasks, taskFilters]);

  const loadInitialData = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setIsLoading(true);
      console.log('EmployeeTasksPage - Loading initial data for user:', currentUser.uid);
      
      // Load employees and users for modals
      const [employeesData, usersData] = await Promise.all([
        UserService.getEmployees(),
        UserService.getActiveUsers()
      ]);
      
      console.log('EmployeeTasksPage - Employees loaded:', employeesData);
      console.log('EmployeeTasksPage - Users loaded:', usersData);
      
      setEmployees(employeesData);
      setUsers(usersData);
      
      // Set up real-time listeners for employee's tasks and meetings
      const unsubscribeTasks = TaskService.subscribeToTasksByAssignee(currentUser.uid, (tasksData) => {
        console.log('Tasks updated:', tasksData);
        setTasks(tasksData);
      });
      
      const unsubscribeMeetings = MeetingService.subscribeToMeetingsByParticipant(currentUser.uid, (meetingsData) => {
        console.log('Meetings updated:', meetingsData);
        setMeetings(meetingsData);
      });
      
      // Cleanup function
      return () => {
        unsubscribeTasks();
        unsubscribeMeetings();
      };
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load your tasks and meetings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshUsers = async () => {
    try {
      setIsLoading(true);
      const [employeesData, usersData] = await Promise.all([
        UserService.getEmployees(),
        UserService.getActiveUsers()
      ]);
      
      setEmployees(employeesData);
      setUsers(usersData);
      
      toast({
        title: "Users Refreshed",
        description: `Loaded ${employeesData.length} employees and ${usersData.length} users`,
      });
    } catch (error) {
      console.error('Error refreshing users:', error);
      toast({
        title: "Error",
        description: "Failed to refresh users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyTaskFilters = () => {
    let filtered = [...tasks];
    
    if (taskFilters.status) {
      filtered = filtered.filter(task => task.status === taskFilters.status);
    }
    
    if (taskFilters.priority) {
      filtered = filtered.filter(task => task.priority === taskFilters.priority);
    }
    
    if (taskFilters.search) {
      const searchLower = taskFilters.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredTasks(filtered);
  };

  const handleNewTask = (date?: Date) => {
    setEditingTask(null);
    setInitialDate(date);
    setShowTaskModal(true);
  };

  const handleNewMeeting = (date?: Date) => {
    setEditingMeeting(null);
    setInitialDate(date);
    setShowMeetingModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setInitialDate(undefined);
    setShowTaskModal(true);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setInitialDate(undefined);
    setShowMeetingModal(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await TaskService.deleteTask(taskId);
        toast({
          title: "Task Deleted",
          description: "Task has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete task",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      try {
        await MeetingService.deleteMeeting(meetingId);
        toast({
          title: "Meeting Deleted",
          description: "Meeting has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete meeting",
          variant: "destructive",
        });
      }
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await TaskService.updateTaskStatus(taskId, status);
      // Real-time listener will update the UI automatically
      toast({
        title: "Status Updated",
        description: `Task status changed to ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const handleTaskProgressChange = async (taskId: string, progress: number) => {
    try {
      await TaskService.updateTaskProgress(taskId, progress);
      // Real-time listener will update the UI automatically
      toast({
        title: "Progress Updated",
        description: `Task progress updated to ${progress}%`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task progress",
        variant: "destructive",
      });
    }
  };

  const handleMeetingStatusChange = async (meetingId: string, status: MeetingStatus) => {
    try {
      await MeetingService.updateMeetingStatus(meetingId, status);
      // Real-time listener will update the UI automatically
      toast({
        title: "Meeting Status Updated",
        description: `Meeting status changed to ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update meeting status",
        variant: "destructive",
      });
    }
  };

  const handleCalendarEventClick = (event: any) => {
    if (event.type === 'task') {
      const task = event.data as Task;
      handleEditTask(task);
    } else {
      const meeting = event.data as Meeting;
      handleEditMeeting(meeting);
    }
  };

  const handleCalendarAddTask = (date: Date) => {
    handleNewTask(date);
  };

  const handleCalendarAddMeeting = (date: Date) => {
    handleNewMeeting(date);
  };

  const handleCalendarEventUpdate = () => {
    // The real-time listeners will automatically update the data
    console.log('Calendar event updated - real-time listeners will handle the update');
  };

  const clearTaskFilters = () => {
    setTaskFilters({});
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const overdue = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== TaskStatus.COMPLETED).length;
    
    return { total, completed, inProgress, overdue };
  };

  const getMeetingStats = () => {
    const total = meetings.length;
    const scheduled = meetings.filter(m => m.status === MeetingStatus.SCHEDULED).length;
    const completed = meetings.filter(m => m.status === MeetingStatus.COMPLETED).length;
    const today = meetings.filter(m => 
      new Date(m.date).toDateString() === new Date().toDateString()
    ).length;
    
    return { total, scheduled, completed, today };
  };

  const taskStats = getTaskStats();
  const meetingStats = getMeetingStats();

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your tasks and meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Tasks & Meetings</h1>
          <p className="text-muted-foreground">Manage your assigned tasks and scheduled meetings.</p>
          <p className="text-sm text-muted-foreground">Welcome, {currentUser.name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {taskStats.completed} completed, {taskStats.overdue} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetingStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {meetingStats.scheduled} scheduled, {meetingStats.today} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Tasks currently being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              Active employees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="meetings" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Meetings ({meetings.length})
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <TaskFiltersComponent
            filters={taskFilters}
            onFiltersChange={setTaskFilters}
            employees={employees}
            onClearFilters={clearTaskFilters}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.values(TaskStatus).map(status => {
              const statusTasks = filteredTasks.filter(task => task.status === status);
              return (
                <div key={status} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{status}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {statusTasks.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {statusTasks.length > 0 ? (
                      statusTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                          onStatusChange={handleTaskStatusChange}
                          onProgressChange={handleTaskProgressChange}
                          isAdmin={false}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No tasks in this stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map(meeting => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onEdit={handleEditMeeting}
                onDelete={handleDeleteMeeting}
                onStatusChange={handleMeetingStatusChange}
                isAdmin={false}
              />
            ))}
          </div>
          
          {meetings.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No meetings scheduled yet</p>
              <Button onClick={() => handleNewMeeting()} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="h-[600px]">
          <TaskCalendar
            tasks={tasks}
            meetings={meetings}
            onEventClick={handleCalendarEventClick}
            onAddTask={handleCalendarAddTask}
            onAddMeeting={handleCalendarAddMeeting}
            onEventUpdate={handleCalendarEventUpdate}
            className="h-full"
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setInitialDate(undefined);
        }}
        task={editingTask}
        employees={employees}
        onSuccess={() => {
          setShowTaskModal(false);
          setEditingTask(null);
          setInitialDate(undefined);
        }}
        initialDate={initialDate}
      />

      <MeetingModal
        isOpen={showMeetingModal}
        onClose={() => {
          setShowMeetingModal(false);
          setInitialDate(undefined);
        }}
        meeting={editingMeeting}
        users={users}
        onSuccess={() => {
          setShowMeetingModal(false);
          setEditingMeeting(null);
          setInitialDate(undefined);
        }}
        initialDate={initialDate}
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        onNewTask={() => handleNewTask()}
        onNewMeeting={() => handleNewMeeting()}
      />
    </div>
  );
}
