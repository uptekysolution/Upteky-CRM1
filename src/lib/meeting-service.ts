import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Meeting, MeetingStatus, MeetingFilters } from '@/types/task';

const MEETINGS_COLLECTION = 'meetings';

export class MeetingService {
  // Create a new meeting
  static async createMeeting(meetingData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, MEETINGS_COLLECTION), {
        ...meetingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        date: Timestamp.fromDate(meetingData.date)
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw new Error('Failed to create meeting');
    }
  }

  // Get all meetings (for admin)
  static async getAllMeetings(): Promise<Meeting[]> {
    try {
      const querySnapshot = await getDocs(collection(db, MEETINGS_COLLECTION));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Meeting[];
    } catch (error) {
      console.error('Error getting meetings:', error);
      throw new Error('Failed to get meetings');
    }
  }

  // Get meetings by participant (for employees)
  static async getMeetingsByParticipant(participantId: string): Promise<Meeting[]> {
    try {
      const querySnapshot = await getDocs(collection(db, MEETINGS_COLLECTION));
      const meetings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Meeting[];
      
      // Filter meetings where the user is a participant
      return meetings.filter(meeting => 
        meeting.participants.some(p => p.userId === participantId)
      );
    } catch (error) {
      console.error('Error getting meetings by participant:', error);
      throw new Error('Failed to get meetings');
    }
  }

  // Get filtered meetings
  static async getFilteredMeetings(filters: MeetingFilters): Promise<Meeting[]> {
    try {
      let q = query(collection(db, MEETINGS_COLLECTION));
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      q = query(q, orderBy('date', 'asc'));
      
      const querySnapshot = await getDocs(q);
      let meetings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Meeting[];

      // Apply additional filters in memory
      if (filters.participantId) {
        meetings = meetings.filter(meeting => 
          meeting.participants.some(p => p.userId === filters.participantId)
        );
      }

      if (filters.date) {
        meetings = meetings.filter(meeting => 
          meeting.date >= filters.date!.start && 
          meeting.date <= filters.date!.end
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        meetings = meetings.filter(meeting =>
          meeting.title.toLowerCase().includes(searchLower) ||
          meeting.agenda.toLowerCase().includes(searchLower)
        );
      }

      return meetings;
    } catch (error) {
      console.error('Error getting filtered meetings:', error);
      throw new Error('Failed to get filtered meetings');
    }
  }

  // Get a single meeting by ID
  static async getMeetingById(meetingId: string): Promise<Meeting | null> {
    try {
      const docRef = doc(db, MEETINGS_COLLECTION, meetingId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Meeting;
      }
      return null;
    } catch (error) {
      console.error('Error getting meeting:', error);
      throw new Error('Failed to get meeting');
    }
  }

  // Update a meeting
  static async updateMeeting(meetingId: string, updates: Partial<Meeting>): Promise<void> {
    try {
      const docRef = doc(db, MEETINGS_COLLECTION, meetingId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        ...(updates.date && { date: Timestamp.fromDate(updates.date) })
      });
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw new Error('Failed to update meeting');
    }
  }

  // Update meeting status
  static async updateMeetingStatus(meetingId: string, status: MeetingStatus): Promise<void> {
    try {
      const docRef = doc(db, MEETINGS_COLLECTION, meetingId);
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating meeting status:', error);
      throw new Error('Failed to update meeting status');
    }
  }

  // Mark participant as attended
  static async markParticipantAttended(meetingId: string, participantId: string, attended: boolean): Promise<void> {
    try {
      const meeting = await this.getMeetingById(meetingId);
      if (!meeting) throw new Error('Meeting not found');

      const updatedParticipants = meeting.participants.map(p => 
        p.userId === participantId ? { ...p, attended } : p
      );

      const docRef = doc(db, MEETINGS_COLLECTION, meetingId);
      await updateDoc(docRef, {
        participants: updatedParticipants,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating participant attendance:', error);
      throw new Error('Failed to update participant attendance');
    }
  }

  // Update participant response
  static async updateParticipantResponse(meetingId: string, participantId: string, response: 'accepted' | 'declined' | 'pending'): Promise<void> {
    try {
      const meeting = await this.getMeetingById(meetingId);
      if (!meeting) throw new Error('Meeting not found');

      const updatedParticipants = meeting.participants.map(p => 
        p.userId === participantId ? { ...p, response } : p
      );

      const docRef = doc(db, MEETINGS_COLLECTION, meetingId);
      await updateDoc(docRef, {
        participants: updatedParticipants,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating participant response:', error);
      throw new Error('Failed to update participant response');
    }
  }

  // Delete a meeting
  static async deleteMeeting(meetingId: string): Promise<void> {
    try {
      const docRef = doc(db, MEETINGS_COLLECTION, meetingId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw new Error('Failed to delete meeting');
    }
  }

  // Real-time listener for all meetings
  static subscribeToMeetings(callback: (meetings: Meeting[]) => void) {
    const q = query(collection(db, MEETINGS_COLLECTION), orderBy('date', 'asc'));
    return onSnapshot(q, (querySnapshot) => {
      const meetings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Meeting[];
      callback(meetings);
    });
  }

  // Real-time listener for meetings by participant
  static subscribeToMeetingsByParticipant(participantId: string, callback: (meetings: Meeting[]) => void) {
    const q = query(collection(db, MEETINGS_COLLECTION), orderBy('date', 'asc'));
    return onSnapshot(q, (querySnapshot) => {
      const meetings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Meeting[];
      
      // Filter meetings where the user is a participant
      const filteredMeetings = meetings.filter(meeting => 
        meeting.participants.some(p => p.userId === participantId)
      );
      callback(filteredMeetings);
    });
  }
}
