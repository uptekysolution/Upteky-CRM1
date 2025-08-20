import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  writeBatch,
  Timestamp,
  QueryDocumentSnapshot,
  setDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  deleteUser as deleteAuthUser,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { 
  User, 
  UserRole, 
  UserStatus, 
  Team, 
  TeamMember, 
  TeamMemberRole,
  CreateUserRequest,
  UpdateUserRequest,
  UserSearchFilters,
  UserListResponse,
  TeamAssignmentRequest,
  UserStats
} from '@/types/user';

export class UserService {
  private static readonly USERS_COLLECTION = 'users';
  private static readonly TEAMS_COLLECTION = 'teams';
  private static readonly TEAM_MEMBERS_COLLECTION = 'teamMembers';
  private static readonly USER_PERMISSIONS_COLLECTION = 'userPermissions';

  // User CRUD Operations
  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      const authUser = userCredential.user;

      // Create user document in Firestore
      const userDoc = {
        id: authUser.uid,
        name: `${userData.firstName} ${userData.lastName}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        status: 'Active' as UserStatus,
        department: userData.department,
        position: userData.position,
        phone: userData.phone,
        location: userData.location,
        hireDate: userData.hireDate ? Timestamp.fromDate(userData.hireDate) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, this.USERS_COLLECTION, authUser.uid), userDoc);

      return {
        ...userDoc,
        hireDate: userData.hireDate,
        createdAt: userData.hireDate || new Date(),
        updatedAt: new Date(),
      } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, this.USERS_COLLECTION, userId));
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();
      return {
        ...userData,
        hireDate: userData.hireDate?.toDate(),
        createdAt: userData.createdAt?.toDate(),
        updatedAt: userData.updatedAt?.toDate(),
      } as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  static async updateUser(userId: string, updateData: UpdateUserRequest): Promise<void> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      const updateFields: any = {
        ...updateData,
        updatedAt: Timestamp.now(),
      };

      // Handle name update
      if (updateData.firstName || updateData.lastName) {
        const currentUser = await this.getUser(userId);
        if (currentUser) {
          const firstName = updateData.firstName || currentUser.firstName;
          const lastName = updateData.lastName || currentUser.lastName;
          updateFields.name = `${firstName} ${lastName}`;
        }
      }

      // Handle date conversion
      if (updateData.hireDate) {
        updateFields.hireDate = Timestamp.fromDate(updateData.hireDate);
      }

      await updateDoc(userRef, updateFields);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Delete user document
      batch.delete(doc(db, this.USERS_COLLECTION, userId));

      // Delete team memberships
      const teamMembersQuery = query(
        collection(db, this.TEAM_MEMBERS_COLLECTION),
        where('userId', '==', userId)
      );
      const teamMembersSnapshot = await getDocs(teamMembersQuery);
      teamMembersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete user permissions
      const permissionsQuery = query(
        collection(db, this.USER_PERMISSIONS_COLLECTION),
        where('userId', '==', userId)
      );
      const permissionsSnapshot = await getDocs(permissionsQuery);
      permissionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      // Note: Firebase Auth user deletion requires admin SDK or user to be signed in
      // This would typically be handled server-side
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async getUsers(filters?: UserSearchFilters, page = 1, limit = 10): Promise<UserListResponse> {
    try {
      let q = query(collection(db, this.USERS_COLLECTION), orderBy('name'));

      // Apply filters
      if (filters?.role) {
        q = query(q, where('role', '==', filters.role));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.department) {
        q = query(q, where('department', '==', filters.department));
      }

      const snapshot = await getDocs(q);
      let users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          hireDate: data.hireDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as User;
      });

      // Apply search filter (client-side for now)
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        users = users.filter(user => 
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.role.toLowerCase().includes(searchTerm) ||
          user.department?.toLowerCase().includes(searchTerm)
        );
      }

      // Apply pagination
      const total = users.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = users.slice(startIndex, endIndex);

      return {
        users: paginatedUsers,
        total,
        page,
        limit,
        hasMore: endIndex < total,
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Team Operations
  static async getTeams(): Promise<Team[]> {
    try {
      const snapshot = await getDocs(collection(db, this.TEAMS_COLLECTION));
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Team;
      });
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }

  static async getUserTeams(userId: string): Promise<TeamMember[]> {
    try {
      const q = query(
        collection(db, this.TEAM_MEMBERS_COLLECTION),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          joinedAt: data.joinedAt?.toDate(),
        } as TeamMember;
      });
    } catch (error) {
      console.error('Error fetching user teams:', error);
      throw error;
    }
  }

  static async assignUserToTeam(assignment: TeamAssignmentRequest): Promise<void> {
    try {
      const teamMemberDoc = {
        teamId: assignment.teamId,
        userId: assignment.userId,
        role: assignment.role,
        reportsToMemberId: assignment.reportsToMemberId,
        joinedAt: Timestamp.now(),
      };

      await addDoc(collection(db, this.TEAM_MEMBERS_COLLECTION), teamMemberDoc);
    } catch (error) {
      console.error('Error assigning user to team:', error);
      throw error;
    }
  }

  static async removeUserFromTeam(userId: string, teamId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.TEAM_MEMBERS_COLLECTION),
        where('userId', '==', userId),
        where('teamId', '==', teamId)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        await deleteDoc(snapshot.docs[0].ref);
      }
    } catch (error) {
      console.error('Error removing user from team:', error);
      throw error;
    }
  }

  static async updateTeamMemberRole(userId: string, teamId: string, role: TeamMemberRole): Promise<void> {
    try {
      const q = query(
        collection(db, this.TEAM_MEMBERS_COLLECTION),
        where('userId', '==', userId),
        where('teamId', '==', teamId)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        await updateDoc(snapshot.docs[0].ref, { role });
      }
    } catch (error) {
      console.error('Error updating team member role:', error);
      throw error;
    }
  }

  // User Statistics
  static async getUserStats(): Promise<UserStats> {
    try {
      const usersSnapshot = await getDocs(collection(db, this.USERS_COLLECTION));
      const users = usersSnapshot.docs.map(doc => doc.data() as User);

      const stats: UserStats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'Active').length,
        inactiveUsers: users.filter(u => u.status === 'Inactive').length,
        suspendedUsers: users.filter(u => u.status === 'Suspended').length,
        usersByRole: {} as Record<UserRole, number>,
        usersByDepartment: {},
        recentRegistrations: 0,
        averageTeamSize: 0,
      };

      // Calculate role distribution
      users.forEach(user => {
        stats.usersByRole[user.role] = (stats.usersByRole[user.role] || 0) + 1;
        if (user.department) {
          stats.usersByDepartment[user.department] = (stats.usersByDepartment[user.department] || 0) + 1;
        }
      });

      // Calculate recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      stats.recentRegistrations = users.filter(user => 
        user.createdAt && new Date(user.createdAt) > thirtyDaysAgo
      ).length;

      // Calculate average team size
      const teamsSnapshot = await getDocs(collection(db, this.TEAM_MEMBERS_COLLECTION));
      const teamMembers = teamsSnapshot.docs.map(doc => doc.data());
      const teamSizes = teamMembers.reduce((acc, member) => {
        acc[member.teamId] = (acc[member.teamId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const teamSizeValues = Object.values(teamSizes);
      stats.averageTeamSize = teamSizeValues.length > 0 
        ? teamSizeValues.reduce((sum, size) => sum + size, 0) / teamSizeValues.length 
        : 0;

      return stats;
    } catch (error) {
      console.error('Error calculating user stats:', error);
      throw error;
    }
  }

  // Utility Methods
  static async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  static async updateUserProfile(userId: string, profileData: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      const updateData: any = {
        ...profileData,
        updatedAt: Timestamp.now(),
      };

      // Handle name update
      if (profileData.firstName || profileData.lastName) {
        const currentUser = await this.getUser(userId);
        if (currentUser) {
          const firstName = profileData.firstName || currentUser.firstName;
          const lastName = profileData.lastName || currentUser.lastName;
          updateData.name = `${firstName} ${lastName}`;
        }
      }

      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}
