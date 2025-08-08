
'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Ticket {
  id: string;
  ticketNumber: number;
  title: string;
  status: string;
  priority: string;
  assignedToUserId: string | null;
  createdAt: {
    toDate: () => Date;
  } | Date;
}

// Mock user data for assignees - in a real app this would come from your user management system
const assignableUsers = [
    { id: 'user-tl-john', name: 'John Doe' },
    { id: 'user-hr-alisha', name: 'Alisha Anand' },
    { id: 'user-admin', name: 'Admin User' },
];

export default function TicketQueuePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
      status: '',
      priority: '',
      assignee: ''
  });

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.assignee) params.append('assignee', filters.assignee);
        
        const response = await fetch(`/api/internal/crm/tickets?${params.toString()}`, {
            headers: { 'X-User-Role': 'Admin' } // Assuming Admin to view all
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }
        const data = await response.json();
        setTickets(data);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error fetching tickets',
          description: 'Could not load ticket data from the database.',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [toast, filters]);
  
  const handleFilterChange = (filterName: string, value: string) => {
      setFilters(prev => ({ ...prev, [filterName]: value === 'all' ? '' : value }));
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'destructive';
      case 'in progress': return 'secondary';
      case 'awaiting client reply': return 'outline';
      case 'resolved': return 'default';
      default: return 'secondary';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };
  
  const getAssigneeName = (userId: string | null) => {
      if (!userId) return 'Unassigned';
      return assignableUsers.find(u => u.id === userId)?.name || 'Unknown User';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Ticket Queue</CardTitle>
        <CardDescription>Manage all incoming client support tickets.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
            <Select onValueChange={(v) => handleFilterChange('status', v)} defaultValue="all">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Awaiting Client Reply">Awaiting Client Reply</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
            </Select>
            <Select onValueChange={(v) => handleFilterChange('priority', v)} defaultValue="all">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Priority" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
            </Select>
             <Select onValueChange={(v) => handleFilterChange('assignee', v)} defaultValue="all">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Assignee" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {assignableUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket #</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                </TableRow>
              ))
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No tickets found matching the current filters.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} onClick={() => router.push(`/dashboard/hub/tickets/${ticket.id}`)} className="cursor-pointer">
                  <TableCell className="font-mono">#{ticket.ticketNumber}</TableCell>
                  <TableCell className="font-medium">{ticket.title}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge>
                  </TableCell>
                  <TableCell>{getAssigneeName(ticket.assignedToUserId)}</TableCell>
                  <TableCell>
                    {ticket.createdAt?.toDate ? 
                      new Date(ticket.createdAt.toDate()).toLocaleString() :
                      new Date(ticket.createdAt).toLocaleString()
                    }
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
