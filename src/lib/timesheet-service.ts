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
      // Clean the data to remove any undefined values
      const cleanData: any = {};
      Object.keys(timesheetData).forEach(key => {
        if (timesheetData[key as keyof typeof timesheetData] !== undefined) {
          cleanData[key] = timesheetData[key as keyof typeof timesheetData];
        }
      });

      // Clean entries array
      if (cleanData.entries) {
        cleanData.entries = cleanData.entries.map((entry: any) => {
          const cleanEntry: any = {};
          Object.keys(entry).forEach(key => {
            if (entry[key] !== undefined) {
              cleanEntry[key] = entry[key];
            }
          });
          return cleanEntry;
        });
      }

      const docRef = await addDoc(collection(db, TIMESHEETS_COLLECTION), {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        weekStartDate: Timestamp.fromDate(cleanData.weekStartDate),
        weekEndDate: Timestamp.fromDate(cleanData.weekEndDate),
        entries: cleanData.entries.map((entry: any) => {
          // Clean each entry again to ensure no undefined values
          const finalCleanEntry: any = {};
          Object.keys(entry).forEach(key => {
            if (entry[key] !== undefined) {
              finalCleanEntry[key] = entry[key];
            }
          });
          
          return {
            ...finalCleanEntry,
            date: Timestamp.fromDate(entry.date)
          };
        })
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
        updatedAt: serverTimestamp()
      };

      // Only include defined values in the update
      if (updates.weekStartDate !== undefined) {
        updateData.weekStartDate = Timestamp.fromDate(updates.weekStartDate);
      }
      if (updates.weekEndDate !== undefined) {
        updateData.weekEndDate = Timestamp.fromDate(updates.weekEndDate);
      }
      if (updates.entries !== undefined) {
        updateData.entries = updates.entries.map(entry => {
          // Clean each entry to remove undefined values
          const cleanEntry: any = {};
          Object.keys(entry).forEach(key => {
            if (entry[key as keyof typeof entry] !== undefined) {
              cleanEntry[key] = entry[key as keyof typeof entry];
            }
          });
          
          return {
            ...cleanEntry,
            date: Timestamp.fromDate(cleanEntry.date)
          };
        });
      }
      if (updates.totalHours !== undefined) {
        updateData.totalHours = updates.totalHours;
      }
      if (updates.status !== undefined) {
        updateData.status = updates.status;
      }
      if (updates.submittedAt !== undefined) {
        updateData.submittedAt = updates.submittedAt ? Timestamp.fromDate(updates.submittedAt) : null;
      }
      if (updates.approvedAt !== undefined) {
        updateData.approvedAt = updates.approvedAt ? Timestamp.fromDate(updates.approvedAt) : null;
      }
      if (updates.approvedBy !== undefined) {
        updateData.approvedBy = updates.approvedBy;
      }
      if (updates.approvedByName !== undefined) {
        updateData.approvedByName = updates.approvedByName;
      }
      if (updates.rejectedAt !== undefined) {
        updateData.rejectedAt = updates.rejectedAt ? Timestamp.fromDate(updates.rejectedAt) : null;
      }
      if (updates.rejectedBy !== undefined) {
        updateData.rejectedBy = updates.rejectedBy;
      }
      if (updates.rejectedByName !== undefined) {
        updateData.rejectedByName = updates.rejectedByName;
      }
      if (updates.rejectionReason !== undefined) {
        updateData.rejectionReason = updates.rejectionReason;
      }

      // Final validation - ensure no undefined values exist
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          console.warn(`Found undefined value for field: ${key}, removing it`);
          delete updateData[key];
        }
      });

      // Log the final update data for debugging
      console.log('Updating timesheet with data:', updateData);

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
        
        // Clean the data to remove any undefined values
        const cleanData: any = {};
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined) {
            cleanData[key] = data[key];
          }
        });
        
        return {
          id: docSnap.id,
          ...cleanData,
          weekStartDate: cleanData.weekStartDate?.toDate() || new Date(),
          weekEndDate: cleanData.weekEndDate?.toDate() || new Date(),
          entries: cleanData.entries?.map((entry: any) => {
            // Clean each entry to remove undefined values
            const cleanEntry: any = {};
            Object.keys(entry).forEach(key => {
              if (entry[key] !== undefined) {
                cleanEntry[key] = entry[key];
              }
            });
            
            return {
              ...cleanEntry,
              date: cleanEntry.date?.toDate() || new Date()
            };
          }) || [],
          createdAt: cleanData.createdAt?.toDate() || new Date(),
          updatedAt: cleanData.updatedAt?.toDate() || new Date(),
          submittedAt: cleanData.submittedAt?.toDate(),
          approvedAt: cleanData.approvedAt?.toDate(),
          rejectedAt: cleanData.rejectedAt?.toDate()
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
        
        // Clean the data to remove any undefined values
        const cleanData: any = {};
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined) {
            cleanData[key] = data[key];
          }
        });
        
        return {
          id: doc.id,
          ...cleanData,
          weekStartDate: cleanData.weekStartDate?.toDate() || new Date(),
          weekEndDate: cleanData.weekEndDate?.toDate() || new Date(),
          entries: cleanData.entries?.map((entry: any) => {
            // Clean each entry to remove undefined values
            const cleanEntry: any = {};
            Object.keys(entry).forEach(key => {
              if (entry[key] !== undefined) {
                cleanEntry[key] = entry[key];
              }
            });
            
            return {
              ...cleanEntry,
              date: cleanEntry.date?.toDate() || new Date()
            };
          }) || [],
          createdAt: cleanData.createdAt?.toDate() || new Date(),
          updatedAt: cleanData.updatedAt?.toDate() || new Date(),
          submittedAt: cleanData.submittedAt?.toDate(),
          approvedAt: cleanData.approvedAt?.toDate(),
          rejectedAt: cleanData.rejectedAt?.toDate()
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
        
        // Clean the data to remove any undefined values
        const cleanData: any = {};
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined) {
            cleanData[key] = data[key];
          }
        });
        
        return {
          id: doc.id,
          ...cleanData,
          weekStartDate: cleanData.weekStartDate?.toDate() || new Date(),
          weekEndDate: cleanData.weekEndDate?.toDate() || new Date(),
          entries: cleanData.entries?.map((entry: any) => {
            // Clean each entry to remove undefined values
            const cleanEntry: any = {};
            Object.keys(entry).forEach(key => {
              if (entry[key] !== undefined) {
                cleanEntry[key] = entry[key];
              }
            });
            
            return {
              ...cleanEntry,
              date: cleanEntry.date?.toDate() || new Date()
            };
          }) || [],
          createdAt: cleanData.createdAt?.toDate() || new Date(),
          updatedAt: cleanData.updatedAt?.toDate() || new Date(),
          submittedAt: cleanData.submittedAt?.toDate(),
          approvedAt: cleanData.approvedAt?.toDate(),
          rejectedAt: cleanData.rejectedAt?.toDate()
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
      
      // Clean the data to remove any undefined values
      const cleanData: any = {};
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
          cleanData[key] = data[key];
        }
      });
      
      return {
        id: doc.id,
        ...cleanData,
        weekStartDate: cleanData.weekStartDate?.toDate() || new Date(),
        weekEndDate: cleanData.weekEndDate?.toDate() || new Date(),
        entries: cleanData.entries?.map((entry: any) => {
          // Clean each entry to remove undefined values
          const cleanEntry: any = {};
          Object.keys(entry).forEach(key => {
            if (entry[key] !== undefined) {
              cleanEntry[key] = entry[key];
            }
          });
          
          return {
            ...cleanEntry,
            date: cleanEntry.date?.toDate() || new Date()
          };
        }) || [],
        createdAt: cleanData.createdAt?.toDate() || new Date(),
        updatedAt: cleanData.updatedAt?.toDate() || new Date(),
        submittedAt: cleanData.submittedAt?.toDate(),
        approvedAt: cleanData.approvedAt?.toDate(),
        rejectedAt: cleanData.rejectedAt?.toDate()
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
        
        // Clean the data to remove any undefined values
        const cleanData: any = {};
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined) {
            cleanData[key] = data[key];
          }
        });
        
        return {
          id: doc.id,
          ...cleanData,
          weekStartDate: cleanData.weekStartDate?.toDate() || new Date(),
          weekEndDate: cleanData.weekEndDate?.toDate() || new Date(),
          entries: cleanData.entries?.map((entry: any) => {
            // Clean each entry to remove undefined values
            const cleanEntry: any = {};
            Object.keys(entry).forEach(key => {
              if (entry[key] !== undefined) {
                cleanEntry[key] = entry[key];
              }
            });
            
            return {
              ...cleanEntry,
              date: cleanEntry.date?.toDate() || new Date()
            };
          }) || [],
          createdAt: cleanData.createdAt?.toDate() || new Date(),
          updatedAt: cleanData.updatedAt?.toDate() || new Date(),
          submittedAt: cleanData.submittedAt?.toDate(),
          approvedAt: cleanData.approvedAt?.toDate(),
          rejectedAt: cleanData.rejectedAt?.toDate()
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
        
        // Clean the data to remove any undefined values
        const cleanData: any = {};
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined) {
            cleanData[key] = data[key];
          }
        });
        
        return {
          id: doc.id,
          ...cleanData,
          weekStartDate: cleanData.weekStartDate?.toDate() || new Date(),
          weekEndDate: cleanData.weekEndDate?.toDate() || new Date(),
          entries: cleanData.entries?.map((entry: any) => {
            // Clean each entry to remove undefined values
            const cleanEntry: any = {};
            Object.keys(entry).forEach(key => {
              if (entry[key] !== undefined) {
                cleanEntry[key] = entry[key];
              }
            });
            
            return {
              ...cleanEntry,
              date: cleanEntry.date?.toDate() || new Date()
            };
          }) || [],
          createdAt: cleanData.createdAt?.toDate() || new Date(),
          updatedAt: cleanData.updatedAt?.toDate() || new Date(),
          submittedAt: cleanData.submittedAt?.toDate(),
          approvedAt: cleanData.approvedAt?.toDate(),
          rejectedAt: cleanData.rejectedAt?.toDate()
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
