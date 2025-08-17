import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  where,
  getDocs,
  Timestamp,
  writeBatch,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { ChatMessage, TicketChat, ChatTicket } from '@/types/chat';

export class ChatService {
  // Send a message to a ticket
  static async sendMessage(
    ticketId: string,
    senderId: string,
    senderRole: 'client' | 'admin',
    text: string
  ): Promise<void> {
    // Validate required fields
    if (!ticketId || !senderId || !text.trim()) {
      throw new Error('Missing required fields: ticketId, senderId, or text');
    }

    try {
      // Add message to messages subcollection
      const messageData: Omit<ChatMessage, 'id' | 'createdAt'> = {
        senderId,
        senderRole,
        text: text.trim(),
        isRead: false
      };

      await addDoc(
        collection(db, 'tickets', ticketId, 'messages'),
        {
          ...messageData,
          createdAt: serverTimestamp()
        }
      );

      // Update parent ticket document
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, {
        lastMessage: text.trim(),
        lastUpdated: serverTimestamp(),
        unreadByAdmin: senderRole === 'client' // Set unread when client sends message
      });

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Listen to messages for a specific ticket with pagination
  static subscribeToTicketMessages(
    ticketId: string,
    callback: (messages: ChatMessage[]) => void,
    pageSize: number = 50
  ) {
    const messagesRef = collection(db, 'tickets', ticketId, 'messages');
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'), // Most recent first for pagination
      limit(pageSize)
    );

    return onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now()
        } as ChatMessage);
      });
      // Reverse to show oldest first in UI
      callback(messages.reverse());
    });
  }

  // Load more messages (for pagination)
  static async loadMoreMessages(
    ticketId: string,
    lastMessage: QueryDocumentSnapshot,
    pageSize: number = 20
  ): Promise<ChatMessage[]> {
    try {
      const messagesRef = collection(db, 'tickets', ticketId, 'messages');
      const q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastMessage),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now()
        } as ChatMessage);
      });

      return messages.reverse(); // Return oldest first
    } catch (error) {
      console.error('Error loading more messages:', error);
      return [];
    }
  }

  // Listen to all tickets with unread messages (for admin)
  static subscribeToUnreadTickets(
    callback: (tickets: TicketChat[]) => void
  ) {
    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef,
      where('status', 'in', ['open', 'awaiting client reply', 'in progress']),
      orderBy('lastUpdated', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const tickets: TicketChat[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tickets.push({
          id: doc.id,
          ...data,
          lastUpdated: data.lastUpdated || Timestamp.now(),
          createdAt: data.createdAt || Timestamp.now(),
          unreadByAdmin: data.unreadByAdmin || false
        } as TicketChat);
      });
      callback(tickets);
    });
  }

  // Mark messages as read for a specific ticket (admin only)
  static async markMessagesAsRead(ticketId: string): Promise<void> {
    try {
      const messagesRef = collection(db, 'tickets', ticketId, 'messages');
      const q = query(
        messagesRef,
        where('senderRole', '==', 'client'),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      // Mark all unread client messages as read
      snapshot.forEach((doc) => {
        batch.update(doc.ref, { isRead: true });
      });

      // Mark ticket as read by admin
      const ticketRef = doc(db, 'tickets', ticketId);
      batch.update(ticketRef, { unreadByAdmin: false });

      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Get unread count for a specific ticket
  static async getUnreadCount(ticketId: string): Promise<number> {
    try {
      const messagesRef = collection(db, 'tickets', ticketId, 'messages');
      const q = query(
        messagesRef,
        where('senderRole', '==', 'client'),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Get all tickets with unread messages for admin dashboard
  static async getTicketsWithUnreadMessages(): Promise<TicketChat[]> {
    try {
      const ticketsRef = collection(db, 'tickets');
      const q = query(
        ticketsRef,
        where('status', 'in', ['open', 'awaiting client reply', 'in progress'])
      );

      const snapshot = await getDocs(q);
      const tickets: TicketChat[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        tickets.push({
          id: doc.id,
          ...data,
          unreadByAdmin: data.unreadByAdmin || false,
          lastUpdated: data.lastUpdated || Timestamp.now(),
          createdAt: data.createdAt || Timestamp.now()
        } as TicketChat);
      }

      return tickets.sort((a, b) =>
        (b.lastUpdated?.toMillis?.() || b.lastUpdated) - (a.lastUpdated?.toMillis?.() || a.lastUpdated)
      );
    } catch (error) {
      console.error('Error getting tickets with unread messages:', error);
      return [];
    }
  }
}
