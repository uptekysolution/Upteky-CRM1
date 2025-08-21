'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TimesheetEntry, Project } from '@/types/timesheet';

interface TimesheetEntryFormProps {
  entry?: TimesheetEntry;
  projects: Project[];
  date: Date;
  onSave: (entry: TimesheetEntry) => void;
  onCancel: () => void;
}

export function TimesheetEntryForm({ entry, projects, date, onSave, onCancel }: TimesheetEntryFormProps) {
  const [formData, setFormData] = useState({
    projectId: entry?.projectId || '',
    projectName: entry?.projectName || '',
    taskId: entry?.taskId || '',
    taskName: entry?.taskName || '',
    hours: entry?.hours || 0,
    notes: entry?.notes || '',
    startTime: entry?.startTime || '',
    endTime: entry?.endTime || ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setFormData(prev => ({
      ...prev,
      projectId,
      projectName: project?.name || ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || formData.hours <= 0) {
      return;
    }

    const newEntry: TimesheetEntry = {
      id: entry?.id || `entry-${Date.now()}`,
      date,
      projectId: formData.projectId,
      projectName: formData.projectName,
      taskId: formData.taskId || undefined,
      taskName: formData.taskName || undefined,
      hours: formData.hours,
      notes: formData.notes || undefined,
      startTime: formData.startTime || undefined,
      endTime: formData.endTime || undefined
    };

    onSave(newEntry);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={() => {}} // Read-only for this form
                initialFocus
                disabled
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="project">Project *</Label>
          <Select
            value={formData.projectId}
            onValueChange={handleProjectChange}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours">Hours *</Label>
          <Input
            id="hours"
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={formData.hours}
            onChange={(e) => handleInputChange('hours', parseFloat(e.target.value) || 0)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="taskName">Task/Activity</Label>
          <Input
            id="taskName"
            value={formData.taskName}
            onChange={(e) => handleInputChange('taskName', e.target.value)}
            placeholder="What did you work on?"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes or comments..."
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1">
            <Plus className="mr-2 h-4 w-4" />
            {entry ? 'Update Entry' : 'Add Entry'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
