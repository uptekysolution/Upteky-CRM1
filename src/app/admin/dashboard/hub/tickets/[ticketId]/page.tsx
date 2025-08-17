"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clock, User, AlertCircle, MessageCircle } from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import { ChatService } from '@/lib/chat-service';

interface Ticket {
  id: string;
  ticketNumber: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assignedToUserId: string | null;
  createdAt: any;
  lastMessage?: string;
  lastUpdated: any;
}

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState({ id: 'admin-user', name: 'Admin User' });

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
      // Mark messages as read when admin opens the ticket
      markMessagesAsRead();
    }
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/internal/crm/tickets/${ticketId}`, {
        headers: { 'X-User-Role': 'Admin' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch ticket');
      }
      
      const data = await response.json();
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load ticket details. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await ChatService.markMessagesAsRead(ticketId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleMessageSent = async () => {
    // Messages are automatically marked as read when admin opens the ticket
    // No additional action needed here
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-red-500';
      case 'in progress': return 'bg-blue-500';
      case 'awaiting client reply': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
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

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
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
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Ticket not found</h2>
        <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => router.push('/admin/dashboard/hub/tickets')}>Back to Tickets</Button>
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
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Ticket Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <p className="text-gray-600 mt-1">{ticket.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <p className="text-gray-600 mt-1">{ticket.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Created</label>
              <p className="text-gray-600 mt-1">{formatTimestamp(ticket.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Assigned To</label>
              <p className="text-gray-600 mt-1">
                {ticket.assignedToUserId ? ticket.assignedToUserId : 'Unassigned'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Last Updated</label>
              <p className="text-gray-600 mt-1">{formatTimestamp(ticket.lastUpdated)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Section */}
      {adminUser && adminUser.id ? (
        <ChatInterface
          ticketId={ticketId}
          currentUserId={adminUser.id}
          currentUserRole="admin"
          onMessageSent={handleMessageSent}
        />
      ) : (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center text-gray-500">
              <p>Loading admin user...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
