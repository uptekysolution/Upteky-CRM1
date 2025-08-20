import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import type { AuditLogEntry, AuditLogQuery } from '@/lib/auditLogger';

export function useAuditLogs(queryParams: AuditLogQuery = {}) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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

      // Prime UI with a one-time fetch so the table doesn't hang if snapshots are delayed
      (async () => {
        try {
          const initialSnap = await getDocs(q);
          const initial: AuditLogEntry[] = [];
          initialSnap.forEach((doc) => {
            const data: any = doc.data();
            const ts: any = data.timestamp;
            const tsDate = ts instanceof Timestamp ? ts.toDate() : (typeof ts?.toDate === 'function' ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts)));
            initial.push({
              id: doc.id,
              userId: data.userId,
              userEmail: data.userEmail,
              userRole: data.userRole,
              actionType: data.actionType,
              moduleAccessed: data.moduleAccessed,
              description: data.description,
              timestamp: tsDate,
              ipAddress: data.ipAddress,
              userAgent: data.userAgent,
              status: data.status,
              severity: data.severity,
              metadata: data.metadata,
            });
          });
          setLogs(initial);
          setLoading(false);
        } catch (e) {
          // Ignore; onSnapshot below will still handle updates/errors
        }
      })();

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          try {
            const auditLogs: AuditLogEntry[] = [];
            querySnapshot.forEach((doc) => {
              const data: any = doc.data();

              // Robust timestamp handling across SDKs
              const ts: any = data.timestamp;
              let tsDate: Date;
              if (ts instanceof Timestamp) {
                tsDate = ts.toDate();
              } else if (ts && typeof ts.toDate === 'function') {
                tsDate = ts.toDate();
              } else if (ts instanceof Date) {
                tsDate = ts;
              } else if (typeof ts === 'string') {
                tsDate = new Date(ts);
              } else {
                tsDate = new Date(0);
              }

              auditLogs.push({
                id: doc.id,
                userId: data.userId,
                userEmail: data.userEmail,
                userRole: data.userRole,
                actionType: data.actionType,
                moduleAccessed: data.moduleAccessed,
                description: data.description,
                timestamp: tsDate,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                status: data.status,
                severity: data.severity,
                metadata: data.metadata,
              });
            });
            setLogs(auditLogs);
            setLoading(false);
          } catch (e) {
            console.error('Error parsing audit logs snapshot:', e);
            setError('Failed to parse audit logs');
            setLoading(false);
          }
        },
        (error) => {
          console.error('Error fetching audit logs:', error);
          setError('Failed to fetch audit logs');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up audit logs listener:', error);
      setError('Failed to set up audit logs listener');
      setLoading(false);
    }
  }, [queryParams]);

  return { logs, loading, error };
}

export function useAuditLogsStats() {
  const [stats, setStats] = useState({
    total: 0,
    unusual: 0,
    failed: 0,
    today: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Get total logs
      const totalQuery = query(collection(db, 'auditLogs'));
      const unusualQuery = query(collection(db, 'auditLogs'), where('severity', 'in', ['medium', 'high', 'critical']));
      const failedQuery = query(collection(db, 'auditLogs'), where('status', '==', 'failed'));
      
      // Get today's logs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayQuery = query(
        collection(db, 'auditLogs'),
        where('timestamp', '>=', Timestamp.fromDate(today))
      );

      const unsubscribeTotal = onSnapshot(totalQuery, (snapshot) => {
        setStats(prev => ({ ...prev, total: snapshot.size }));
      });

      const unsubscribeUnusual = onSnapshot(unusualQuery, (snapshot) => {
        setStats(prev => ({ ...prev, unusual: snapshot.size }));
      });

      const unsubscribeFailed = onSnapshot(failedQuery, (snapshot) => {
        setStats(prev => ({ ...prev, failed: snapshot.size }));
      });

      const unsubscribeToday = onSnapshot(todayQuery, (snapshot) => {
        setStats(prev => ({ ...prev, today: snapshot.size }));
        setLoading(false);
      });

      return () => {
        unsubscribeTotal();
        unsubscribeUnusual();
        unsubscribeFailed();
        unsubscribeToday();
      };
    } catch (error) {
      console.error('Error setting up audit stats listener:', error);
      setLoading(false);
    }
  }, []);

  return { stats, loading };
}
