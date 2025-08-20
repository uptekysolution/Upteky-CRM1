import { addDoc, collection, orderBy, query, serverTimestamp, getDocs, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ActivityLog = {
	id: string;
	clientId: string;
	type: 'project' | 'ticket' | 'document' | 'milestone' | string;
	action: string;
	details?: string;
	timestamp: any;
	userId?: string;
};

export class ActivityService {
	static async logActivity(
		clientId: string,
		type: ActivityLog['type'],
		action: string,
		details?: string,
		userId?: string
	): Promise<string> {
		const ref = await addDoc(collection(db, 'activities'), {
			clientId,
			type,
			action,
			details: details || null,
			userId: userId || null,
			timestamp: serverTimestamp()
		});
		return ref.id;
	}

	static async listClientActivities(clientId: string): Promise<ActivityLog[]> {
		const q = query(
			collection(db, 'activities'),
			where('clientId', '==', clientId),
			orderBy('timestamp', 'desc')
		);
		const snap = await getDocs(q);
		return snap.docs.map((d) => {
			const data = d.data() as any;
			return {
				id: d.id,
				clientId: data.clientId,
				type: data.type,
				action: data.action,
				details: data.details || null,
				timestamp: data.timestamp || Timestamp.now(),
				userId: data.userId || null
			} as ActivityLog;
		});
	}

	static subscribeToClientActivities(
		clientId: string,
		callback: (activities: ActivityLog[]) => void
	) {
		const q = query(
			collection(db, 'activities'),
			where('clientId', '==', clientId),
			orderBy('timestamp', 'desc')
		);
		return onSnapshot(q, (snapshot) => {
			const items: ActivityLog[] = snapshot.docs.map((d) => {
				const data = d.data() as any;
				return {
					id: d.id,
					clientId: data.clientId,
					type: data.type,
					action: data.action,
					details: data.details || null,
					timestamp: data.timestamp || Timestamp.now(),
					userId: data.userId || null
				} as ActivityLog;
			});
			callback(items);
		});
	}
}


