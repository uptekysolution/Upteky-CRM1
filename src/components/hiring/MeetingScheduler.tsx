'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  Phone,
  MapPin,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  candidateName: string;
  candidateEmail: string;
  date: string;
  time: string;
  duration: number;
  type: 'video' | 'phone' | 'in-person';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  interviewer?: string;
  location?: string;
  notes?: string;
  meetingLink?: string;
}

export function MeetingScheduler() {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: '1',
      title: 'Frontend Developer Interview',
      candidateName: 'Sarah Johnson',
      candidateEmail: 'sarah.johnson@email.com',
      date: '2024-01-15',
      time: '14:00',
      duration: 60,
      type: 'video',
      status: 'scheduled',
      interviewer: 'John Smith',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      notes: 'Technical interview focusing on React and TypeScript'
    },
    {
      id: '2',
      title: 'Product Manager Discussion',
      candidateName: 'Michael Chen',
      candidateEmail: 'michael.chen@email.com',
      date: '2024-01-16',
      time: '10:00',
      duration: 45,
      type: 'in-person',
      status: 'scheduled',
      interviewer: 'Lisa Wang',
      location: 'Conference Room A',
      notes: 'Behavioral interview and product strategy discussion'
    }
  ]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');

  const handleScheduleMeeting = (meetingData: Omit<Meeting, 'id'>) => {
    const newMeeting: Meeting = {
      ...meetingData,
      id: Date.now().toString()
    };
    setMeetings(prev => [...prev, newMeeting]);
    setShowForm(false);
    toast({
      title: "Meeting Scheduled!",
      description: `Meeting with ${meetingData.candidateName} has been scheduled successfully.`,
    });
  };

  const handleUpdateStatus = (meetingId: string, status: Meeting['status']) => {
    setMeetings(prev => prev.map(meeting => 
      meeting.id === meetingId ? { ...meeting, status } : meeting
    ));
    toast({
      title: "Status Updated!",
      description: "Meeting status has been updated successfully.",
    });
  };

  const handleDeleteMeeting = (meetingId: string) => {
    setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
    toast({
      title: "Meeting Deleted!",
      description: "Meeting has been removed from the schedule.",
    });
  };

  const filteredMeetings = meetings.filter(meeting => 
    filterStatus === 'all' || meeting.status === filterStatus
  );

  const getStatusStats = () => {
    return {
      scheduled: meetings.filter(m => m.status === 'scheduled').length,
      completed: meetings.filter(m => m.status === 'completed').length,
      cancelled: meetings.filter(m => m.status === 'cancelled').length,
      total: meetings.length
    };
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Meetings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-purple-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-red-50/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meeting Management */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/30 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gradient-to-r from-green-700 to-green-500 rounded-full"></div>
              <CardTitle className="text-xl font-light text-gray-900">Meeting Schedule</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1 bg-white"
              >
                <option value="all">All Meetings</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 rounded-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {filteredMeetings.map((meeting) => (
              <div key={meeting.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    {meeting.type === 'video' && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        <Video className="h-3 w-3 mr-1" />
                        Video
                      </Badge>
                    )}
                    {meeting.type === 'phone' && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <Phone className="h-3 w-3 mr-1" />
                        Phone
                      </Badge>
                    )}
                    {meeting.type === 'in-person' && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        <MapPin className="h-3 w-3 mr-1" />
                        In-Person
                      </Badge>
                    )}
                    
                    {meeting.status === 'scheduled' && (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                        Scheduled
                      </Badge>
                    )}
                    {meeting.status === 'completed' && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        Completed
                      </Badge>
                    )}
                    {meeting.status === 'cancelled' && (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        Cancelled
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                    <p className="text-sm text-gray-600">{meeting.candidateName} • {meeting.candidateEmail}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(meeting.date).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {meeting.time} ({meeting.duration}min)
                      </span>
                      {meeting.interviewer && (
                        <span className="text-xs text-gray-500">
                          Interviewer: {meeting.interviewer}
                        </span>
                      )}
                    </div>
                    {meeting.location && (
                      <p className="text-xs text-gray-500 mt-1">📍 {meeting.location}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {meeting.meetingLink && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(meeting.meetingLink, '_blank')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {meeting.status === 'scheduled' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(meeting.id, 'completed')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(meeting.id, 'cancelled')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMeeting(meeting.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredMeetings.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No meetings found for the selected filter.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Meeting Form */}
      {showForm && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50/30 rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gradient-to-r from-green-700 to-green-500 rounded-full"></div>
              <CardTitle className="text-xl font-light text-gray-900">Schedule New Meeting</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <MeetingForm 
              onSubmit={handleScheduleMeeting}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface MeetingFormProps {
  onSubmit: (meeting: Omit<Meeting, 'id'>) => void;
  onCancel: () => void;
}

function MeetingForm({ onSubmit, onCancel }: MeetingFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    candidateName: '',
    candidateEmail: '',
    date: '',
    time: '',
    duration: 60,
    type: 'video' as const,
    interviewer: '',
    location: '',
    notes: '',
    meetingLink: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Meeting Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Frontend Developer Interview"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="candidateName">Candidate Name</Label>
          <Input
            id="candidateName"
            value={formData.candidateName}
            onChange={(e) => setFormData(prev => ({ ...prev, candidateName: e.target.value }))}
            placeholder="Full name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="candidateEmail">Candidate Email</Label>
          <Input
            id="candidateEmail"
            type="email"
            value={formData.candidateEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, candidateEmail: e.target.value }))}
            placeholder="email@example.com"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="interviewer">Interviewer</Label>
          <Input
            id="interviewer"
            value={formData.interviewer}
            onChange={(e) => setFormData(prev => ({ ...prev, interviewer: e.target.value }))}
            placeholder="Interviewer name"
          />
        </div>
        
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            min="15"
            max="180"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="type">Meeting Type</Label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white"
            required
          >
            <option value="video">Video Call</option>
            <option value="phone">Phone Call</option>
            <option value="in-person">In-Person</option>
          </select>
        </div>
        
        <div>
          <Label htmlFor="location">Location/Link</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder={formData.type === 'video' ? 'Meeting link' : 'Office location'}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about the meeting..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white resize-none"
          rows={3}
        />
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 rounded-lg"
        >
          Schedule Meeting
        </Button>
      </div>
    </form>
  );
}
