export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: 'client' | 'admin';
  text: string;
  createdAt: any; // Firestore timestamp
  isRead: boolean;
}

export interface TicketChat {
  id: string;
  ticketNumber: number;
  title: string;
  status: string;
  priority: string;
  lastMessage?: string;
  lastUpdated: any; // Firestore timestamp
  unreadByAdmin: boolean;
  assignedToUserId?: string;
  createdAt: any; // Firestore timestamp
}

export interface ChatTicket extends TicketChat {
  messages: ChatMessage[];
  clientId: string;
  category: string;
  description: string;
}

export interface UnreadTicket {
  ticketId: string;
  unreadByAdmin: boolean;
  lastMessage: string;
  lastUpdated: any;
}
