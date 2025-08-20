import {
	collection,
	addDoc,
	getDocs,
	orderBy,
	query,
	serverTimestamp,
	Timestamp,
	where
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export type ProjectDocument = {
	id: string;
	projectId: string;
	name: string;
	path: string;
	version: number;
	uploadedBy: string;
	uploadedAt: any;
	contentType?: string;
	size?: number;
	downloadUrl: string;
};

export class DocumentService {
	static async uploadDocument(
		projectId: string,
		file: File,
		uploadedByUserId: string
	): Promise<ProjectDocument> {
		// Determine the next version for this file name within the project
		const existingSameName = await getDocs(
			query(
				collection(db, 'documents'),
				where('projectId', '==', projectId),
				where('name', '==', file.name)
			)
		);
		const nextVersion = existingSameName.size + 1;

		const storagePath = `projects/${projectId}/documents/${Date.now()}-${file.name}`;
		const storageRef = ref(storage, storagePath);
		await uploadBytes(storageRef, file, { contentType: file.type });
		const url = await getDownloadURL(storageRef);

		// Create Firestore metadata document
		const docRef = await addDoc(collection(db, 'documents'), {
			projectId,
			name: file.name,
			path: storagePath,
			version: nextVersion,
			uploadedBy: uploadedByUserId,
			uploadedAt: serverTimestamp(),
			contentType: file.type,
			size: file.size,
			downloadUrl: url
		});

		return {
			id: docRef.id,
			projectId,
			name: file.name,
			path: storagePath,
			version: nextVersion,
			uploadedBy: uploadedByUserId,
			uploadedAt: Timestamp.now(),
			contentType: file.type,
			size: file.size,
			downloadUrl: url
		};
	}

	static async listProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
		const q = query(
			collection(db, 'documents'),
			where('projectId', '==', projectId),
			orderBy('uploadedAt', 'desc')
		);
		const snap = await getDocs(q);
		return snap.docs.map((d) => {
			const data = d.data() as any;
			return {
				id: d.id,
				projectId: data.projectId,
				name: data.name,
				path: data.path,
				version: data.version || 1,
				uploadedBy: data.uploadedBy,
				uploadedAt: data.uploadedAt || Timestamp.now(),
				contentType: data.contentType,
				size: data.size,
				downloadUrl: data.downloadUrl
			} as ProjectDocument;
		});
	}
}


