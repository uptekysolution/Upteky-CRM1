import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface EmployeeProject {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress?: number;
  clientId?: string;
  assignedTeam?: string;
  deadline?: any;
  createdAt: any;
  updatedAt?: any;
}

export class EmployeeProjectService {
  static async getEmployeeProjects(userId: string, userRole: string): Promise<EmployeeProject[]> {
    try {
      // Get user's team assignment
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return [];
      }

      const userData = userDoc.data();
      const teamId = userData?.teamId;

      if (!teamId) {
        return [];
      }

      // Get projects assigned to this team
      const assignmentsQuery = query(
        collection(db, 'projectAssignments'),
        where('teamId', '==', teamId)
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const projectIds = assignmentsSnapshot.docs.map(doc => doc.data().projectId);

      if (projectIds.length === 0) {
        return [];
      }

      // Get project details
      const projectsQuery = query(
        collection(db, 'projects'),
        where('__name__', 'in', projectIds),
        orderBy('createdAt', 'desc')
      );

      const projectsSnapshot = await getDocs(projectsQuery);
      return projectsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          status: data.status,
          progress: data.progress || 0,
          clientId: data.clientId,
          assignedTeam: data.assignedTeam,
          deadline: data.deadline,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as EmployeeProject;
      });
    } catch (error) {
      console.error('Error fetching employee projects:', error);
      return [];
    }
  }

  static subscribeToEmployeeProjects(
    userId: string,
    userRole: string,
    callback: (projects: EmployeeProject[]) => void
  ) {
    return onSnapshot(
      collection(db, 'projectAssignments'),
      async (snapshot) => {
        try {
          // Get user's team assignment
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (!userDoc.exists()) {
            callback([]);
            return;
          }

          const userData = userDoc.data();
          const teamId = userData?.teamId;

          if (!teamId) {
            callback([]);
            return;
          }

          // Filter assignments for this team
          const teamAssignments = snapshot.docs
            .filter(doc => doc.data().teamId === teamId)
            .map(doc => doc.data().projectId);

          if (teamAssignments.length === 0) {
            callback([]);
            return;
          }

          // Get project details
          const projectsQuery = query(
            collection(db, 'projects'),
            where('__name__', 'in', teamAssignments),
            orderBy('createdAt', 'desc')
          );

          const projectsSnapshot = await getDocs(projectsQuery);
          const projects = projectsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              description: data.description,
              status: data.status,
              progress: data.progress || 0,
              clientId: data.clientId,
              assignedTeam: data.assignedTeam,
              deadline: data.deadline,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt
            } as EmployeeProject;
          });

          callback(projects);
        } catch (error) {
          console.error('Error in employee projects subscription:', error);
          callback([]);
        }
      },
      (error) => {
        console.error('Error in employee projects subscription:', error);
        callback([]);
      }
    );
  }
}
