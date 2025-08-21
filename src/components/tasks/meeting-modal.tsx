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
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Meeting, MeetingStatus } from '@/types/task';
import { User } from '@/lib/user-service';
import { MeetingService } from '@/lib/meeting-service';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting?: Meeting | null;
  users: User[];
  onSuccess: () => void;
  initialDate?: Date; // New prop for pre-filling date
}

export function MeetingModal({ isOpen, onClose, meeting, users, onSuccess, initialDate }: MeetingModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    agenda: '',
    date: new Date(),
    startTime: '09:00',
    endTime: '10:00',
    participants: [] as string[],
    location: '',
    meetingLink: '',
    notes: ''
  });

  useEffect(() => {
    if (meeting) {
      setFormData({
        title: meeting.title,
        agenda: meeting.agenda,
        date: meeting.date,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        participants: meeting.participants.map(p => p.userId),
        location: meeting.location || '',
        meetingLink: meeting.meetingLink || '',
        notes: meeting.notes || ''
      });
    } else {
      setFormData({
        title: '',
        agenda: '',
        date: initialDate || new Date(),
        startTime: '09:00',
        endTime: '10:00',
        participants: [],
        location: '',
        meetingLink: '',
        notes: ''
      });
    }
  }, [meeting, initialDate]);

  // Debug logging for users
  useEffect(() => {
    console.log('MeetingModal - Users received:', users);
    console.log('MeetingModal - Users length:', users.length);
  }, [users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (meeting) {
        // Update existing meeting
        const updatedParticipants = users
          .filter(user => formData.participants.includes(user.id))
          .map(user => ({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            attended: meeting.participants.find(p => p.userId === user.id)?.attended || false,
            response: meeting.participants.find(p => p.userId === user.id)?.response || 'pending'
          }));

        await MeetingService.updateMeeting(meeting.id, {
          ...formData,
          date: formData.date,
          participants: updatedParticipants
        });
        toast({
          title: "Meeting Updated",
          description: "Meeting has been updated successfully.",
        });
      } else {
        // Create new meeting
        if (formData.participants.length === 0) {
          throw new Error('Please select at least one participant');
        }

        const participants = users
          .filter(user => formData.participants.includes(user.id))
          .map(user => ({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            attended: false,
            response: 'pending' as const
          }));
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('You must be signed in');
        }
        const token = await currentUser.getIdToken();

        const res = await fetch('/api/meetings/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            date: formData.date,
            participants,
            status: MeetingStatus.SCHEDULED,
          }),
        });
        if (!res.ok) {
          if (res.status === 403) throw new Error('You are not allowed to schedule meetings');
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to create meeting');
        }
        toast({
          title: "Meeting Created",
          description: "New meeting has been created successfully.",
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save meeting.",
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

  const handleParticipantToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter(id => id !== userId)
        : [...prev.participants, userId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meeting ? 'Edit Meeting' : 'Schedule New Meeting'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter meeting title"
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agenda">Agenda *</Label>
            <Textarea
              id="agenda"
              value={formData.agenda}
              onChange={(e) => handleInputChange('agenda', e.target.value)}
              placeholder="Enter meeting agenda"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Meeting room or address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input
                id="meetingLink"
                value={formData.meetingLink}
                onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                placeholder="Zoom, Teams, or other link"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants *
            </Label>
            {users.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={user.id}
                      checked={formData.participants.includes(user.id)}
                      onCheckedChange={() => handleParticipantToggle(user.id)}
                    />
                    <Label htmlFor={user.id} className="text-sm">
                      {user.name} ({user.role})
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-md p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No users available. Please check your backend connection.
                </p>
              </div>
            )}
            {users.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No users found. Please check your backend connection.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional information"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || users.length === 0}>
              {isLoading ? 'Saving...' : (meeting ? 'Update Meeting' : 'Schedule Meeting')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
