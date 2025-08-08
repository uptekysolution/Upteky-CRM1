
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
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

interface Ticket {
  id: string;
  ticketNumber: number;
  title: string;
  status: string;
  priority: string;
  createdAt: {
    toDate: () => Date;
  };
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/portal/tickets');
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
          description: 'Could not load your support tickets.',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [toast]);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'destructive';
      case 'in progress': return 'secondary';
      case 'awaiting client reply': return 'default';
      case 'resolved': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>My Support Tickets</CardTitle>
                <CardDescription>View your support requests and their current status.</CardDescription>
            </div>
            <Link href="/portal/tickets/new">
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Submit New Ticket
                </Button>
            </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket #</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                </TableRow>
              ))
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  You have not submitted any tickets yet.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} onClick={() => router.push(`/portal/tickets/${ticket.id}`)} className="cursor-pointer">
                  <TableCell className="font-mono">#{ticket.ticketNumber}</TableCell>
                  <TableCell className="font-medium">{ticket.title}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.createdAt.toDate()).toLocaleString()}
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
