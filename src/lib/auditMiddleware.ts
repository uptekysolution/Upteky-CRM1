import { auth } from '@/lib/firebase';
import { logSuccessAction, logFailedAction } from '@/lib/auditLogger';

export interface AuditContext {
  userId: string;
  userEmail: string;
  userRole: string;
}

/**
 * Higher-order function that wraps API calls with audit logging
 */
export function withAuditLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  moduleName: string,
  actionType: 'read' | 'write' | 'update' | 'delete' | 'create',
  description: string
) {
  return async (...args: T): Promise<R> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const result = await fn(...args);
      
      // Log successful action
      await logSuccessAction(
        user.uid,
        user.email || 'unknown',
        'Unknown', // Role would need to be fetched from user context
        actionType,
        moduleName,
        description
      );
      
      return result;
    } catch (error) {
      // Log failed action
      await logFailedAction(
        user.uid,
        user.email || 'unknown',
        'Unknown', // Role would need to be fetched from user context
        actionType,
        moduleName,
        `${description} - Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      
      throw error;
    }
  };
}

/**
 * React hook for logging user actions
 */
export function useAuditLogger() {
  const logAction = async (
    actionType: 'read' | 'write' | 'update' | 'delete' | 'create',
    moduleName: string,
    description: string,
    metadata?: Record<string, any>
  ) => {
    const user = auth.currentUser;
    if (!user) {
      console.warn('Cannot log audit event: user not authenticated');
      return;
    }

    try {
      await logSuccessAction(
        user.uid,
        user.email || 'unknown',
        'Unknown', // Role would need to be fetched from user context
        actionType,
        moduleName,
        description,
        metadata
      );
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  };

  const logFailedAction = async (
    actionType: 'read' | 'write' | 'update' | 'delete' | 'create',
    moduleName: string,
    description: string,
    error: Error,
    metadata?: Record<string, any>
  ) => {
    const user = auth.currentUser;
    if (!user) {
      console.warn('Cannot log audit event: user not authenticated');
      return;
    }

    try {
      await logFailedAction(
        user.uid,
        user.email || 'unknown',
        'Unknown', // Role would need to be fetched from user context
        actionType,
        moduleName,
        `${description} - Failed: ${error.message}`,
        metadata
      );
    } catch (logError) {
      console.error('Failed to log failed audit event:', logError);
    }
  };

  return { logAction, logFailedAction };
}

/**
 * Utility to get current user context for audit logging
 */
export async function getCurrentUserContext(): Promise<AuditContext | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  // In a real application, you would fetch the user's role from Firestore
  // For now, we'll return a basic context
  return {
    userId: user.uid,
    userEmail: user.email || 'unknown',
    userRole: 'Unknown', // This should be fetched from user document
  };
}

/**
 * Automatic audit logging for common CRUD operations
 */
export const auditHelpers = {
  // User management
  userCreated: (userId: string, userEmail: string) =>
    logSuccessAction(userId, userEmail, 'Admin', 'create', 'User Management', `Created user: ${userEmail}`),
  
  userUpdated: (userId: string, userEmail: string, updatedFields: string[]) =>
    logSuccessAction(userId, userEmail, 'Admin', 'update', 'User Management', `Updated user ${userEmail}: ${updatedFields.join(', ')}`),
  
  userDeleted: (userId: string, userEmail: string) =>
    logSuccessAction(userId, userEmail, 'Admin', 'delete', 'User Management', `Deleted user: ${userEmail}`),

  // Payroll
  payrollViewed: (userId: string, userEmail: string, targetUser?: string) =>
    logSuccessAction(userId, userEmail, 'HR', 'read', 'Payroll', targetUser ? `Viewed payroll for ${targetUser}` : 'Viewed own payroll'),
  
  payrollUpdated: (userId: string, userEmail: string, targetUser: string) =>
    logSuccessAction(userId, userEmail, 'HR', 'update', 'Payroll', `Updated payroll for ${targetUser}`),

  // Attendance
  attendanceViewed: (userId: string, userEmail: string, targetUser?: string) =>
    logSuccessAction(userId, userEmail, 'HR', 'read', 'Attendance', targetUser ? `Viewed attendance for ${targetUser}` : 'Viewed own attendance'),
  
  attendanceUpdated: (userId: string, userEmail: string, targetUser: string) =>
    logSuccessAction(userId, userEmail, 'HR', 'update', 'Attendance', `Updated attendance for ${targetUser}`),

  // Permissions
  permissionsViewed: (userId: string, userEmail: string) =>
    logSuccessAction(userId, userEmail, 'Admin', 'read', 'Permissions', 'Viewed permissions matrix'),
  
  permissionsUpdated: (userId: string, userEmail: string, role: string) =>
    logSuccessAction(userId, userEmail, 'Admin', 'update', 'Permissions', `Updated permissions for role: ${role}`),

  // Login/Logout
  userLoggedIn: (userId: string, userEmail: string, userRole: string) =>
    logSuccessAction(userId, userEmail, userRole, 'read', 'Authentication', 'User logged in successfully'),
  
  userLoggedOut: (userId: string, userEmail: string, userRole: string) =>
    logSuccessAction(userId, userEmail, userRole, 'read', 'Authentication', 'User logged out'),

  // Failed operations
  loginFailed: (userEmail: string, reason: string) =>
    logFailedAction('unknown', userEmail, 'Unknown', 'read', 'Authentication', `Login failed: ${reason}`),
  
  accessDenied: (userId: string, userEmail: string, userRole: string, module: string, action: string) =>
    logFailedAction(userId, userEmail, userRole, action as any, module, `Access denied to ${module}`),
};
