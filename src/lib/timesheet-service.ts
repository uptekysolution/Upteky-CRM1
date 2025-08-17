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
import { Timesheet, TimesheetEntry, TimesheetStatus, TimesheetFilters, Project } from '@/types/timesheet';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns';

const TIMESHEETS_COLLECTION = 'timesheets';
const PROJECTS_COLLECTION = 'projects';

export class TimesheetService {
  // Create a new timesheet
  static async createTimesheet(timesheetData: Omit<Timesheet, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, TIMESHEETS_COLLECTION), {
        ...timesheetData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        weekStartDate: Timestamp.fromDate(timesheetData.weekStartDate),
        weekEndDate: Timestamp.fromDate(timesheetData.weekEndDate),
        entries: timesheetData.entries.map(entry => ({
          ...entry,
          date: Timestamp.fromDate(entry.date)
        }))
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating timesheet:', error);
      throw new Error('Failed to create timesheet');
    }
  }

  // Update a timesheet
  static async updateTimesheet(timesheetId: string, updates: Partial<Timesheet>): Promise<void> {
    try {
      const docRef = doc(db, TIMESHEETS_COLLECTION, timesheetId);
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      if (updates.weekStartDate) {
        updateData.weekStartDate = Timestamp.fromDate(updates.weekStartDate);
      }
      if (updates.weekEndDate) {
        updateData.weekEndDate = Timestamp.fromDate(updates.weekEndDate);
      }
      if (updates.entries) {
        updateData.entries = updates.entries.map(entry => ({
          ...entry,
          date: Timestamp.fromDate(entry.date)
        }));
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating timesheet:', error);
      throw new Error('Failed to update timesheet');
    }
  }

  // Get timesheet by ID
  static async getTimesheetById(timesheetId: string): Promise<Timesheet | null> {
    try {
      const docRef = doc(db, TIMESHEETS_COLLECTION, timesheetId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          weekStartDate: data.weekStartDate?.toDate() || new Date(),
          weekEndDate: data.weekEndDate?.toDate() || new Date(),
          entries: data.entries?.map((entry: any) => ({
            ...entry,
            date: entry.date?.toDate() || new Date()
          })) || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          submittedAt: data.submittedAt?.toDate(),
          approvedAt: data.approvedAt?.toDate(),
          rejectedAt: data.rejectedAt?.toDate()
        } as Timesheet;
      }
      return null;
    } catch (error) {
      console.error('Error getting timesheet:', error);
      throw new Error('Failed to get timesheet');
    }
  }

  // Get timesheets by employee
  static async getTimesheetsByEmployee(employeeId: string): Promise<Timesheet[]> {
    try {
      const q = query(
        collection(db, TIMESHEETS_COLLECTION),
        where('employeeId', '==', employeeId),
        orderBy('weekStartDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          weekStartDate: data.weekStartDate?.toDate() || new Date(),
          weekEndDate: data.weekEndDate?.toDate() || new Date(),
          entries: data.entries?.map((entry: any) => ({
            ...entry,
            date: entry.date?.toDate() || new Date()
          })) || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          submittedAt: data.submittedAt?.toDate(),
          approvedAt: data.approvedAt?.toDate(),
          rejectedAt: data.rejectedAt?.toDate()
        } as Timesheet;
      });
    } catch (error) {
      console.error('Error getting timesheets by employee:', error);
      throw new Error('Failed to get timesheets');
    }
  }

  // Get all timesheets (for admin)
  static async getAllTimesheets(): Promise<Timesheet[]> {
    try {
      const q = query(
        collection(db, TIMESHEETS_COLLECTION),
        orderBy('weekStartDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          weekStartDate: data.weekStartDate?.toDate() || new Date(),
          weekEndDate: data.weekEndDate?.toDate() || new Date(),
          entries: data.entries?.map((entry: any) => ({
            ...entry,
            date: entry.date?.toDate() || new Date()
          })) || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          submittedAt: data.submittedAt?.toDate(),
          approvedAt: data.approvedAt?.toDate(),
          rejectedAt: data.rejectedAt?.toDate()
        } as Timesheet;
      });
    } catch (error) {
      console.error('Error getting all timesheets:', error);
      throw new Error('Failed to get timesheets');
    }
  }

  // Get timesheet for current week
  static async getCurrentWeekTimesheet(employeeId: string): Promise<Timesheet | null> {
    try {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

      const q = query(
        collection(db, TIMESHEETS_COLLECTION),
        where('employeeId', '==', employeeId),
        where('weekStartDate', '==', Timestamp.fromDate(weekStart))
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        weekStartDate: data.weekStartDate?.toDate() || new Date(),
        weekEndDate: data.weekEndDate?.toDate() || new Date(),
        entries: data.entries?.map((entry: any) => ({
          ...entry,
          date: entry.date?.toDate() || new Date()
        })) || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        submittedAt: data.submittedAt?.toDate(),
        approvedAt: data.approvedAt?.toDate(),
        rejectedAt: data.rejectedAt?.toDate()
      } as Timesheet;
    } catch (error) {
      console.error('Error getting current week timesheet:', error);
      throw new Error('Failed to get current week timesheet');
    }
  }

  // Submit timesheet
  static async submitTimesheet(timesheetId: string): Promise<void> {
    try {
      const docRef = doc(db, TIMESHEETS_COLLECTION, timesheetId);
      await updateDoc(docRef, {
        status: TimesheetStatus.SUBMITTED,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      throw new Error('Failed to submit timesheet');
    }
  }

  // Approve timesheet
  static async approveTimesheet(timesheetId: string, approvedBy: string, approvedByName: string): Promise<void> {
    try {
      const docRef = doc(db, TIMESHEETS_COLLECTION, timesheetId);
      await updateDoc(docRef, {
        status: TimesheetStatus.APPROVED,
        approvedAt: serverTimestamp(),
        approvedBy,
        approvedByName,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error approving timesheet:', error);
      throw new Error('Failed to approve timesheet');
    }
  }

  // Reject timesheet
  static async rejectTimesheet(timesheetId: string, rejectedBy: string, rejectedByName: string, rejectionReason: string): Promise<void> {
    try {
      const docRef = doc(db, TIMESHEETS_COLLECTION, timesheetId);
      await updateDoc(docRef, {
        status: TimesheetStatus.REJECTED,
        rejectedAt: serverTimestamp(),
        rejectedBy,
        rejectedByName,
        rejectionReason,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      throw new Error('Failed to reject timesheet');
    }
  }

  // Delete timesheet
  static async deleteTimesheet(timesheetId: string): Promise<void> {
    try {
      const docRef = doc(db, TIMESHEETS_COLLECTION, timesheetId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      throw new Error('Failed to delete timesheet');
    }
  }

  // Real-time listener for employee timesheets
  static subscribeToEmployeeTimesheets(employeeId: string, callback: (timesheets: Timesheet[]) => void) {
    const q = query(
      collection(db, TIMESHEETS_COLLECTION),
      where('employeeId', '==', employeeId),
      orderBy('weekStartDate', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const timesheets = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          weekStartDate: data.weekStartDate?.toDate() || new Date(),
          weekEndDate: data.weekEndDate?.toDate() || new Date(),
          entries: data.entries?.map((entry: any) => ({
            ...entry,
            date: entry.date?.toDate() || new Date()
          })) || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          submittedAt: data.submittedAt?.toDate(),
          approvedAt: data.approvedAt?.toDate(),
          rejectedAt: data.rejectedAt?.toDate()
        } as Timesheet;
      });
      callback(timesheets);
    });
  }

  // Real-time listener for all timesheets (admin)
  static subscribeToAllTimesheets(callback: (timesheets: Timesheet[]) => void) {
    const q = query(
      collection(db, TIMESHEETS_COLLECTION),
      orderBy('weekStartDate', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const timesheets = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          weekStartDate: data.weekStartDate?.toDate() || new Date(),
          weekEndDate: data.weekEndDate?.toDate() || new Date(),
          entries: data.entries?.map((entry: any) => ({
            ...entry,
            date: entry.date?.toDate() || new Date()
          })) || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          submittedAt: data.submittedAt?.toDate(),
          approvedAt: data.approvedAt?.toDate(),
          rejectedAt: data.rejectedAt?.toDate()
        } as Timesheet;
      });
      callback(timesheets);
    });
  }

  // Project management
  static async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
        ...projectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  }

  static async getProjects(): Promise<Project[]> {
    try {
      const q = query(
        collection(db, PROJECTS_COLLECTION),
        where('isActive', '==', true),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Project[];
    } catch (error) {
      console.error('Error getting projects:', error);
      throw new Error('Failed to get projects');
    }
  }

  // Utility functions
  static getWeekDates(date: Date = new Date()) {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
    return { weekStart, weekEnd };
  }

  static calculateTotalHours(entries: TimesheetEntry[]): number {
    return entries.reduce((total, entry) => total + entry.hours, 0);
  }

  static generateWeekDays(weekStart: Date): Date[] {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  }
}
