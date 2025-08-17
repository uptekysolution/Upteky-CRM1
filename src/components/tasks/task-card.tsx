'use client'

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, Calendar, User, Clock, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { TaskService } from '@/lib/task-service';
import { useToast } from '@/hooks/use-toast';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onProgressChange: (taskId: string, progress: number) => void;
  isAdmin?: boolean;
}

export function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  onProgressChange,
  isAdmin = false 
}: TaskCardProps) {
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getPriorityVariant = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
      case TaskPriority.URGENT:
        return 'destructive';
      case TaskPriority.MEDIUM:
        return 'secondary';
      case TaskPriority.LOW:
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'text-green-600';
      case TaskStatus.IN_PROGRESS:
        return 'text-blue-600';
      case TaskStatus.IN_REVIEW:
        return 'text-amber-600';
      case TaskStatus.TODO:
        return 'text-gray-600';
      case TaskStatus.CANCELLED:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setIsUpdating(true);
    try {
      await TaskService.updateTaskStatus(task.id, newStatus);
      onStatusChange(task.id, newStatus);
      toast({
        title: "Status Updated",
        description: `Task status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProgressChange = async (newProgress: number) => {
    setIsUpdating(true);
    try {
      await TaskService.updateTaskProgress(task.id, newProgress);
      onProgressChange(task.id, newProgress);
      toast({
        title: "Progress Updated",
        description: `Task progress updated to ${newProgress}%`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task progress",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isOverdue = new Date(task.deadline) < new Date() && task.status !== TaskStatus.COMPLETED;

  return (
    <>
      <Card className={`mb-4 transition-all hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">{task.title}</h3>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {task.description}
                </p>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(task.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={`https://placehold.co/32x32.png?text=${task.assigneeName.charAt(0)}`} />
                <AvatarFallback className="text-xs">
                  {task.assigneeName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{task.assigneeName}</span>
            </div>
            <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
              {task.priority}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                <Calendar className="h-3 w-3" />
                {isOverdue ? 'Overdue' : 'Due'} {format(new Date(task.deadline), 'MMM dd')}
              </span>
              <span className="font-medium">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>

          {isAdmin && (
            <div className="mt-3 pt-3 border-t border-muted">
              <div className="flex gap-2">
                <Select
                  value={task.status}
                  onValueChange={(value) => handleStatusChange(value as TaskStatus)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TaskStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={task.progress}
                    onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                    disabled={isUpdating}
                    className="w-20 h-2"
                  />
                  <span className="text-xs text-muted-foreground">{task.progress}%</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{task.title}</span>
              <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">
                {task.description || 'No description provided'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Assignee</h4>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://placehold.co/32x32.png?text=${task.assigneeName.charAt(0)}`} />
                    <AvatarFallback>{task.assigneeName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{task.assigneeName}</p>
                    <p className="text-xs text-muted-foreground">{task.assigneeEmail}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Deadline</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    {format(new Date(task.deadline), 'PPP')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Status</h4>
                <Badge variant="outline" className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2">Progress</h4>
                <div className="flex items-center gap-2">
                  <Progress value={task.progress} className="flex-1" />
                  <span className="text-sm font-medium">{task.progress}%</span>
                </div>
              </div>
            </div>

            {task.estimatedHours && (
              <div>
                <h4 className="font-medium mb-2">Estimated Hours</h4>
                <p className="text-sm text-muted-foreground">{task.estimatedHours} hours</p>
              </div>
            )}

            {task.tags && task.tags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
