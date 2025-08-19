
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

interface Project {
  id: string;
  name: string;
  progress: number;
  deadline: string;
  status: string;
  assignedTeam: string;
  milestones: Milestone[];
  documents: Document[];
}

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  progress: number;
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface Activity {
  id: string;
  type: 'project' | 'ticket' | 'document' | 'milestone';
  action: string;
  timestamp: string;
  user: string;
  details: string;
}

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
  const [projects] = useState<Project[]>([
    {
      id: "proj-phoenix",
      name: "Project Phoenix",
      progress: 75,
      deadline: "Aug 22, 2025",
      status: "Active",
      assignedTeam: "Team Phoenix",
      milestones: [
        { id: "1", title: "Design Phase", dueDate: "Jul 15, 2025", completed: true, progress: 100 },
        { id: "2", title: "Development Phase", dueDate: "Aug 10, 2025", completed: false, progress: 60 },
        { id: "3", title: "Testing Phase", dueDate: "Aug 20, 2025", completed: false, progress: 0 }
      ],
      documents: [
        { id: "1", name: "Project Brief.pdf", type: "PDF", uploadedAt: "2 days ago", uploadedBy: "Admin" },
        { id: "2", name: "Design Mockups.zip", type: "ZIP", uploadedAt: "1 day ago", uploadedBy: "Design Team" }
      ]
    },
    {
      id: "proj-q3-marketing",
      name: "Q3 Marketing Campaign",
      progress: 30,
      deadline: "Sep 10, 2025",
      status: "Planning",
      assignedTeam: "Marketing Team",
      milestones: [
        { id: "1", title: "Strategy Planning", dueDate: "Jul 20, 2025", completed: true, progress: 100 },
        { id: "2", title: "Content Creation", dueDate: "Aug 15, 2025", completed: false, progress: 40 },
        { id: "3", title: "Campaign Launch", dueDate: "Sep 1, 2025", completed: false, progress: 0 }
      ],
      documents: [
        { id: "1", name: "Marketing Strategy.docx", type: "DOCX", uploadedAt: "3 days ago", uploadedBy: "Marketing Lead" }
      ]
    }
  ]);

  // Mock activities for now - will be replaced with real data later
  const [activities] = useState<Activity[]>([
    {
      id: "1",
      type: "ticket",
      action: "Priority updated",
      timestamp: "Just now",
      user: "Admin",
      details: "Ticket #1001 priority updated to High"
    },
    {
      id: "2",
      type: "document",
      action: "File uploaded",
      timestamp: "1 hour ago",
      user: "Design Team",
      details: "File 'brand-guidelines.pdf' uploaded to Project Phoenix"
    },
    {
      id: "3",
      type: "milestone",
      action: "Milestone completed",
      timestamp: "Yesterday",
      user: "Team Phoenix",
      details: "Milestone 'Design Phase' marked as completed"
    },
    {
      id: "4",
      type: "project",
      action: "Project updated",
      timestamp: "2 days ago",
      user: "Admin",
      details: "Project 'Q3 Marketing Campaign' status changed to Planning"
    }
  ]);

  const companyTitle = useMemo(() => {
    const name = userProfile?.companyName || "Company";
    return `${name} Dashboard`;
  }, [userProfile?.companyName]);

  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(projectSearch.toLowerCase())
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
          <h1 className="text-2xl font-semibold text-gray-900">Welcome! {userProfile?.companyName || "Company"}</h1>
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
          <TabsTrigger value="projects" className="transition-all duration-200 data-[state=active]:bg-[#F7931E] data-[state=active]:text-white hover:text-orange-500">Project Details</TabsTrigger>
          <TabsTrigger value="tickets" className="transition-all duration-200 data-[state=active]:bg-[#F7931E] data-[state=active]:text-white hover:text-orange-500">Ticket System</TabsTrigger>
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
                    <span>Deadline: {project.deadline}</span>
                  </div>

                  {/* Milestones */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Milestones</h4>
                    <div className="space-y-2">
                      {project.milestones.slice(0, 3).map((milestone) => (
                        <div key={milestone.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${milestone.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className={milestone.completed ? 'line-through text-gray-500' : ''}>
                              {milestone.title}
                            </span>
                          </div>
                          <span className="text-gray-500">{milestone.dueDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Shared Documents</h4>
                    <div className="space-y-1">
                      {project.documents.slice(0, 2).map((doc) => (
                        <div key={doc.id} className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span>{doc.name}</span>
                        </div>
                      ))}
                      {project.documents.length > 2 && (
                        <p className="text-xs text-gray-500">+{project.documents.length - 2} more documents</p>
                      )}
                    </div>
                  </div>

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
                        <span className="text-xs text-gray-500">{activity.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-600">{activity.details}</p>
                      <p className="text-xs text-gray-500 mt-1">by {activity.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
