import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';

export interface AuditLogEntry {
  id?: string;
  userId: string;
  userEmail: string;
  userRole: string;
  actionType: 'read' | 'write' | 'update' | 'delete' | 'create';
  moduleAccessed: string;
  description: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failed' | 'pending';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface AuditLogQuery {
  userId?: string;
  userRole?: string;
  actionType?: string;
  moduleAccessed?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Logs an audit event to Firestore
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<string> {
  try {
    const auditEntry = {
      ...entry,
      // Firestore will store JS Date as Timestamp on both admin and client SDKs
      timestamp: new Date(),
      createdAt: new Date(),
    };

    // Use Admin SDK on the server to bypass security rules; fall back to client SDK otherwise
    if (typeof window === 'undefined') {
      try {
        const { adminDb } = await import('@/lib/firebase-admin');
        const docRef = await adminDb.collection('auditLogs').add(auditEntry as any);
        console.log('Audit log created (admin) with ID:', docRef.id);
        return docRef.id;
      } catch (e) {
        console.warn('Admin DB logging failed, falling back to client SDK:', e);
      }
    }

    const clientDocRef = await addDoc(collection(db, 'auditLogs'), auditEntry as any);
    console.log('Audit log created with ID:', clientDocRef.id);
    return clientDocRef.id;
  } catch (error) {
    console.error('Error logging audit event:', error);
    throw new Error('Failed to log audit event');
  }
}

/**
 * Fetches audit logs from Firestore with optional filtering
 */
export async function getAuditLogs(queryParams: AuditLogQuery = {}): Promise<AuditLogEntry[]> {
  try {
    let q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));

    // Apply filters
    if (queryParams.userId) {
      q = query(q, where('userId', '==', queryParams.userId));
    }
    if (queryParams.userRole) {
      q = query(q, where('userRole', '==', queryParams.userRole));
    }
    if (queryParams.actionType) {
      q = query(q, where('actionType', '==', queryParams.actionType));
    }
    if (queryParams.moduleAccessed) {
      q = query(q, where('moduleAccessed', '==', queryParams.moduleAccessed));
    }
    if (queryParams.status) {
      q = query(q, where('status', '==', queryParams.status));
    }
    if (queryParams.startDate) {
      q = query(q, where('timestamp', '>=', Timestamp.fromDate(queryParams.startDate)));
    }
    if (queryParams.endDate) {
      q = query(q, where('timestamp', '<=', Timestamp.fromDate(queryParams.endDate)));
    }
    if (queryParams.limit) {
      q = query(q, limit(queryParams.limit));
    }

    const querySnapshot = await getDocs(q);
    const logs: AuditLogEntry[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        userRole: data.userRole,
        actionType: data.actionType,
        moduleAccessed: data.moduleAccessed,
        description: data.description,
        timestamp: data.timestamp.toDate(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        status: data.status,
        severity: data.severity,
        metadata: data.metadata,
      });
    });

    return logs;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }
}

/**
 * Logs a successful action
 */
export async function logSuccessAction(
  userId: string,
  userEmail: string,
  userRole: string,
  actionType: AuditLogEntry['actionType'],
  moduleAccessed: string,
  description: string,
  metadata?: Record<string, any>
): Promise<string> {
  return logAuditEvent({
    userId,
    userEmail,
    userRole,
    actionType,
    moduleAccessed,
    description,
    status: 'success',
    metadata,
  });
}

/**
 * Logs a failed action
 */
export async function logFailedAction(
  userId: string,
  userEmail: string,
  userRole: string,
  actionType: AuditLogEntry['actionType'],
  moduleAccessed: string,
  description: string,
  metadata?: Record<string, any>
): Promise<string> {
  return logAuditEvent({
    userId,
    userEmail,
    userRole,
    actionType,
    moduleAccessed,
    description,
    status: 'failed',
    metadata,
  });
}

/**
 * Logs an unusual access pattern detected by AI
 */
export async function logUnusualAccess(
  userId: string,
  userEmail: string,
  userRole: string,
  actionType: AuditLogEntry['actionType'],
  moduleAccessed: string,
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  aiAnalysis: string,
  metadata?: Record<string, any>
): Promise<string> {
  return logAuditEvent({
    userId,
    userEmail,
    userRole,
    actionType,
    moduleAccessed,
    description,
    status: 'pending',
    severity,
    metadata: {
      ...metadata,
      aiAnalysis,
      flaggedAsUnusual: true,
    },
  });
}

/**
 * Gets user's IP address (for server-side logging)
 */
export function getUserIPAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

/**
 * Gets user agent string (for server-side logging)
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}
