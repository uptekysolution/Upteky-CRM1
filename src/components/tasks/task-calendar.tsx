'use client'

import React, { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Task, Meeting, CalendarEvent } from '@/types/task';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarIcon, CheckSquare, Users, Edit3, CheckCircle } from 'lucide-react';
import { QuickEditModal } from './quick-edit-modal';
import { useToast } from '@/hooks/use-toast';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Helper functions moved outside component to avoid initialization issues
const getTaskColor = (priority: string) => {
  switch (priority) {
    case 'High':
    case 'Urgent':
      return '#ef4444'; // red
    case 'Medium':
      return '#f59e0b'; // amber
    case 'Low':
      return '#10b981'; // emerald
    default:
      return '#6b7280'; // gray
  }
};

const getMeetingColor = (status: string) => {
  switch (status) {
    case 'Scheduled':
      return '#3b82f6'; // blue
    case 'In Progress':
      return '#f59e0b'; // amber
    case 'Completed':
      return '#10b981'; // emerald
    case 'Cancelled':
      return '#6b7280'; // gray
    default:
      return '#3b82f6'; // blue
  }
};

interface TaskCalendarProps {
  tasks: Task[];
  meetings: Meeting[];
  onEventClick: (event: CalendarEvent) => void;
  onAddTask?: (date: Date) => void;
  onAddMeeting?: (date: Date) => void;
  onEventUpdate?: () => void;
  className?: string;
}

export function TaskCalendar({ 
  tasks, 
  meetings, 
  onEventClick, 
  onAddTask, 
  onAddMeeting, 
  onEventUpdate,
  className 
}: TaskCalendarProps) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showQuickEditDialog, setShowQuickEditDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(Views.MONTH);

  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Convert tasks to calendar events
    tasks.forEach(task => {
      const startDate = new Date(task.deadline);
      const endDate = new Date(task.deadline);
      endDate.setHours(endDate.getHours() + 1); // 1 hour duration for tasks

      calendarEvents.push({
        id: task.id,
        title: `📋 ${task.title}`,
        start: startDate,
        end: endDate,
        type: 'task',
        data: task,
        color: getTaskColor(task.priority)
      });
    });

    // Convert meetings to calendar events
    meetings.forEach(meeting => {
      const startDate = new Date(meeting.date);
      const [startHour, startMinute] = meeting.startTime.split(':').map(Number);
      const [endHour, endMinute] = meeting.endTime.split(':').map(Number);
      
      startDate.setHours(startHour, startMinute, 0, 0);
      const endDate = new Date(meeting.date);
      endDate.setHours(endHour, endMinute, 0, 0);

      calendarEvents.push({
        id: meeting.id,
        title: `📅 ${meeting.title}`,
        start: startDate,
        end: endDate,
        type: 'meeting',
        data: meeting,
        color: getMeetingColor(meeting.status)
      });
    });

    return calendarEvents;
  }, [tasks, meetings]);

  const eventStyleGetter = (event: any) => {
    const isTask = event.type === 'task';
    const isMeeting = event.type === 'meeting';
    
    return {
      style: {
        backgroundColor: event.color,
        color: '#ffffff',
        borderRadius: '6px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        padding: '2px 4px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        ':hover': {
          transform: 'scale(1.02)',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
        }
      }
    };
  };

  const handleEventClick = (event: any) => {
    const calendarEvent = events.find(e => e.id === event.id);
    if (calendarEvent) {
      setSelectedEvent(calendarEvent);
      setShowQuickEditDialog(true);
    }
  };

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedDate(slotInfo.start);
    setShowAddDialog(true);
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView: string) => {
    setCurrentView(newView);
  };

  const handleAddTask = () => {
    if (selectedDate && onAddTask) {
      onAddTask(selectedDate);
      toast({
        title: "Task Added",
        description: `Task will appear on ${format(selectedDate, 'MMMM d, yyyy')}`,
      });
    }
    setShowAddDialog(false);
  };

  const handleAddMeeting = () => {
    if (selectedDate && onAddMeeting) {
      onAddMeeting(selectedDate);
      toast({
        title: "Meeting Added",
        description: `Meeting will appear on ${format(selectedDate, 'MMMM d, yyyy')}`,
      });
    }
    setShowAddDialog(false);
  };

  const handleQuickEditSuccess = () => {
    if (onEventUpdate) {
      onEventUpdate();
    }
    toast({
      title: "Event Updated",
      description: "Calendar has been updated with your changes.",
    });
  };

  const handleQuickEditClose = () => {
    setShowQuickEditDialog(false);
    setSelectedEvent(null);
  };

  return (
    <>
      <div className={cn("h-full", className)}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleEventClick}
          onSelectSlot={handleSelectSlot}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          date={currentDate}
          view={currentView}
          selectable
          popup
          tooltipAccessor={(event) => {
            if (event.type === 'task') {
              const task = event.data as Task;
              return `${task.title}\nAssignee: ${task.assigneeName}\nStatus: ${task.status}\nPriority: ${task.priority}\n\nClick to edit`;
            } else {
              const meeting = event.data as Meeting;
              return `${meeting.title}\nAgenda: ${meeting.agenda}\nParticipants: ${meeting.participants.length}\n\nClick to edit`;
            }
          }}
          messages={{
            next: "Next",
            previous: "Previous",
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
            agenda: "Agenda",
            noEventsInRange: "No events in this range.",
          }}
          views={['month', 'week', 'day', 'agenda']}
          defaultView={Views.MONTH}
          step={60}
          timeslots={1}
          min={new Date(0, 0, 0, 0, 0, 0)}
          max={new Date(0, 0, 0, 23, 59, 59)}
        />
      </div>

      {/* Add Task/Meeting Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              What would you like to add for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'this date'}?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleAddTask}
                className="h-20 flex flex-col items-center justify-center space-y-2"
                variant="outline"
              >
                <CheckSquare className="h-6 w-6" />
                <span>Add Task</span>
              </Button>
              <Button
                onClick={handleAddMeeting}
                className="h-20 flex flex-col items-center justify-center space-y-2"
                variant="outline"
              >
                <Users className="h-6 w-6" />
                <span>Add Meeting</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Edit Modal */}
      <QuickEditModal
        isOpen={showQuickEditDialog}
        onClose={handleQuickEditClose}
        event={selectedEvent}
        onSuccess={handleQuickEditSuccess}
      />
    </>
  );
}
