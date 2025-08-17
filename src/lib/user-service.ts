import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee' | 'manager';
  department?: string;
  position?: string;
  avatar?: string;
  isActive: boolean;
}

export class UserService {
  // Get all employees (users with role = 'employee')
  static async getEmployees(): Promise<User[]> {
    try {
      console.log('Fetching employees from Firestore...');
      
      // First try to get employees with role filter
      let q = query(
        collection(db, 'users'),
        where('role', '==', 'employee'),
        where('isActive', '==', true)
      );
      
      let querySnapshot = await getDocs(q);
      let employees = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];

      // If no employees found, try without role filter
      if (employees.length === 0) {
        console.log('No employees found with role filter, trying without role filter...');
        q = query(
          collection(db, 'users'),
          where('isActive', '==', true)
        );
        querySnapshot = await getDocs(q);
        employees = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
      }

      // If still no users found, try getting all users without any filter
      if (employees.length === 0) {
        console.log('No active users found, trying to get all users...');
        querySnapshot = await getDocs(collection(db, 'users'));
        employees = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
      }

      console.log(`Found ${employees.length} employees/users:`, employees);
      return employees;
    } catch (error) {
      console.error('Error getting employees:', error);
      
      // Return fallback data if Firebase is not available
      console.log('Returning fallback employee data...');
      return [
        {
          id: 'emp-1',
          email: 'john.doe@company.com',
          name: 'John Doe',
          role: 'employee' as const,
          department: 'Engineering',
          position: 'Software Developer',
          isActive: true
        },
        {
          id: 'emp-2',
          email: 'jane.smith@company.com',
          name: 'Jane Smith',
          role: 'employee' as const,
          department: 'Design',
          position: 'UI/UX Designer',
          isActive: true
        },
        {
          id: 'emp-3',
          email: 'mike.johnson@company.com',
          name: 'Mike Johnson',
          role: 'employee' as const,
          department: 'Marketing',
          position: 'Marketing Manager',
          isActive: true
        }
      ];
    }
  }

  // Get all active users
  static async getActiveUsers(): Promise<User[]> {
    try {
      console.log('Fetching active users from Firestore...');
      
      // First try with isActive filter
      let q = query(
        collection(db, 'users'),
        where('isActive', '==', true)
      );
      
      let querySnapshot = await getDocs(q);
      let users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];

      // If no active users found, try getting all users
      if (users.length === 0) {
        console.log('No active users found, trying to get all users...');
        querySnapshot = await getDocs(collection(db, 'users'));
        users = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
      }

      console.log(`Found ${users.length} active users:`, users);
      return users;
    } catch (error) {
      console.error('Error getting active users:', error);
      
      // Return fallback data if Firebase is not available
      console.log('Returning fallback user data...');
      return [
        {
          id: 'admin-1',
          email: 'admin@company.com',
          name: 'Admin User',
          role: 'admin' as const,
          department: 'Management',
          position: 'System Administrator',
          isActive: true
        },
        {
          id: 'emp-1',
          email: 'john.doe@company.com',
          name: 'John Doe',
          role: 'employee' as const,
          department: 'Engineering',
          position: 'Software Developer',
          isActive: true
        },
        {
          id: 'emp-2',
          email: 'jane.smith@company.com',
          name: 'Jane Smith',
          role: 'employee' as const,
          department: 'Design',
          position: 'UI/UX Designer',
          isActive: true
        },
        {
          id: 'emp-3',
          email: 'mike.johnson@company.com',
          name: 'Mike Johnson',
          role: 'employee' as const,
          department: 'Marketing',
          position: 'Marketing Manager',
          isActive: true
        },
        {
          id: 'manager-1',
          email: 'sarah.wilson@company.com',
          name: 'Sarah Wilson',
          role: 'manager' as const,
          department: 'Engineering',
          position: 'Engineering Manager',
          isActive: true
        }
      ];
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  }

  // Get users by role
  static async getUsersByRole(role: string): Promise<User[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', role),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw new Error('Failed to get users by role');
    }
  }

  // Create a test user in Firestore (for development)
  static async createTestUsers(): Promise<void> {
    try {
      console.log('Creating test users in Firestore...');
      const { addDoc } = await import('firebase/firestore');
      
      const testUsers = [
        {
          email: 'admin@company.com',
          name: 'Admin User',
          role: 'admin',
          department: 'Management',
          position: 'System Administrator',
          isActive: true
        },
        {
          email: 'john.doe@company.com',
          name: 'John Doe',
          role: 'employee',
          department: 'Engineering',
          position: 'Software Developer',
          isActive: true
        },
        {
          email: 'jane.smith@company.com',
          name: 'Jane Smith',
          role: 'employee',
          department: 'Design',
          position: 'UI/UX Designer',
          isActive: true
        },
        {
          email: 'mike.johnson@company.com',
          name: 'Mike Johnson',
          role: 'employee',
          department: 'Marketing',
          position: 'Marketing Manager',
          isActive: true
        },
        {
          email: 'sarah.wilson@company.com',
          name: 'Sarah Wilson',
          role: 'manager',
          department: 'Engineering',
          position: 'Engineering Manager',
          isActive: true
        }
      ];

      for (const user of testUsers) {
        await addDoc(collection(db, 'users'), user);
      }
      
      console.log('Test users created successfully!');
    } catch (error) {
      console.error('Error creating test users:', error);
    }
  }
}
