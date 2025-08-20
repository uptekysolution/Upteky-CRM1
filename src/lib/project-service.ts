import {
	collection,
	doc,
	getDoc,
	getDocs,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
	Timestamp,
	updateDoc,
	where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ProjectMilestone = {
	id: string;
	title: string;
	dueDate: any;
	completed: boolean;
	progress: number;
};

export type Project = {
	id: string;
	name: string;
	description?: string;
	status: 'Active' | 'Planning' | 'Completed' | 'On Hold' | string;
	assignedTeam?: string;
	deadline?: any;
	progress?: number;
	clientId: string;
	createdAt: any;
	updatedAt?: any;
};

export class ProjectService {
	static async getClientProjects(clientId: string): Promise<Project[]> {
		const q = query(
			collection(db, 'projects'),
			where('clientId', '==', clientId),
			orderBy('createdAt', 'desc')
		);
		const snap = await getDocs(q);
		return snap.docs.map((d) => {
			const data = d.data() as any;
			return {
				id: d.id,
				name: data.name,
				description: data.description,
				status: data.status,
				assignedTeam: data.assignedTeam,
				deadline: data.deadline || null,
				progress: data.progress ?? 0,
				clientId: data.clientId,
				createdAt: data.createdAt || Timestamp.now(),
				updatedAt: data.updatedAt || Timestamp.now()
			} as Project;
		});
	}

	static subscribeToClientProjects(
		clientId: string,
		callback: (projects: Project[]) => void
	) {
		const q = query(
			collection(db, 'projects'),
			where('clientId', '==', clientId),
			orderBy('createdAt', 'desc')
		);
		return onSnapshot(q, (snapshot) => {
			const projects = snapshot.docs.map((d) => {
				const data = d.data() as any;
				return {
					id: d.id,
					name: data.name,
					description: data.description,
					status: data.status,
					assignedTeam: data.assignedTeam,
					deadline: data.deadline || null,
					progress: data.progress ?? 0,
					clientId: data.clientId,
					createdAt: data.createdAt || Timestamp.now(),
					updatedAt: data.updatedAt || Timestamp.now()
				} as Project;
			});
			callback(projects);
		});
	}

	static async getProjectById(projectId: string): Promise<Project | null> {
		const ref = doc(db, 'projects', projectId);
		const snap = await getDoc(ref);
		if (!snap.exists()) return null;
		const data = snap.data() as any;
		return {
			id: snap.id,
			name: data.name,
			description: data.description,
			status: data.status,
			assignedTeam: data.assignedTeam,
			deadline: data.deadline || null,
			progress: data.progress ?? 0,
			clientId: data.clientId,
			createdAt: data.createdAt || Timestamp.now(),
			updatedAt: data.updatedAt || Timestamp.now()
		} as Project;
	}

	static subscribeToProjectMilestones(
		projectId: string,
		callback: (milestones: ProjectMilestone[]) => void
	) {
		const q = query(
			collection(db, 'projects', projectId, 'milestones'),
			orderBy('dueDate', 'asc')
		);
		return onSnapshot(q, (snapshot) => {
			const milestones = snapshot.docs.map((d) => {
				const data = d.data() as any;
				return {
					id: d.id,
					title: data.title,
					completed: Boolean(data.completed),
					progress: data.progress ?? 0,
					dueDate: data.dueDate || Timestamp.now()
				} as ProjectMilestone;
			});
			callback(milestones);
		});
	}

	static async updateMilestone(
		projectId: string,
		milestoneId: string,
		updates: Partial<ProjectMilestone>
	) {
		const ref = doc(db, 'projects', projectId, 'milestones', milestoneId);
		await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
	}
}


