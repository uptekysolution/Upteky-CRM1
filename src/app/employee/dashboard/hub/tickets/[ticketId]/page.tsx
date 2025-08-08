
'use client'

import { useEffect, useState, use } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send, UserCircle, MessageSquare, PenSquare, CornerDownRight, PlusCircle } from 'lucide-react';
import Link from 'next/link';

interface Reply {
    id: string;
    authorName: string;
    message: string;
    isInternalNote: boolean;
    createdAt: { toDate: () => Date };
}

interface Ticket {
    id: string;
    ticketNumber: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    assignedToUserId: string | null;
    createdAt: { toDate: () => Date };
    replies: Reply[];
    linkedTaskId: string | null;
}

// Mock user data for assignees - in a real app this would come from your user management system
const assignableUsers = [
    { id: 'user-tl-john', name: 'John Doe' },
    { id: 'user-hr-alisha', name: 'Alisha Anand' },
    { id: 'user-admin', name: 'Admin User' },
];

export default function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params);
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  
  const fetchTicket = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/internal/crm/tickets/${ticketId}`, {
            headers: { 'X-User-Role': 'Admin' }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch ticket details');
        }
        const data = await response.json();
        // Sort replies by date, oldest first
        data.replies.sort((a: Reply, b: Reply) => new Date(a.createdAt.toDate()).getTime() - new Date(b.createdAt.toDate()).getTime());
        setTicket(data);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error fetching ticket',
          description: 'Could not load ticket data from the database.',
        });
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    if(ticketId) {
        fetchTicket();
    }
  }, [ticketId, toast]);

  const handlePostReply = async () => {
      if (!newReply.trim()) return;
      
      try {
          const response = await fetch(`/api/internal/crm/tickets/${ticketId}/replies`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'X-User-Role': 'Admin'
              },
              body: JSON.stringify({ message: newReply, isInternalNote })
          });
          if (!response.ok) {
              throw new Error('Failed to post reply');
          }
          setNewReply('');
          setIsInternalNote(false);
          await fetchTicket(); // Refresh ticket data
          toast({ title: "Reply posted successfully" });
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not post your reply.' });
      }
  };

  const handleAssignmentChange = async (userId: string) => {
      try {
           const response = await fetch(`/api/internal/crm/tickets/${ticketId}/assign`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'X-User-Role': 'Admin'
              },
              body: JSON.stringify({ assignedToUserId: userId === 'unassigned' ? null : userId })
          });
          if (!response.ok) throw new Error("Failed to assign ticket");
          await fetchTicket();
          toast({ title: "Ticket Assigned", description: `Ticket assigned to ${assignableUsers.find(u => u.id === userId)?.name || 'Unassigned'}`});
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not assign ticket.' });
      }
  }
  
  const handleConvertToTask = async () => {
      try {
          const response = await fetch(`/api/internal/crm/tickets/${ticketId}/convert-to-task`, {
              method: 'POST',
              headers: { 'X-User-Role': 'Admin' }
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to convert to task');
          }
          await fetchTicket();
          toast({ title: "Ticket Converted", description: "A new task has been created from this ticket." });
      } catch (error: any) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Conversion Failed', description: error.message });
      }
  }

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'destructive';
      case 'in progress': return 'secondary';
      case 'awaiting client reply': return 'outline';
      case 'resolved': return 'default';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    );
  }

  if (!ticket) {
    return <p>Ticket not found.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" asChild>
          <Link href="/dashboard/hub/tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Ticket Queue
          </Link>
        </Button>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            {/* Conversation Thread */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-6 w-6" />
                        <span>#{ticket.ticketNumber}: {ticket.title}</span>
                    </CardTitle>
                    <CardDescription>{ticket.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {ticket.replies.map(reply => (
                            <div key={reply.id} className={`flex gap-3 ${reply.isInternalNote ? 'rounded-md border border-amber-300 bg-amber-50 p-3' : ''}`}>
                                 <UserCircle className="h-8 w-8 text-muted-foreground flex-shrink-0 mt-1" />
                                 <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                       <p className="font-semibold">{reply.authorName}</p>
                                       <p className="text-xs text-muted-foreground">{new Date(reply.createdAt.toDate()).toLocaleString()}</p>
                                    </div>
                                    <p className="text-sm mt-1">{reply.message}</p>
                                    {reply.isInternalNote && <Badge variant="secondary" className="mt-2 bg-amber-200 text-amber-800">Internal Note</Badge>}
                                 </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Reply Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PenSquare className="h-6 w-6"/> Post a Reply</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea 
                        placeholder="Type your message here..."
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        className="min-h-[120px]"
                    />
                     <div className="flex items-center space-x-2 mt-4">
                        <Checkbox 
                            id="internal-note"
                            checked={isInternalNote}
                            onCheckedChange={(checked) => setIsInternalNote(!!checked)}
                        />
                        <Label htmlFor="internal-note" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Make this an internal note (client will not see it)
                        </Label>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handlePostReply}>
                        <Send className="mr-2 h-4 w-4" />
                        Post Reply
                    </Button>
                </CardFooter>
            </Card>
        </div>
        
        {/* Ticket Details Sidebar */}
        <Card>
            <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Status</Label>
                    <Badge variant={getStatusVariant(ticket.status)} className="w-full justify-center text-base py-1">{ticket.status}</Badge>
                </div>
                 <div>
                    <Label>Priority</Label>
                     <Select defaultValue={ticket.priority}>
                        <SelectTrigger>
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Category</Label>
                    <Input readOnly value={ticket.category}/>
                </div>
                 <div>
                    <Label>Assignee</Label>
                     <Select value={ticket.assignedToUserId || 'unassigned'} onValueChange={handleAssignmentChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Assign to a user"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {assignableUsers.map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label>Created At</Label>
                    <Input readOnly value={new Date(ticket.createdAt.toDate()).toLocaleString()}/>
                </div>
                 <div>
                    <Label>Actions</Label>
                    <Button onClick={handleConvertToTask} disabled={!!ticket.linkedTaskId} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {ticket.linkedTaskId ? 'Task Already Created' : 'Convert to Task'}
                    </Button>
                    {ticket.linkedTaskId && (
                        <p className="text-xs text-muted-foreground mt-1">Linked to Task ID: {ticket.linkedTaskId}</p>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
