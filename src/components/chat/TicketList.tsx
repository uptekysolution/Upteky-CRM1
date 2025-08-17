"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Clock, AlertCircle, User } from 'lucide-react';
import { TicketChat } from '@/types/chat';
import { ChatService } from '@/lib/chat-service';

interface TicketListProps {
  onTicketSelect?: (ticketId: string) => void;
}

export default function TicketList({ onTicketSelect }: TicketListProps) {
  const [tickets, setTickets] = useState<TicketChat[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = ChatService.subscribeToUnreadTickets((tickets) => {
      setTickets(tickets);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleTicketClick = (ticketId: string) => {
    onTicketSelect?.(ticketId);
    router.push(`/admin/dashboard/hub/tickets/${ticketId}`);
  };

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

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Support Ticket Queue</CardTitle>
          <CardDescription>Loading tickets...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Support Ticket Queue
          {tickets.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {tickets.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Real-time updates for all active support tickets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No active tickets at the moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleTicketClick(ticket.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(ticket.status)}>
                      {ticket.status}
                    </Badge>
                    <Badge variant={getPriorityVariant(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    {ticket.unreadByAdmin && (
                      <Badge variant="destructive" className="ml-2">
                        New Message
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(ticket.lastUpdated)}
                  </div>
                </div>

                <h3 className="font-medium text-gray-900 mb-1">
                  #{ticket.ticketNumber} - {ticket.title}
                </h3>

                {ticket.lastMessage && (
                  <div className="flex items-start gap-2 mb-2">
                    <MessageCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600 flex-1">
                      {truncateMessage(ticket.lastMessage)}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created: {formatTimestamp(ticket.createdAt)}</span>
                  {ticket.assignedToUserId && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Assigned
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
