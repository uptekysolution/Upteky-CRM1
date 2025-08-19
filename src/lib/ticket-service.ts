import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  where,
  getDocs,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChatTicket } from '@/types/chat';

export type CreateTicketInput = {
  clientId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
};

export class TicketService {
  // Create a new support ticket for a client
  static async createTicket(input: CreateTicketInput): Promise<string> {
    const { clientId, title, description, priority, category } = input;

    if (!clientId || !title || !description) {
      throw new Error('Missing required fields to create a ticket');
    }

    const ticketsRef = collection(db, 'tickets');

    // Generate a pseudo incremental number by current epoch seconds (unique enough for UI labels)
    const ticketNumber = Math.floor(Date.now() / 1000);

    const payload = {
      clientId,
      title: title.trim(),
      description: description.trim(),
      priority: (priority || 'medium').toLowerCase(),
      status: 'open',
      category: category || 'general',
      ticketNumber,
      lastMessage: description.trim(),
      unreadByAdmin: true,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    };

    const created = await addDoc(ticketsRef, payload);
    return created.id;
  }

  // Subscribe to real-time tickets for a specific client
  static subscribeToClientTickets(
    clientId: string,
    callback: (tickets: ChatTicket[]) => void,
    options?: { pageSize?: number }
  ) {
    const { pageSize = 100 } = options || {};

    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef,
      where('clientId', '==', clientId),
      orderBy('lastUpdated', 'desc'),
      limit(pageSize)
    );

    return onSnapshot(q, (snapshot) => {
      const tickets: ChatTicket[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ticketNumber: data.ticketNumber,
          title: data.title,
          status: data.status,
          priority: data.priority,
          lastMessage: data.lastMessage,
          lastUpdated: data.lastUpdated || Timestamp.now(),
          unreadByAdmin: Boolean(data.unreadByAdmin),
          createdAt: data.createdAt || Timestamp.now(),
          clientId: data.clientId,
          category: data.category || 'general',
          description: data.description || '',
          messages: [],
        } as ChatTicket;
      });
      callback(tickets);
    });
  }

  // Fetch tickets once (non real-time) for a client
  static async getClientTickets(clientId: string, options?: { pageSize?: number }): Promise<ChatTicket[]> {
    const { pageSize = 100 } = options || {};
    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef,
      where('clientId', '==', clientId),
      orderBy('lastUpdated', 'desc'),
      limit(pageSize)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ticketNumber: data.ticketNumber,
        title: data.title,
        status: data.status,
        priority: data.priority,
        lastMessage: data.lastMessage,
        lastUpdated: data.lastUpdated || Timestamp.now(),
        unreadByAdmin: Boolean(data.unreadByAdmin),
        createdAt: data.createdAt || Timestamp.now(),
        clientId: data.clientId,
        category: data.category || 'general',
        description: data.description || '',
        messages: [],
      } as ChatTicket;
    });
  }

  static async getTicketById(ticketId: string): Promise<ChatTicket | null> {
    const ref = doc(db, 'tickets', ticketId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data: any = snap.data();
    return {
      id: snap.id,
      ticketNumber: data.ticketNumber,
      title: data.title,
      status: data.status,
      priority: data.priority,
      lastMessage: data.lastMessage,
      lastUpdated: data.lastUpdated || Timestamp.now(),
      unreadByAdmin: Boolean(data.unreadByAdmin),
      createdAt: data.createdAt || Timestamp.now(),
      clientId: data.clientId,
      category: data.category || 'general',
      description: data.description || '',
      messages: [],
    } as ChatTicket;
  }

  static async updateTicketStatus(ticketId: string, status: string): Promise<void> {
    const ref = doc(db, 'tickets', ticketId);
    await updateDoc(ref, { status, lastUpdated: serverTimestamp() });
  }

  static async updateTicketPriority(ticketId: string, priority: 'low' | 'medium' | 'high'): Promise<void> {
    const ref = doc(db, 'tickets', ticketId);
    await updateDoc(ref, { priority, lastUpdated: serverTimestamp() });
  }

  static async assignTicket(ticketId: string, assignedToUserId: string): Promise<void> {
    const ref = doc(db, 'tickets', ticketId);
    await updateDoc(ref, { assignedToUserId, lastUpdated: serverTimestamp() });
  }
}


