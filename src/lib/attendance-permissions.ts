import { db } from '@/lib/firebase-admin';
import { PermissionName } from '@/hooks/use-role-permissions';

export interface AttendancePermissionResult {
  canViewOwn: boolean;
  canViewAll: boolean;
  canViewTeam: boolean;
  hasAnyPermission: boolean;
}

/**
 * Check attendance permissions for a user
 */
export async function checkAttendancePermissions(
  userId: string,
  userRole: string,
  userPermissions: PermissionName[]
): Promise<AttendancePermissionResult> {
  // Admin always has all permissions
  if (userRole === 'Admin') {
    return {
      canViewOwn: true,
      canViewAll: true,
      canViewTeam: true,
      hasAnyPermission: true
    };
  }

  // Check specific permissions
  const canViewOwn = userPermissions.includes('attendance:view:own');
  const canViewAll = userPermissions.includes('attendance:view:all');
  const canViewTeam = userPermissions.includes('attendance:view:team');

  return {
    canViewOwn,
    canViewAll,
    canViewTeam,
    hasAnyPermission: canViewOwn || canViewAll || canViewTeam
  };
}

/**
 * Get attendance filter based on permissions
 */
export async function getAttendanceFilterByPermissions(
  userId: string,
  userRole: string,
  userPermissions: PermissionName[]
): Promise<{ filter: any; error?: string }> {
  const permissions = await checkAttendancePermissions(userId, userRole, userPermissions);

  if (!permissions.hasAnyPermission) {
    return { 
      filter: null, 
      error: 'No attendance permissions granted' 
    };
  }

  // If user has view:all permission, return all records (except Admin)
  if (permissions.canViewAll) {
    return {
      filter: async (records: any[]) => {
        // Filter out Admin users from attendance records
        const filteredRecords = [];
        for (const record of records) {
          if (record.userId) {
            try {
              const userDoc = await db.collection('users').doc(record.userId).get();
              if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData?.role !== 'Admin') {
                  filteredRecords.push(record);
                }
              } else {
                // If user doc doesn't exist, include the record
                filteredRecords.push(record);
              }
            } catch (error) {
              console.error('Error checking user role:', error);
              // Include record if we can't verify user role
              filteredRecords.push(record);
            }
          } else {
            filteredRecords.push(record);
          }
        }
        return filteredRecords;
      }
    };
  }

  // If user has view:team permission, return team members' records
  if (permissions.canViewTeam) {
    return {
      filter: async (records: any[]) => {
        try {
          // Find teams where this user is a lead
          const leadTeamsSnapshot = await db.collection('teamMembers')
            .where('userId', '==', userId)
            .where('role', '==', 'lead')
            .get();
          
          const leadTeamIds = leadTeamsSnapshot.docs.map(doc => doc.data().teamId);
          
          if (leadTeamIds.length === 0) {
            // If not a team lead, fall back to own records
            return records.filter(record => record.userId === userId);
          }

          // Get all userIds in those teams
          const teamMemberUserIds = new Set<string>();
          for (const teamId of leadTeamIds) {
            const membersSnap = await db.collection('teamMembers')
              .where('teamId', '==', teamId)
              .get();
            membersSnap.docs.forEach(doc => {
              teamMemberUserIds.add(doc.data().userId);
            });
          }

          return records.filter(record => teamMemberUserIds.has(record.userId));
        } catch (error) {
          console.error('Error filtering team attendance:', error);
          // Fall back to own records on error
          return records.filter(record => record.userId === userId);
        }
      }
    };
  }

  // If user has view:own permission, return only own records
  if (permissions.canViewOwn) {
    return {
      filter: (records: any[]) => records.filter(record => record.userId === userId)
    };
  }

  // No permissions granted
  return { 
    filter: null, 
    error: 'No attendance permissions granted' 
  };
}

/**
 * Check if user can view specific attendance record
 */
export async function canViewAttendanceRecord(
  recordUserId: string,
  viewerUserId: string,
  viewerRole: string,
  viewerPermissions: PermissionName[]
): Promise<boolean> {
  // User can always view their own records
  if (recordUserId === viewerUserId) {
    return true;
  }

  // Admin can view all records
  if (viewerRole === 'Admin') {
    return true;
  }

  const permissions = await checkAttendancePermissions(viewerUserId, viewerRole, viewerPermissions);

  // Check if user has view:all permission
  if (permissions.canViewAll) {
    try {
      const userDoc = await db.collection('users').doc(recordUserId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        return userData?.role !== 'Admin';
      }
      return true; // If user doc doesn't exist, allow access
    } catch (error) {
      console.error('Error checking user role:', error);
      return true; // Allow access if we can't verify
    }
  }

  // Check if user has view:team permission
  if (permissions.canViewTeam) {
    try {
      // Check if the record user is in a team led by the viewer
      const leadTeamsSnapshot = await db.collection('teamMembers')
        .where('userId', '==', viewerUserId)
        .where('role', '==', 'lead')
        .get();
      
      const leadTeamIds = leadTeamsSnapshot.docs.map(doc => doc.data().teamId);
      
      for (const teamId of leadTeamIds) {
        const memberDoc = await db.collection('teamMembers')
          .where('teamId', '==', teamId)
          .where('userId', '==', recordUserId)
          .get();
        
        if (!memberDoc.empty) {
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking team membership:', error);
    }
  }

  return false;
}

/**
 * Get user permissions from Firestore
 */
export async function getUserPermissions(userId: string): Promise<PermissionName[]> {
  try {
    // Get user role
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return [];
    }

    const userData = userDoc.data();
    const role = userData?.role;

    if (!role) {
      return [];
    }

    // Admin always has all permissions
    if (role === 'Admin') {
      return [
        'dashboard:view',
        'attendance:view:own',
        'attendance:view:team',
        'attendance:view:all',
        'payroll:view:own',
        'payroll:view:all',
        'clients:view',
        'tickets:view',
        'lead-generation:view',
        'tasks:view',
        'timesheet:view',
        'users:manage',
        'permissions:manage',
        'audit-log:view',
        'teams:manage'
      ];
    }

    // Get role permissions
    const rolePermissionsDoc = await db.collection('role_permissions').doc(role).get();
    if (!rolePermissionsDoc.exists) {
      return [];
    }

    const rolePermissionsData = rolePermissionsDoc.data();
    return rolePermissionsData?.permissions || [];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}
