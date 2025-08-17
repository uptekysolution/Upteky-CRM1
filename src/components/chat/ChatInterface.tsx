"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, User, Shield, MessageCircle, ChevronUp } from 'lucide-react';
import { ChatMessage } from '@/types/chat';
import { ChatService } from '@/lib/chat-service';

interface ChatInterfaceProps {
  ticketId: string;
  currentUserId: string;
  currentUserRole: 'client' | 'admin';
  onMessageSent?: () => void;
}

export default function ChatInterface({
  ticketId,
  currentUserId,
  currentUserRole,
  onMessageSent
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (ticketId) {
      const unsubscribe = ChatService.subscribeToTicketMessages(ticketId, (messages) => {
        setMessages(messages);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [ticketId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    // Validate required fields
    if (!currentUserId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User information is missing. Please refresh the page.'
      });
      return;
    }

    setSending(true);
    try {
      await ChatService.sendMessage(
        ticketId,
        currentUserId,
        currentUserRole,
        newMessage.trim()
      );

      setNewMessage('');
      onMessageSent?.();
      toast({ title: 'Message sent successfully' });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not send message. Please try again.'
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: ChatMessage) => {
    return message.senderId === currentUserId;
  };

  // Early return if required props are missing
  if (!ticketId || !currentUserId) {
    return (
      <Card className="h-[500px] md:h-[600px] max-h-[70vh] md:max-h-[80vh] overflow-hidden">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <p>Missing required information</p>
            <p className="text-sm mt-1">
              {!ticketId && 'Ticket ID is missing. '}
              {!currentUserId && 'User ID is missing. '}
            </p>
            <p className="text-xs mt-2">Please refresh the page or contact support.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-[500px] md:h-[600px] max-h-[70vh] md:max-h-[80vh] overflow-hidden">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading messages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] md:h-[600px] flex flex-col max-h-[70vh] md:max-h-[80vh] overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Conversation
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {/* Load More Button */}
          {hasMoreMessages && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // TODO: Implement load more functionality
                  console.log('Load more messages');
                }}
                disabled={loadingMore}
                className="text-xs"
              >
                {loadingMore ? 'Loading...' : 'Load More Messages'}
              </Button>
            </div>
          )}

          <div ref={messagesTopRef} />
          
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    isOwnMessage(message)
                      ? 'bg-[#F7931E] text-white' // Upteky accent color
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.senderRole === 'admin' ? (
                      <Shield className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    <span className="text-xs font-medium">
                      {message.senderRole === 'admin' ? 'Admin' : 'Client'}
                    </span>
                    {message.senderRole === 'admin' && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{message.text}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {formatTimestamp(message.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={sending || !newMessage.trim()}
              size="icon"
              className="bg-[#F7931E] hover:bg-[#E6851A] text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
