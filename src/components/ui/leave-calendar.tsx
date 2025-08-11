'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCalendar } from '@/hooks/useCalendar'
import { cn } from '@/lib/utils'
import { LeaveRequest, LeaveType } from '@/types/leave'
import { format, isSameDay, isWithinInterval } from 'date-fns'

interface LeaveCalendarProps {
  onDateSelect?: (date: Date) => void
  showStatusLabels?: boolean
  className?: string
  leaveRequests?: LeaveRequest[]
  userRole?: string
  currentUserId?: string
  showLeaveRequests?: boolean
}

export function LeaveCalendar({ 
  onDateSelect, 
  showStatusLabels = true,
  className,
  leaveRequests = [],
  userRole = 'Employee',
  currentUserId,
  showLeaveRequests = true
}: LeaveCalendarProps) {
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

  const getLeaveStatusColor = (leaveType: LeaveType, status: string) => {
    if (status === 'rejected') {
      return 'bg-gray-400'
    }
    
    switch (leaveType) {
      case 'monthly':
        return 'bg-blue-500'
      case 'emergency':
        return 'bg-red-500'
      case 'miscellaneous':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getLeaveStatusLabel = (leaveType: LeaveType, status: string) => {
    if (status === 'rejected') {
      return 'Rejected'
    }
    
    switch (leaveType) {
      case 'monthly':
        return 'Monthly'
      case 'emergency':
        return 'Emergency'
      case 'miscellaneous':
        return 'Misc'
      default:
        return 'Leave'
    }
  }

  const getLeaveStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="h-2 w-2" />
      case 'rejected':
        return <X className="h-2 w-2" />
      case 'pending':
        return <Clock className="h-2 w-2" />
      default:
        return null
    }
  }

  const getDateLeaveData = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    
    // Filter leave requests for this date
    const relevantRequests = leaveRequests.filter(request => {
      const startDate = request.startDate.toDate ? request.startDate.toDate() : new Date(request.startDate)
      const endDate = request.endDate.toDate ? request.endDate.toDate() : new Date(request.endDate)
      
      return isWithinInterval(date, { start: startDate, end: endDate })
    })

    // Filter based on user role and permissions
    const visibleRequests = relevantRequests.filter(request => {
      if (userRole === 'Admin' || userRole === 'Sub-Admin' || userRole === 'HR') {
        return true // Can see all requests
      }
      return request.userId === currentUserId // Can only see own requests
    })

    if (visibleRequests.length === 0) return null

    // Get the most relevant request (approved > pending > rejected)
    const approvedRequest = visibleRequests.find(req => req.status === 'approved')
    const pendingRequest = visibleRequests.find(req => req.status === 'pending')
    const rejectedRequest = visibleRequests.find(req => req.status === 'rejected')

    const primaryRequest = approvedRequest || pendingRequest || rejectedRequest

    return {
      requests: visibleRequests,
      primaryRequest,
      hasApproved: !!approvedRequest,
      hasPending: !!pendingRequest,
      hasRejected: !!rejectedRequest,
      leaveType: primaryRequest?.leaveType,
      status: primaryRequest?.status
    }
  }

  const getDateDisplay = (dateInfo: any) => {
    const leaveData = getDateLeaveData(dateInfo.date)
    
    if (!leaveData) {
      // Show attendance status if no leave data
      return {
        hasAttendance: dateInfo.hasAttendance,
        attendanceStatus: dateInfo.attendanceStatus,
        backgroundColor: dateInfo.hasAttendance ? getAttendanceStatusColor(dateInfo.attendanceStatus) : undefined
      }
    }

    // Show leave status
    const { primaryRequest, hasApproved, hasPending, hasRejected } = leaveData
    
    return {
      hasLeave: true,
      leaveType: primaryRequest?.leaveType,
      leaveStatus: primaryRequest?.status,
      backgroundColor: getLeaveStatusColor(primaryRequest?.leaveType || 'miscellaneous', primaryRequest?.status || 'pending'),
      label: getLeaveStatusLabel(primaryRequest?.leaveType || 'miscellaneous', primaryRequest?.status || 'pending'),
      icon: getLeaveStatusIcon(primaryRequest?.status || 'pending'),
      hasMultipleStatuses: hasApproved && hasPending || hasApproved && hasRejected || hasPending && hasRejected
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          {showLeaveRequests ? 'Leave & Attendance Calendar' : 'Attendance Calendar'}
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
          {calendarDates.map((dateInfo, index) => {
            const displayData = getDateDisplay(dateInfo)
            
            return (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-12 w-full p-0 relative",
                  !dateInfo.isCurrentMonth && "text-muted-foreground/50",
                  dateInfo.isToday && "bg-primary text-primary-foreground",
                  dateInfo.isSelected && "ring-2 ring-primary",
                  (dateInfo.hasAttendance || displayData.hasLeave) && "font-semibold"
                )}
                onClick={() => selectDate(dateInfo.date)}
              >
                <span className="text-sm">
                  {dateInfo.date.getDate()}
                </span>
                
                {/* Status Indicator */}
                {displayData.backgroundColor && (
                  <div
                    className={cn(
                      "absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full",
                      displayData.backgroundColor
                    )}
                  />
                )}

                {/* Leave Label */}
                {displayData.hasLeave && displayData.label && (
                  <div className="absolute top-0.5 right-0.5">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs px-1 py-0 h-4 text-[10px]",
                        displayData.leaveStatus === 'rejected' && "text-gray-500 border-gray-300"
                      )}
                    >
                      {displayData.icon && (
                        <span className="mr-0.5">{displayData.icon}</span>
                      )}
                      {displayData.label}
                    </Badge>
                  </div>
                )}

                {/* Multiple Status Indicator */}
                {displayData.hasMultipleStatuses && (
                  <div className="absolute top-0.5 left-0.5">
                    <div className="w-1 h-1 bg-yellow-500 rounded-full" />
                  </div>
                )}
              </Button>
            )
          })}
        </div>

        {/* Status Legend */}
        {showStatusLabels && (
          <div className="space-y-4 pt-4 border-t">
            {/* Attendance Legend */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Attendance Status</Label>
              <div className="flex flex-wrap gap-4">
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
            </div>

            {/* Leave Legend */}
            {showLeaveRequests && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Leave Status</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs">Monthly</Badge>
                    <Label className="text-sm">Monthly Leave</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-red-600 border-red-200 text-xs">Emergency</Badge>
                    <Label className="text-sm">Emergency Leave</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-purple-600 border-purple-200 text-xs">Misc</Badge>
                    <Label className="text-sm">Miscellaneous</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs">
                      <X className="h-2 w-2 mr-0.5" />
                      Rejected
                    </Badge>
                    <Label className="text-sm">Rejected</Label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

