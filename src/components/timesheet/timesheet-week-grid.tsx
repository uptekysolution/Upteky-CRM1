'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Clock, Calendar } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { TimesheetEntry, Project, TimesheetStatus } from '@/types/timesheet';
import { TimesheetEntryForm } from './timesheet-entry-form';

interface TimesheetWeekGridProps {
  weekStart: Date;
  entries: TimesheetEntry[];
  projects: Project[];
  status: TimesheetStatus;
  onAddEntry: (entry: TimesheetEntry) => void;
  onUpdateEntry: (entry: TimesheetEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}

export function TimesheetWeekGrid({ 
  weekStart, 
  entries, 
  projects, 
  status, 
  onAddEntry, 
  onUpdateEntry, 
  onDeleteEntry 
}: TimesheetWeekGridProps) {
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null);

  // Generate week days
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    weekDays.push(day);
  }

  const getEntriesForDay = (date: Date) => {
    return entries.filter(entry => isSameDay(entry.date, date));
  };

  const getTotalHoursForDay = (date: Date) => {
    return getEntriesForDay(date).reduce((total, entry) => total + entry.hours, 0);
  };

  const handleAddEntry = (date: Date) => {
    setSelectedDate(date);
    setEditingEntry(null);
    setShowEntryForm(true);
  };

  const handleEditEntry = (entry: TimesheetEntry) => {
    setSelectedDate(entry.date);
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleSaveEntry = (entry: TimesheetEntry) => {
    if (editingEntry) {
      onUpdateEntry(entry);
    } else {
      onAddEntry(entry);
    }
    setShowEntryForm(false);
    setSelectedDate(null);
    setEditingEntry(null);
  };

  const handleCancelEntry = () => {
    setShowEntryForm(false);
    setSelectedDate(null);
    setEditingEntry(null);
  };

  const canEdit = status === TimesheetStatus.DRAFT;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Week of {format(weekStart, 'MMM d, yyyy')}
            </span>
            <Badge variant={status === TimesheetStatus.DRAFT ? 'secondary' : 
                          status === TimesheetStatus.SUBMITTED ? 'default' :
                          status === TimesheetStatus.APPROVED ? 'default' : 'destructive'}>
              {status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-4">
            {/* Header row */}
            <div className="font-semibold text-sm text-muted-foreground">Day</div>
            <div className="font-semibold text-sm text-muted-foreground">Mon</div>
            <div className="font-semibold text-sm text-muted-foreground">Tue</div>
            <div className="font-semibold text-sm text-muted-foreground">Wed</div>
            <div className="font-semibold text-sm text-muted-foreground">Thu</div>
            <div className="font-semibold text-sm text-muted-foreground">Fri</div>
            <div className="font-semibold text-sm text-muted-foreground">Sat</div>
            <div className="font-semibold text-sm text-muted-foreground">Sun</div>

            {/* Date row */}
            <div className="font-semibold text-sm">Date</div>
            {weekDays.map((day, index) => (
              <div key={index} className="text-sm">
                {format(day, 'd')}
              </div>
            ))}

            {/* Hours row */}
            <div className="font-semibold text-sm">Hours</div>
            {weekDays.map((day, index) => (
              <div key={index} className="text-sm font-medium">
                {getTotalHoursForDay(day).toFixed(1)}
              </div>
            ))}

            {/* Entries row */}
            <div className="font-semibold text-sm">Entries</div>
            {weekDays.map((day, index) => {
              const dayEntries = getEntriesForDay(day);
              return (
                <div key={index} className="space-y-2">
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddEntry(day)}
                      className="w-full h-8"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2 border rounded-md text-xs space-y-1 bg-muted/50"
                    >
                      <div className="font-medium truncate">{entry.projectName}</div>
                      {entry.taskName && (
                        <div className="text-muted-foreground truncate">{entry.taskName}</div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.hours}h
                        </span>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEntry(entry)}
                              className="h-5 w-5 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteEntry(entry.id)}
                              className="h-5 w-5 p-0 text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {entry.notes && (
                        <div className="text-muted-foreground text-xs truncate">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Weekly Summary */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Weekly Summary</h4>
                <p className="text-sm text-muted-foreground">
                  Total Hours: {entries.reduce((total, entry) => total + entry.hours, 0).toFixed(1)}h
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Average per day</p>
                <p className="font-semibold">
                  {(entries.reduce((total, entry) => total + entry.hours, 0) / 7).toFixed(1)}h
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry Form Dialog */}
      <Dialog open={showEntryForm} onOpenChange={setShowEntryForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Edit Time Entry' : 'Add Time Entry'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
            {selectedDate && (
              <TimesheetEntryForm
                entry={editingEntry}
                projects={projects}
                date={selectedDate}
                onSave={handleSaveEntry}
                onCancel={handleCancelEntry}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
