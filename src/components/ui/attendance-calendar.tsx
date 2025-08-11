'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCalendar } from '@/hooks/useCalendar'
import { cn } from '@/lib/utils'

interface AttendanceCalendarProps {
  onDateSelect?: (date: Date) => void
  showStatusLabels?: boolean
  className?: string
}

export function AttendanceCalendar({ 
  onDateSelect, 
  showStatusLabels = true,
  className 
}: AttendanceCalendarProps) {
  const {
    calendarDates,
    monthName,
    year,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectDate,
  } = useCalendar({ onDateSelect })

  const getAttendanceStatusColor = (status?: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500'
      case 'absent':
        return 'bg-red-500'
      case 'late':
        return 'bg-yellow-500'
      case 'half-day':
        return 'bg-orange-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getAttendanceStatusLabel = (status?: string) => {
    switch (status) {
      case 'present':
        return 'Present'
      case 'absent':
        return 'Absent'
      case 'late':
        return 'Late'
      case 'half-day':
        return 'Half Day'
      default:
        return 'No Record'
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Attendance Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold">{monthName} {year}</h3>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Today Button */}
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="flex h-8 items-center justify-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Calendar Dates */}
          {calendarDates.map((dateInfo, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className={cn(
                "h-12 w-full p-0 relative",
                !dateInfo.isCurrentMonth && "text-muted-foreground/50",
                dateInfo.isToday && "bg-primary text-primary-foreground",
                dateInfo.isSelected && "ring-2 ring-primary",
                dateInfo.hasAttendance && "font-semibold"
              )}
              onClick={() => selectDate(dateInfo.date)}
            >
              <span className="text-sm">
                {dateInfo.date.getDate()}
              </span>
              
              {/* Attendance Status Indicator */}
              {dateInfo.hasAttendance && (
                <div
                  className={cn(
                    "absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full",
                    getAttendanceStatusColor(dateInfo.attendanceStatus)
                  )}
                />
              )}
            </Button>
          ))}
        </div>

        {/* Status Legend */}
        {showStatusLabels && (
          <div className="flex flex-wrap gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <Label className="text-sm">Present</Label>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <Label className="text-sm">Absent</Label>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <Label className="text-sm">Late</Label>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <Label className="text-sm">Half Day</Label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

