
'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, UserCircle } from 'lucide-react';

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
    status: string;
    createdAt: { toDate: () => Date };
    replies: Reply[];
}

export default function ClientTicketViewPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params);
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');

  // This should be in a single function, but for clarity:
  const fetchTicket = async () => {
      try {
        const response = await fetch(`/api/internal/crm/tickets/${ticketId}`); // Using internal API to get all replies including notes for context
        if (!response.ok) throw new Error('Failed to fetch ticket');
        const data = await response.json();
        // Sort replies and filter out internal notes for the client
        data.replies.sort((a: Reply, b: Reply) => a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime());
        data.replies = data.replies.filter((r: Reply) => !r.isInternalNote);
        setTicket(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load the ticket details.' });
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId, toast]);

  const handlePostReply = async () => {
    if (!newReply.trim()) return;
    try {
      const response = await fetch(`/api/portal/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newReply }),
      });
      if (!response.ok) throw new Error('Failed to post reply');
      setNewReply('');
      await fetchTicket(); // Refresh data
      toast({ title: 'Reply Posted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not post your reply.' });
    }
  };
  
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'destructive';
      case 'in progress': return 'secondary';
      case 'awaiting client reply': return 'default';
      case 'resolved': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!ticket) {
    return <p>Ticket not found.</p>;
  }

  return (
    <div className="space-y-4">
        <div>
            <Button variant="ghost" asChild>
            <Link href="/portal/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to My Tickets
            </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Ticket #{ticket.ticketNumber}: {ticket.title}</CardTitle>
                        <CardDescription>
                            Created on {new Date(ticket.createdAt.toDate()).toLocaleDateString()}
                        </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(ticket.status)} className="text-base py-1 px-3">{ticket.status}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="space-y-6">
                    {ticket.replies.map(reply => (
                        <div key={reply.id} className="flex gap-4">
                            <UserCircle className="h-10 w-10 text-muted-foreground flex-shrink-0 mt-1" />
                            <div className="flex-1 rounded-lg border bg-background p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-semibold">{reply.authorName}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(reply.createdAt.toDate()).toLocaleString()}</p>
                                </div>
                                <p className="text-sm">{reply.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Post a Reply</CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea 
                    placeholder="Type your message here..."
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    className="min-h-[120px]"
                />
            </CardContent>
            <CardFooter>
                <Button onClick={handlePostReply}>
                    <Send className="mr-2 h-4 w-4" />
                    Post Reply
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
