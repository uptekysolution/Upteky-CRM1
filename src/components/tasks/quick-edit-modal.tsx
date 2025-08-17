'use client'

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, TaskStatus, TaskPriority, Meeting, MeetingStatus, CalendarEvent } from '@/types/task';
import { TaskService } from '@/lib/task-service';
import { MeetingService } from '@/lib/meeting-service';
import { useToast } from '@/hooks/use-toast';

interface QuickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onSuccess: () => void;
}

export function QuickEditModal({ isOpen, onClose, event, onSuccess }: QuickEditModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date(),
    status: '',
    priority: ''
  });

  useEffect(() => {
    if (event) {
      if (event.type === 'task') {
        const task = event.data as Task;
        setFormData({
          title: task.title,
          date: task.deadline,
          status: task.status,
          priority: task.priority
        });
      } else {
        const meeting = event.data as Meeting;
        setFormData({
          title: meeting.title,
          date: meeting.date,
          status: meeting.status,
          priority: ''
        });
      }
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setIsLoading(true);

    try {
      if (event.type === 'task') {
        const task = event.data as Task;
        await TaskService.updateTask(task.id, {
          title: formData.title,
          deadline: formData.date,
          status: formData.status as TaskStatus,
          priority: formData.priority as TaskPriority
        });
        toast({
          title: "Task Updated",
          description: "Task has been updated successfully.",
        });
      } else {
        const meeting = event.data as Meeting;
        await MeetingService.updateMeeting(meeting.id, {
          title: formData.title,
          date: formData.date,
          status: formData.status as MeetingStatus
        });
        toast({
          title: "Meeting Updated",
          description: "Meeting has been updated successfully.",
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update item.",
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

  if (!event) return null;

  const isTask = event.type === 'task';
  const item = event.data as Task | Meeting;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Quick Edit {isTask ? 'Task' : 'Meeting'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={`Enter ${isTask ? 'task' : 'meeting'} title`}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && handleInputChange('date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
                {isTask ? (
                  Object.values(TaskStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))
                ) : (
                  Object.values(MeetingStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {isTask && (
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
          )}

          <div className="text-sm text-muted-foreground">
            <p><strong>Current Details:</strong></p>
            <p>Type: {isTask ? 'Task' : 'Meeting'}</p>
            {isTask && (
              <>
                <p>Assignee: {(item as Task).assigneeName}</p>
                <p>Priority: {(item as Task).priority}</p>
              </>
            )}
            {!isTask && (
              <>
                <p>Participants: {(item as Meeting).participants.length}</p>
                <p>Time: {(item as Meeting).startTime} - {(item as Meeting).endTime}</p>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
