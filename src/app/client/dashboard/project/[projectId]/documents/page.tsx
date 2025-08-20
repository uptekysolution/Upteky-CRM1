"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserProfile } from "@/hooks/use-user-profile";
import { DocumentService, ProjectDocument } from "@/lib/document-service";
import { ProjectService } from "@/lib/project-service";
import { ArrowLeft, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ClientProjectDocumentsPage() {
	const params = useParams();
	const router = useRouter();
	const { userProfile } = useUserProfile();
	const { toast } = useToast();
	const projectId = params.projectId as string;

	const [projectName, setProjectName] = useState<string>("");
	const [documents, setDocuments] = useState<ProjectDocument[]>([]);
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		const load = async () => {
			if (!projectId) return;
			const p = await ProjectService.getProjectById(projectId);
			if (!p || (userProfile?.id && p.clientId !== userProfile.id)) {
				setProjectName("");
				setDocuments([]);
				return;
			}
			setProjectName(p.name);
			const docs = await DocumentService.listProjectDocuments(projectId);
			setDocuments(docs);
		};
		load();
	}, [projectId, userProfile?.id]);

	const onUpload = async (file: File) => {
		if (!userProfile?.id) return;
		setUploading(true);
		try {
			const created = await DocumentService.uploadDocument(projectId, file, userProfile.id);
			setDocuments((prev) => [created, ...prev]);
			toast({ title: 'File uploaded' });
		} catch (e) {
			console.error(e);
			toast({ variant: 'destructive', title: 'Upload failed' });
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={() => router.back()}>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
					<p className="text-gray-600">{projectName || 'Project'} files</p>
				</div>
			</div>

			<Card className="rounded-2xl shadow-sm">
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Upload</CardTitle>
						<CardDescription>Upload project-related files</CardDescription>
					</div>
					<label className="inline-flex items-center gap-2 cursor-pointer">
						<Input
							type="file"
							className="hidden"
							onChange={(e) => {
								const f = e.target.files?.[0];
								if (f) void onUpload(f);
							}}
							disabled={uploading}
						/>
						<span className="px-3 py-2 rounded-md bg-[#F7931E] text-white text-sm inline-flex items-center gap-2">
							<Upload className="h-4 w-4" />
							{uploading ? 'Uploading...' : 'Upload File'}
						</span>
					</label>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Size</TableHead>
								<TableHead>Uploaded</TableHead>
								<TableHead>Action</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{documents.map((doc) => (
								<TableRow key={doc.id}>
									<TableCell>{doc.name}</TableCell>
									<TableCell>{doc.contentType || 'File'}</TableCell>
									<TableCell>{doc.size ? `${(doc.size / 1024 / 1024).toFixed(1)} MB` : '-'}</TableCell>
									<TableCell>
										{doc.uploadedAt?.toDate ? doc.uploadedAt.toDate().toLocaleDateString() : 'N/A'}
									</TableCell>
									<TableCell>
										<a className="text-[#F7931E]" href={doc.downloadUrl} target="_blank" rel="noreferrer">Download</a>
									</TableCell>
								</TableRow>
							))}
							{documents.length === 0 && (
								<TableRow>
									<TableCell colSpan={5} className="text-center text-gray-500 py-8">No documents uploaded yet.</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}


