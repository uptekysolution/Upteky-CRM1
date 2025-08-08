
'use client'

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

// Mock Data for Tasks
const tasks = [
    { id: 'task-1', title: 'Develop new homepage design', assignee: 'Jane Smith', assigneeInitials: 'JS', dueDate: '2024-08-15', status: 'In Progress', progress: 60, priority: 'High' },
    { id: 'task-2', title: 'Fix login page bug', assignee: 'John Doe', assigneeInitials: 'JD', dueDate: '2024-08-10', status: 'In Review', progress: 100, priority: 'High' },
    { id: 'task-3', title: 'Setup CI/CD pipeline', assignee: 'Peter Jones', assigneeInitials: 'PJ', dueDate: '2024-08-20', status: 'To Do', progress: 10, priority: 'Medium' },
    { id: 'task-4', title: 'Write documentation for API', assignee: 'Jane Smith', assigneeInitials: 'JS', dueDate: '2024-08-25', status: 'To Do', progress: 0, priority: 'Low' },
    { id: 'task-5', title: 'Deploy marketing website', assignee: 'Admin User', assigneeInitials: 'AU', dueDate: '2024-08-05', status: 'Done', progress: 100, priority: 'Medium' },
    { id: 'task-6', title: 'User research for new feature', assignee: 'John Doe', assigneeInitials: 'JD', dueDate: '2024-09-01', status: 'In Progress', progress: 30, priority: 'Medium' },
];

const taskStatuses = ["To Do", "In Progress", "In Review", "Done"];

const getPriorityVariant = (priority: string) => {
    switch (priority) {
        case 'High': return 'destructive';
        case 'Medium': return 'secondary';
        case 'Low': return 'outline';
        default: return 'default';
    }
}

const TaskCard = ({ task }: { task: typeof tasks[0] }) => (
    <Card className="mb-4">
        <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-sm">{task.title}</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>Move</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Log Time</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://placehold.co/32x32.png?text=${task.assigneeInitials}`} />
                        <AvatarFallback>{task.assigneeInitials}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{task.assignee}</span>
                </div>
                 <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
            </div>

            <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">Due: {task.dueDate}</span>
                    <span className="text-xs font-semibold">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-2" />
            </div>
        </CardContent>
    </Card>
);


export default function TasksPage() {
  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
            <div>
                <h1 className="text-2xl font-bold">Task Management</h1>
                <p className="text-muted-foreground">Organize, assign, and track your team's work.</p>
            </div>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Task
            </Button>
        </div>

        <div className="flex-1 overflow-x-auto">
            <div className="grid grid-cols-[repeat(4,minmax(300px,1fr))] gap-4 pb-4">
                {taskStatuses.map(status => {
                    const statusTasks = tasks.filter(task => task.status === status);
                    return (
                        <div key={status} className="bg-muted/50 rounded-lg p-4">
                            <h2 className="font-semibold mb-4 flex justify-between items-center">
                                {status}
                                <span className="text-sm font-normal bg-background rounded-full px-2 py-0.5">{statusTasks.length}</span>
                            </h2>
                            <div className="flex-1">
                                {statusTasks.length > 0 ? (
                                    statusTasks.map(task => <TaskCard key={task.id} task={task} />)
                                ) : (
                                    <p className="text-xs text-muted-foreground text-center pt-8">No tasks in this stage.</p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    </div>
  );
}
