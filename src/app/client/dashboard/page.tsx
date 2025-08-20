
"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  FileText, 
  Calendar, 
  Users, 
  Clock,
  Bell,
  CheckCircle,
  AlertCircle,
  MessageCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TicketService } from "@/lib/ticket-service";
import { ChatTicket } from "@/types/chat";
import { Project, ProjectService } from "@/lib/project-service";
import { ActivityLog, ActivityService } from "@/lib/activity-service";
import { Task } from "@/types/task";
import { TaskService } from "@/lib/task-service";
import TasksList from "@/components/ClientDashboard/TasksList";

export default function ClientDashboardPage() {
  const router = useRouter();
  const { userProfile } = useUserProfile();
  const { toast } = useToast();

  // State for filters and search
  const [projectSearch, setProjectSearch] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("all");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [showNotifications, setShowNotifications] = useState(false);

  // Real data from Firebase
  useEffect(() => {
    if (!userProfile?.id) {
      return;
    }

    const unsubscribe = TicketService.subscribeToClientTickets(
      userProfile.id,
      (clientTickets) => {
        setTickets(clientTickets);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userProfile?.id]);
  const [tickets, setTickets] = useState<ChatTicket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Real projects
  useEffect(() => {
    if (!userProfile?.id) return;
    const unsubscribe = ProjectService.subscribeToClientProjects(userProfile.id, setProjects);
    return () => unsubscribe();
  }, [userProfile?.id]);

  // Real activities
  useEffect(() => {
    if (!userProfile?.id) return;
    const unsubscribe = ActivityService.subscribeToClientActivities(userProfile.id, setActivities);
    return () => unsubscribe();
  }, [userProfile?.id]);

  // Real tasks for this client's projects
  useEffect(() => {
    if (!userProfile?.id) return;
    const unsubscribe = TaskService.subscribeToTasksByClient(userProfile.id, setTasks);
    return () => unsubscribe();
  }, [userProfile?.id]);

  const displayCompanyName = useMemo(() => {
    const explicitName = (userProfile?.companyName || '').trim();
    if (explicitName) return explicitName;
    const email = userProfile?.email || '';
    if (email.includes('@')) {
      const domainPart = email.split('@')[1] || '';
      const companyPart = (domainPart.split('.')[0] || '').trim();
      if (companyPart) return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
    }
    return 'Client';
  }, [userProfile?.companyName, userProfile?.email]);

  const companyTitle = useMemo(() => {
    return `${displayCompanyName} Dashboard`;
  }, [displayCompanyName]);

  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    (project.name || '').toLowerCase().includes(projectSearch.toLowerCase())
  );

  // Filter tickets based on search and filters
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                         `#${ticket.ticketNumber}`.toLowerCase().includes(ticketSearch.toLowerCase());
    const matchesPriority = ticketPriorityFilter === "all" || ticket.priority.toLowerCase() === ticketPriorityFilter;
    const matchesStatus = ticketStatusFilter === "all" || ticket.status.toLowerCase() === ticketStatusFilter;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-blue-500';
      case 'planning': return 'bg-orange-500';
      case 'completed': return 'bg-green-500';
      case 'on hold': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project': return <FileText className="h-4 w-4" />;
      case 'ticket': return <AlertCircle className="h-4 w-4" />;
      case 'document': return <Upload className="h-4 w-4" />;
      case 'milestone': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'project': return 'bg-blue-500';
      case 'ticket': return 'bg-red-500';
      case 'document': return 'bg-green-500';
      case 'milestone': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:hidden">
        <h2 className="text-xl font-semibold text-black">{companyTitle}</h2>
      </div>

      {/* Header with Notifications */}
      <div className="flex items-center justify-between">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome! {displayCompanyName}</h1>
          <p className="text-gray-600 mt-1">This dashboard gives you a quick overview of projects, tickets, and progress so you can stay on track.</p>
        </div>
        
        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {tickets.some(t => t.unreadByAdmin) && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          )}
        </Button>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tickets.filter(t => t.unreadByAdmin).map(ticket => (
                <div key={ticket.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <MessageCircle className="h-4 w-4 text-orange-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New message in #{ticket.ticketNumber}</p>
                    <p className="text-xs text-gray-600">{ticket.title}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/client/dashboard/ticket/${ticket.id}`)}
                  >
                    View
                  </Button>
                </div>
              ))}
              {tickets.filter(t => t.unreadByAdmin).length === 0 && (
                <p className="text-gray-500 text-center py-4">No new notifications</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="w-full justify-start rounded-2xl bg-gray-50 p-2">
          <TabsTrigger value="dashboard" className="transition-all duration-200 data-[state=active]:bg-[#F7931E] data-[state=active]:text-white hover:text-orange-500">Dashboard</TabsTrigger>
          <TabsTrigger value="projects" className="transition-all duration-200 data-[state=active]:bg-[#F7931E] data-[state=active]:text-white hover:text-orange-500">Project Management</TabsTrigger>
          <TabsTrigger value="tickets" className="transition-all duration-200 data-[state=active]:bg-[#F7931E] data-[state=active]:text-white hover:text-orange-500">Ticket System</TabsTrigger>
          <TabsTrigger value="tasks" className="transition-all duration-200 data-[state=active]:bg-[#F7931E] data-[state=active]:text-white hover:text-orange-500">Project Tasks</TabsTrigger>
          <TabsTrigger value="activity" className="transition-all duration-200 data-[state=active]:bg-[#F7931E] data-[state=active]:text-white hover:text-orange-500">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4 space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-2xl shadow-sm transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Projects Assigned</CardTitle>
                <CardDescription>Active Projects</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-semibold text-black">{projects.length}</div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Open Tickets</CardTitle>
                <CardDescription>By priority</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-semibold text-black">{tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length}</div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Badge className="bg-red-500">High</Badge>
                  <Badge className="bg-orange-500">Medium</Badge>
                  <Badge variant="outline" className="text-gray-600 border-gray-200">Low</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Upcoming Deadlines</CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-semibold text-black">5</div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Tasks Completed This Month</CardTitle>
                <CardDescription>Efficiency</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-600">72%</span>
                  <span className="text-gray-400">Goal 80%</span>
                </div>
                <Progress value={72} className="h-2 bg-gray-100" />
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="projects" className="mt-4 space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search projects..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => router.push('/client/dashboard/new-ticket')} className="bg-[#F7931E] hover:bg-[#E6851A]">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>

          {/* Projects Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {project.assignedTeam}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Deadline: {project.deadline?.toDate ? project.deadline.toDate().toLocaleDateString() : 'N/A'}</span>
                  </div>

                  {/* Milestones preview moved to project page to keep this list light */}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => router.push(`/client/dashboard/project/${project.id}`)}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/client/dashboard/project/${project.id}/documents`)}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="mt-4 space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tickets by ID or title..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={ticketPriorityFilter} onValueChange={setTicketPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ticketStatusFilter} onValueChange={setTicketStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => router.push('/client/dashboard/new-ticket')} className="bg-[#F7931E] hover:bg-[#E6851A]">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>

          {/* Tickets Table */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow 
                      key={ticket.id}
                      className="hover:bg-orange-50 transition-all duration-200 cursor-pointer"
                      onClick={() => router.push(`/client/dashboard/ticket/${ticket.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          #{ticket.ticketNumber}
                          {ticket.unreadByAdmin && (
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{ticket.title}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {ticket.lastUpdated?.toDate ? 
                          ticket.lastUpdated.toDate().toLocaleDateString() : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/client/dashboard/ticket/${ticket.id}`);
                            }}
                          >
                            View
                          </Button>
                          {ticket.unreadByAdmin && (
                            <Badge variant="destructive" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredTickets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No tickets found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4 space-y-6">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)} text-white`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{activity.action}</p>
                        <span className="text-xs text-gray-500">{(activity as any).timestamp?.toDate ? (activity as any).timestamp.toDate().toLocaleString() : 'N/A'}</span>
                      </div>
                      <p className="text-sm text-gray-600">{(activity as any).details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4 space-y-6">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Tasks across your projects</CardDescription>
            </CardHeader>
            <CardContent>
              <TasksList tasks={tasks} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
