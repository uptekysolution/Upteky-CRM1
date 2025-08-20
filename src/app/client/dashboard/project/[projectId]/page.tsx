"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Project, ProjectMilestone, ProjectService } from "@/lib/project-service";

export default function ClientProjectDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { userProfile } = useUserProfile();
	const projectId = params.projectId as string;

	const [project, setProject] = useState<Project | null>(null);
	const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let unsub: (() => void) | null = null;
		const load = async () => {
			if (!projectId) return;
			setLoading(true);
			const p = await ProjectService.getProjectById(projectId);
			setProject(p);
			unsub = ProjectService.subscribeToProjectMilestones(projectId, setMilestones);
			setLoading(false);
		};
		load();
		return () => {
			if (unsub) unsub();
		};
	}, [projectId]);

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => router.back()}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
				</div>
				<div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
			</div>
		);
	}

	if (!project || (userProfile?.id && project.clientId !== userProfile.id)) {
		return (
			<div className="text-center py-12">
				<AlertCircle className="h-10 w-10 mx-auto text-gray-400 mb-2" />
				<h2 className="text-2xl font-semibold text-gray-900 mb-2">Project not found</h2>
				<p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
				<Button onClick={() => router.push('/client/dashboard')}>Back to Dashboard</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={() => router.back()}>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
					<p className="text-gray-600">Project overview and milestones</p>
				</div>
				<Badge>{project.status}</Badge>
			</div>

			<Card className="rounded-2xl shadow-sm">
				<CardHeader>
					<CardTitle>Progress</CardTitle>
					<CardDescription>Overall project progress</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between text-sm mb-2">
						<span className="text-gray-600">Completion</span>
						<span className="font-medium">{project.progress ?? 0}%</span>
					</div>
					<Progress value={project.progress ?? 0} className="h-2" />
				</CardContent>
			</Card>

			<Card className="rounded-2xl shadow-sm">
				<CardHeader>
					<CardTitle>Milestones</CardTitle>
					<CardDescription>Track key stages</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{milestones.length === 0 && (
							<p className="text-gray-500">No milestones created for this project yet.</p>
						)}
						{milestones.map((m) => (
							<div key={m.id} className="flex items-center justify-between">
								<div>
									<p className={`font-medium ${m.completed ? 'line-through text-gray-500' : ''}`}>{m.title}</p>
									<p className="text-xs text-gray-500">Due {m.dueDate?.toDate ? m.dueDate.toDate().toLocaleDateString() : 'N/A'}</p>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-48">
										<Progress value={m.progress ?? 0} className="h-2" />
									</div>
									<Button
										size="sm"
										variant="outline"
										onClick={async () => {
											await ProjectService.updateMilestone(project.id, m.id, { completed: !m.completed, progress: !m.completed ? 100 : 0 });
										}}
									>
										{m.completed ? 'Reopen' : 'Complete'}
									</Button>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}


