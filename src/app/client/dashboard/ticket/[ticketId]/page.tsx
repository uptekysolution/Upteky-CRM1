"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import { TicketService } from '@/lib/ticket-service';
import { useUserProfile } from '@/hooks/use-user-profile';

interface TicketDetail {
  id: string;
  ticketNumber: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: any;
  lastUpdated: any;
  clientId: string;
}

export default function ClientTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticketId) return;
    const load = async () => {
      try {
        setLoading(true);
        const t = await TicketService.getTicketById(ticketId);
        if (!t) {
          setTicket(null);
        } else {
          setTicket(t as any);
        }
      } catch (err) {
        console.error(err);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load ticket' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ticketId, toast]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase?.()) {
      case 'open': return 'bg-red-500';
      case 'in progress': return 'bg-blue-500';
      case 'awaiting client reply': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase?.()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-10 w-10 mx-auto text-gray-400 mb-2" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Ticket not found</h2>
        <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => router.push('/client/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">Ticket #{ticket.ticketNumber}</h1>
          <p className="text-gray-600">{ticket.title}</p>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
          <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
        </div>
      </div>

      {/* Ticket Info */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Ticket Information</CardTitle>
          <CardDescription>Details for your support request</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <p className="text-gray-600 mt-1">{ticket.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Chat Section as Client */}
      {userProfile?.id ? (
        <ChatInterface
          ticketId={ticket.id}
          currentUserId={userProfile.id}
          currentUserRole="client"
        />
      ) : (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center text-gray-500">
              <p>Please sign in to send messages.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


