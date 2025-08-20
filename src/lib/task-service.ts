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
import { Task, TaskStatus, TaskPriority, TaskFilters } from '@/types/task';

const TASKS_COLLECTION = 'tasks';

export class TaskService {
  // Create a new task
  static async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deadline: Timestamp.fromDate(taskData.deadline),
        progress: taskData.progress || 0
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }

  // Get all tasks (for admin)
  static async getAllTasks(): Promise<Task[]> {
    try {
      const querySnapshot = await getDocs(collection(db, TASKS_COLLECTION));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Task[];
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw new Error('Failed to get tasks');
    }
  }

  // Get tasks by assignee (for employees)
  static async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, TASKS_COLLECTION),
        where('assigneeId', '==', assigneeId),
        orderBy('deadline', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Task[];
    } catch (error) {
      console.error('Error getting tasks by assignee:', error);
      throw new Error('Failed to get tasks');
    }
  }

  // Get tasks linked to a client's projects
  static async getTasksByClient(clientId: string): Promise<Task[]> {
    try {
      // 1) Load all project ids for this client
      const projectsQuery = query(collection(db, 'projects'), where('clientId', '==', clientId));
      const projectsSnap = await getDocs(projectsQuery);
      const projectIds = projectsSnap.docs.map((d) => d.id);

      if (projectIds.length === 0) {
        return [];
      }

      // 2) Query tasks by projectId using batched `in` queries (max 10 ids per query)
      const chunkSize = 10;
      const tasks: Task[] = [];
      for (let i = 0; i < projectIds.length; i += chunkSize) {
        const idsChunk = projectIds.slice(i, i + chunkSize);
        const qTasks = query(collection(db, TASKS_COLLECTION), where('projectId', 'in', idsChunk));
        const snap = await getDocs(qTasks);
        const partial = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          deadline: d.data().deadline?.toDate() || new Date(),
          createdAt: d.data().createdAt?.toDate() || new Date(),
          updatedAt: d.data().updatedAt?.toDate() || new Date(),
        })) as Task[];
        tasks.push(...partial);
      }

      // 3) Sort by deadline locally (avoids composite index requirements)
      tasks.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
      return tasks;
    } catch (error) {
      console.error('Error getting tasks by client:', error);
      throw new Error('Failed to get client tasks');
    }
  }

  // Get filtered tasks
  static async getFilteredTasks(filters: TaskFilters): Promise<Task[]> {
    try {
      let q = query(collection(db, TASKS_COLLECTION));
      
      if (filters.assigneeId) {
        q = query(q, where('assigneeId', '==', filters.assigneeId));
      }
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }
      
      q = query(q, orderBy('deadline', 'asc'));
      
      const querySnapshot = await getDocs(q);
      let tasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Task[];

      // Apply additional filters in memory
      if (filters.deadline) {
        tasks = tasks.filter(task => 
          task.deadline >= filters.deadline!.start && 
          task.deadline <= filters.deadline!.end
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        tasks = tasks.filter(task =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower)
        );
      }

      return tasks;
    } catch (error) {
      console.error('Error getting filtered tasks:', error);
      throw new Error('Failed to get filtered tasks');
    }
  }

  // Get a single task by ID
  static async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const docRef = doc(db, TASKS_COLLECTION, taskId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          deadline: data.deadline?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Task;
      }
      return null;
    } catch (error) {
      console.error('Error getting task:', error);
      throw new Error('Failed to get task');
    }
  }

  // Update a task
  static async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      const docRef = doc(db, TASKS_COLLECTION, taskId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        ...(updates.deadline && { deadline: Timestamp.fromDate(updates.deadline) })
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }
  }

  // Update task status
  static async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    try {
      const docRef = doc(db, TASKS_COLLECTION, taskId);
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      throw new Error('Failed to update task status');
    }
  }

  // Update task progress
  static async updateTaskProgress(taskId: string, progress: number): Promise<void> {
    try {
      const docRef = doc(db, TASKS_COLLECTION, taskId);
      await updateDoc(docRef, {
        progress,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating task progress:', error);
      throw new Error('Failed to update task progress');
    }
  }

  // Delete a task
  static async deleteTask(taskId: string): Promise<void> {
    try {
      const docRef = doc(db, TASKS_COLLECTION, taskId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Failed to delete task');
    }
  }

  // Real-time listener for all tasks
  static subscribeToTasks(callback: (tasks: Task[]) => void) {
    const q = query(collection(db, TASKS_COLLECTION), orderBy('deadline', 'asc'));
    return onSnapshot(q, (querySnapshot) => {
      const tasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Task[];
      callback(tasks);
    });
  }

  // Real-time listener for tasks by assignee
  static subscribeToTasksByAssignee(assigneeId: string, callback: (tasks: Task[]) => void) {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('assigneeId', '==', assigneeId),
      orderBy('deadline', 'asc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const tasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Task[];
      callback(tasks);
    });
  }

  // Real-time listener for tasks belonging to a client's projects
  static subscribeToTasksByClient(clientId: string, callback: (tasks: Task[]) => void) {
    // Fallback to polling via non-realtime API for simplicity; could be optimized by composite indexes
    let cancelled = false;
    const poll = async () => {
      try {
        const results = await TaskService.getTasksByClient(clientId);
        if (!cancelled) callback(results);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setTimeout(poll, 10000);
      }
    };
    void poll();
    return () => { cancelled = true; };
  }
}
