'use client'

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Calendar, Clock, MapPin, Users, Video, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Meeting, MeetingStatus } from '@/types/task';
import { MeetingService } from '@/lib/meeting-service';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface MeetingCardProps {
  meeting: Meeting;
  onEdit: (meeting: Meeting) => void;
  onDelete: (meetingId: string) => void;
  onStatusChange: (meetingId: string, status: MeetingStatus) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function MeetingCard({ 
  meeting, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  currentUserId,
  isAdmin = false 
}: MeetingCardProps) {
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusVariant = (status: MeetingStatus) => {
    switch (status) {
      case MeetingStatus.COMPLETED:
        return 'default';
      case MeetingStatus.IN_PROGRESS:
        return 'secondary';
      case MeetingStatus.SCHEDULED:
        return 'outline';
      case MeetingStatus.CANCELLED:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: MeetingStatus) => {
    switch (status) {
      case MeetingStatus.COMPLETED:
        return 'text-green-600';
      case MeetingStatus.IN_PROGRESS:
        return 'text-blue-600';
      case MeetingStatus.SCHEDULED:
        return 'text-gray-600';
      case MeetingStatus.CANCELLED:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const isUpcoming = new Date(meeting.date) > new Date();
  const isToday = format(new Date(meeting.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const currentParticipant = meeting.participants.find(p => p.userId === currentUserId);

  const handleAttendanceToggle = async (attended: boolean) => {
    if (!currentUserId) return;
    
    setIsUpdating(true);
    try {
      await MeetingService.markParticipantAttended(meeting.id, currentUserId, attended);
      toast({
        title: "Attendance Updated",
        description: attended ? "Marked as attended" : "Marked as not attended",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: MeetingStatus) => {
    setIsUpdating(true);
    try {
      await MeetingService.updateMeetingStatus(meeting.id, newStatus);
      onStatusChange(meeting.id, newStatus);
      toast({
        title: "Status Updated",
        description: `Meeting status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update meeting status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Card className={`mb-4 transition-all hover:shadow-md ${
        isToday ? 'border-blue-200 bg-blue-50' : 
        isUpcoming ? 'border-green-200' : 'border-gray-200'
      }`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">{meeting.title}</h3>
              {meeting.agenda && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {meeting.agenda}
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
                    <DropdownMenuItem onClick={() => onEdit(meeting)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(meeting.id)}
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
          
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className={isToday ? 'text-blue-600 font-medium' : ''}>
                {format(new Date(meeting.date), 'MMM dd, yyyy')}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{meeting.startTime} - {meeting.endTime}</span>
            </div>

            {meeting.location && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{meeting.location}</span>
              </div>
            )}

            {meeting.meetingLink && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Video className="h-3 w-3" />
                <span>Virtual meeting</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {meeting.participants.length} participants
              </span>
            </div>
            
            <Badge variant={getStatusVariant(meeting.status)} className="text-xs">
              {meeting.status}
            </Badge>
          </div>

          {/* Attendance checkbox for participants */}
          {currentParticipant && (
            <div className="mt-3 pt-3 border-t border-muted">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`attendance-${meeting.id}`}
                  checked={currentParticipant.attended}
                  onCheckedChange={(checked) => handleAttendanceToggle(checked as boolean)}
                  disabled={isUpdating}
                />
                <Label htmlFor={`attendance-${meeting.id}`} className="text-xs">
                  Mark as attended
                </Label>
              </div>
            </div>
          )}

          {/* Admin controls */}
          {isAdmin && (
            <div className="mt-3 pt-3 border-t border-muted">
              <select
                value={meeting.status}
                onChange={(e) => handleStatusChange(e.target.value as MeetingStatus)}
                disabled={isUpdating}
                className="text-xs border rounded px-2 py-1"
              >
                {Object.values(MeetingStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{meeting.title}</span>
              <Badge variant={getStatusVariant(meeting.status)}>{meeting.status}</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Agenda</h4>
              <p className="text-sm text-muted-foreground">
                {meeting.agenda || 'No agenda provided'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Date & Time</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(meeting.date), 'PPP')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{meeting.startTime} - {meeting.endTime}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Location</h4>
                <div className="space-y-1 text-sm">
                  {meeting.location ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{meeting.location}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No location specified</span>
                  )}
                  
                  {meeting.meetingLink && (
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={meeting.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Join meeting
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Participants ({meeting.participants.length})</h4>
              <div className="space-y-2">
                {meeting.participants.map((participant) => (
                  <div key={participant.userId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://placehold.co/32x32.png?text=${participant.userName.charAt(0)}`} />
                        <AvatarFallback className="text-xs">
                          {participant.userName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{participant.userName}</p>
                        <p className="text-xs text-muted-foreground">{participant.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={participant.response === 'accepted' ? 'default' : 'secondary'}>
                        {participant.response}
                      </Badge>
                      {participant.attended && (
                        <Badge variant="outline" className="text-green-600">
                          Attended
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {meeting.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{meeting.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
