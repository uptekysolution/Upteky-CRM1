'use client'

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { User } from '@/lib/user-service';
import { TaskService } from '@/lib/task-service';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  employees: User[];
  onSuccess: () => void;
  initialDate?: Date; // New prop for pre-filling deadline
}

export function TaskModal({ isOpen, onClose, task, employees, onSuccess, initialDate }: TaskModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: new Date(),
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    assigneeId: '',
    estimatedHours: 0
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        priority: task.priority,
        status: task.status,
        assigneeId: task.assigneeId,
        estimatedHours: task.estimatedHours || 0
      });
    } else {
      setFormData({
        title: '',
        description: '',
        deadline: initialDate || new Date(),
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        assigneeId: '',
        estimatedHours: 0
      });
    }
  }, [task, initialDate]);

  // Debug logging for employees
  useEffect(() => {
    console.log('TaskModal - Employees received:', employees);
    console.log('TaskModal - Employees length:', employees.length);
  }, [employees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (task) {
        // Update existing task
        await TaskService.updateTask(task.id, {
          ...formData,
          deadline: formData.deadline
        });
        toast({
          title: "Task Updated",
          description: "Task has been updated successfully.",
        });
      } else {
        // Create new task
        const selectedEmployee = employees.find(emp => emp.id === formData.assigneeId);
        if (!selectedEmployee) {
          throw new Error('Please select an employee');
        }

        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('You must be signed in');
        }
        const token = await currentUser.getIdToken();

        const res = await fetch('/api/tasks/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            deadline: formData.deadline,
            assigneeName: selectedEmployee.name,
            assigneeEmail: selectedEmployee.email,
            progress: 0,
          }),
        });
        if (!res.ok) {
          if (res.status === 403) throw new Error('You are not allowed to create tasks');
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to create task');
        }
        toast({
          title: "Task Created",
          description: "New task has been created successfully.",
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save task.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignee">Assign To *</Label>
              <Select
                value={formData.assigneeId}
                onValueChange={(value) => handleInputChange('assigneeId', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={employees.length > 0 ? "Select employee" : "Loading employees..."} />
                </SelectTrigger>
                <SelectContent>
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} ({employee.role})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No employees available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {employees.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No employees found. Please check your backend connection.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Deadline *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? format(formData.deadline, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(date) => date && handleInputChange('deadline', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TaskPriority).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              min="0"
              step="0.5"
              value={formData.estimatedHours}
              onChange={(e) => handleInputChange('estimatedHours', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || employees.length === 0}>
              {isLoading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
