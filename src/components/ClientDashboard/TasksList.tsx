"use client";

import { useCallback } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/lib/firebase';

type Props = {
	tasks: Task[];
};

const statusColor = (status: TaskStatus) => {
	switch (status) {
		case TaskStatus.COMPLETED:
			return 'bg-green-500';
		case TaskStatus.IN_PROGRESS:
			return 'bg-blue-500';
		case TaskStatus.IN_REVIEW:
			return 'bg-purple-500';
		case TaskStatus.TODO:
			return 'bg-gray-500';
		default:
			return 'bg-gray-500';
	}
};

export default function TasksList({ tasks }: Props) {
	const markComplete = useCallback(async (taskId: string) => {
		const user = auth.currentUser;
		if (!user) return;
		const token = await user.getIdToken();
		await fetch('/api/tasks/update-status', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify({ taskId, status: TaskStatus.COMPLETED }),
		});
	}, []);

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Title</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Progress</TableHead>
					<TableHead>Deadline</TableHead>
					<TableHead>Action</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{tasks.map((t) => (
					<TableRow key={t.id}>
						<TableCell className="font-medium">{t.title}</TableCell>
						<TableCell>
							<Badge className={statusColor(t.status)}>{t.status}</Badge>
						</TableCell>
						<TableCell className="w-64">
							<div className="flex items-center justify-between text-xs mb-1">
								<span>{Math.round(t.progress ?? 0)}%</span>
							</div>
							<Progress value={t.progress ?? 0} className="h-2" />
						</TableCell>
						<TableCell className="text-sm text-gray-600">{t.deadline?.toLocaleDateString?.() || new Date(t.deadline).toLocaleDateString()}</TableCell>
						<TableCell>
							{t.status !== TaskStatus.COMPLETED && (
								<Button size="sm" variant="outline" onClick={() => markComplete(t.id)}>Mark Complete</Button>
							)}
						</TableCell>
					</TableRow>
				))}
				{tasks.length === 0 && (
					<TableRow>
						<TableCell colSpan={5} className="text-center text-gray-500 py-8">No tasks found</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}


