'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { HOLIDAYS_2025, isHoliday, getHolidaysForMonth, isSunday } from '@/lib/constants/holidays'
import { AttendanceRecord, fetchAttendanceRecords, fetchSaturdayOffDates, saveSaturdayOffDates } from '@/lib/analytics'
import { addLeaveRequest, fetchLeaveRequests } from '@/lib/analytics'
import { useToast } from '@/hooks/use-toast'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface HolidayCalendarProps {
  records?: AttendanceRecord[]
  loading?: boolean
  onRefresh?: () => void
  userRole?: string
  teamId?: string
}

interface LeaveRequest {
  id: string
  date: string
  reason: string
  leaveType: string
  status: string
}

export function HolidayCalendar({ records: propRecords, loading: propLoading = false, onRefresh, userRole = 'Employee', teamId }: HolidayCalendarProps) {
  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }

  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth())
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear())
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [leaveReason, setLeaveReason] = useState('')
  const [leaveType, setLeaveType] = useState('monthly')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [highlightedDate, setHighlightedDate] = useState<string>(formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()))
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [saturdayOffDates, setSaturdayOffDates] = useState<string[]>([])
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false)
  const [adminSelectedSaturdays, setAdminSelectedSaturdays] = useState<string[]>([])
  const [backendWorkingDays, setBackendWorkingDays] = useState<number | null>(null)
  const [backendPresentDays, setBackendPresentDays] = useState<number | null>(null)
  const [backendAttendanceRate, setBackendAttendanceRate] = useState<number | null>(null)

  // Get current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  // Use prop records if provided, otherwise fetch from backend
  useEffect(() => {
    if (propRecords) {
      setRecords(propRecords)
      setLoading(propLoading)
    }
  }, [propRecords, propLoading])

  // Fetch attendance records from backend if not provided via props
  useEffect(() => {
    if (propRecords || !currentUser) return

    const fetchRecords = async () => {
      setLoading(true)
      try {
        const startDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`
        const endDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-31`
        
        const fetchedRecords = await fetchAttendanceRecords(
          userRole,
          currentUser.uid,
          teamId,
          startDate,
          endDate
        )
        setRecords(fetchedRecords)
      } catch (error) {
        console.error('Error fetching attendance records:', error)
        toast({
          title: "Error",
          description: "Failed to fetch attendance records",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
  }, [currentUser, currentYear, currentMonth, userRole, teamId, propRecords])

  // Fetch admin-configured Saturday off dates for current month
  useEffect(() => {
    const loadSaturdayOff = async () => {
      try {
        const dates = await fetchSaturdayOffDates(currentYear, currentMonth + 1)
        setSaturdayOffDates(dates)
        setAdminSelectedSaturdays(dates)
      } catch (e) {
        console.error('Failed to load Saturday off dates', e)
      }
    }
    loadSaturdayOff()
  }, [currentYear, currentMonth])

  // Fetch backend working days and present days summary
  useEffect(() => {
    const run = async () => {
      if (!currentUser) return
      try {
        const token = await currentUser.getIdToken()
        // Working days
        const wdRes = await fetch(`/api/calendar/working-days/${currentMonth + 1}?year=${currentYear}`)
        if (wdRes.ok) {
          const wd = await wdRes.json()
          setBackendWorkingDays(wd.totalWorkingDays)
        } else {
          setBackendWorkingDays(null)
        }
        // Attendance summary
        const sumRes = await fetch(`/api/attendance/${currentUser.uid}/${currentMonth + 1}/summary?year=${currentYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (sumRes.ok) {
          const sum = await sumRes.json()
          setBackendPresentDays(sum.presentDays)
          setBackendAttendanceRate(sum.attendanceRate)
        } else {
          setBackendPresentDays(null)
          setBackendAttendanceRate(null)
        }
      } catch (e) {
        console.error('Failed to fetch backend working/summary:', e)
        setBackendWorkingDays(null)
        setBackendPresentDays(null)
        setBackendAttendanceRate(null)
      }
    }
    run()
  }, [currentUser, currentMonth, currentYear, saturdayOffDates])

  // Fetch leave requests when user changes
  useEffect(() => {
    if (!currentUser) return

    const fetchRequests = async () => {
      try {
        const startDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`
        const endDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-31`
        const requests = await fetchLeaveRequests(currentUser.uid, startDate, endDate)
        setLeaveRequests(requests)
      } catch (error) {
        console.error('Error fetching leave requests:', error)
      }
    }

    fetchRequests()
  }, [currentUser, currentYear, currentMonth])

  // Avoid placing early returns before hooks; loading UI rendered later

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const isAdminSaturdayOff = (date: string) => saturdayOffDates.includes(date)

  const getAttendanceStatus = (date: string) => {
    // Check if there's a leave request for this date
    const leaveRequest = leaveRequests.find(r => r.date === date)
    if (leaveRequest) {
      return 'Leave'
    }

    // Check attendance records from backend
    const record = records.find(r => r.date === date)
    if (record) {
      // If there's a check-in and check-out, mark as Present
      if (record.checkIn && record.checkOut) {
        return 'Present'
      }
      // If there's only check-in, mark as Present (partial day)
      if (record.checkIn && !record.checkOut) {
        return 'Present'
      }
    }

    // Check if it's a holiday
    if (isHoliday(date) || isSunday(date) || isAdminSaturdayOff(date)) {
      return 'Holiday'
    }

    // If no record and not weekend/holiday, mark as Absent
    return 'Absent'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-500'
      case 'Remote':
        return 'bg-purple-500'
      case 'Leave':
        return 'bg-yellow-500'
      case 'Absent':
        return 'bg-red-500'
      case 'Holiday':
        return 'bg-red-400'
      default:
        return 'bg-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Present':
        return 'Present'
      case 'Remote':
        return 'Remote'
      case 'Leave':
        return 'Leave'
      case 'Absent':
        return 'Absent'
      case 'Holiday':
        return 'Holiday'
      default:
        return 'No Record'
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const handleDateClick = (date: string) => {
    // Update the highlighted date (blue circle)
    setHighlightedDate(date)
    
    const status = getAttendanceStatus(date)
    const holiday = isHoliday(date) || isSunday(date) || isAdminSaturdayOff(date)

    // Don't allow leave requests for holidays
    if (holiday) {
      toast({
        title: "Cannot add leave",
        description: "Cannot add leave on holidays",
        variant: "destructive"
      })
      return
    }

    // Don't allow leave if already on leave
    if (status === 'Leave') {
      toast({
        title: "Already on leave",
        description: "You are already on leave for this date",
        variant: "destructive"
      })
      return
    }

    setSelectedDate(date)
    setIsDialogOpen(true)
  }

  const handleAddLeave = async () => {
    if (!currentUser || !selectedDate || !leaveReason.trim()) return

    setIsSubmitting(true)
    try {
      await addLeaveRequest(currentUser.uid, selectedDate, leaveReason.trim(), leaveType)
      
      toast({
        title: "Leave added successfully",
        description: `Leave request for ${selectedDate} has been added`,
      })

      setIsDialogOpen(false)
      setLeaveReason('')
      setSelectedDate('')
      setLeaveType('monthly')
      
      // Refresh leave requests and trigger parent refresh
      const startDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`
      const endDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-31`
      const requests = await fetchLeaveRequests(currentUser.uid, startDate, endDate)
      setLeaveRequests(requests)
      
      onRefresh?.()
    } catch (error: any) {
      toast({
        title: "Error adding leave",
        description: error.message || "Failed to add leave request",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)
  const holidays = getHolidaysForMonth(currentYear, currentMonth + 1)

  const allSaturdaysInMonth: string[] = React.useMemo(() => {
    const days = getDaysInMonth(currentYear, currentMonth)
    const result: string[] = []
    for (let day = 1; day <= days; day++) {
      const date = formatDate(currentYear, currentMonth, day)
      if (new Date(date).getDay() === 6) {
        result.push(date)
      }
    }
    return result
  }, [currentYear, currentMonth])

  const renderCalendarDays = () => {
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(currentYear, currentMonth, day)
      const holiday = isHoliday(date) || isSunday(date) || isAdminSaturdayOff(date)
      const attendanceStatus = getAttendanceStatus(date)
      const isToday = date === formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
      const isHighlighted = date === highlightedDate
      const leaveRequest = leaveRequests.find(r => r.date === date)

      days.push(
        <TooltipProvider key={day}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={`
                  h-16 border border-gray-200 p-2 relative cursor-pointer hover:bg-gray-50
                  ${isHighlighted ? 'bg-blue-50 border-blue-300' : ''}
                  ${attendanceStatus === 'Present' ? 'hover:bg-green-50' : ''}
                  ${attendanceStatus === 'Leave' ? 'hover:bg-yellow-50' : ''}
                  ${attendanceStatus === 'Absent' ? 'hover:bg-red-50' : ''}
                `}
                onClick={() => handleDateClick(date)}
              >
                <div className={`
                  text-sm font-medium flex items-center justify-center h-8 w-8 rounded-full mx-auto
                  ${attendanceStatus === 'Present' ? 'bg-blue-500 text-white' : 'text-gray-900'}
                `}>
                  {day}
                </div>
                
                {/* Holiday indicator */}
                {holiday && (
                  <div className="absolute top-1 right-1">
                    <Badge variant="destructive" className="text-xs px-1 py-0">
                      {isHoliday(date) ? (isHoliday(date) as any)?.name : isSunday(date) ? 'Sunday' : 'Saturday Off'}
                    </Badge>
                  </div>
                )}
                
                {/* Blue circle highlight for selected date */}
                {isHighlighted && (
                  <div className="absolute bottom-2 left-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  </div>
                )}
                
                {/* Attendance status indicator (only if not highlighted and not Present) */}
                {attendanceStatus && !holiday && !isHighlighted && attendanceStatus !== 'Present' && (
                  <div className="absolute bottom-2 left-2">
                    <div className={`
                      w-3 h-3 rounded-full ${getStatusColor(attendanceStatus)}
                    `}></div>
                  </div>
                )}

                {/* Leave indicator */}
                {leaveRequest && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <div className="font-medium">
                  {monthNames[currentMonth]} {day}, {currentYear}
                </div>
                {holiday && (
                  <div className="text-red-600 font-medium">
                    {isHoliday(date) ? (isHoliday(date) as any)?.name : isSunday(date) ? 'Sunday' : 'Saturday Off'}
                  </div>
                )}
                {attendanceStatus && !holiday && (
                  <div className="text-sm">
                    Status: {getStatusLabel(attendanceStatus)}
                  </div>
                )}
                {leaveRequest && (
                  <div className="text-sm text-yellow-600">
                    Leave: {leaveRequest.reason}
                  </div>
                )}
                {!holiday && (
                  <div className="text-xs text-muted-foreground">
                    Click to add leave
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return days
  }

  // Calculate total working days for the current month
  const calculateWorkingDays = () => {
    let workingDays = 0
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(currentYear, currentMonth, day)
      const status = getAttendanceStatus(date)
      
      // Count only working days (not holidays or leave)
      if (status !== 'Holiday' && status !== 'Leave') {
        workingDays++
      }
    }
    return workingDays
  }

  // Calculate present days for the current month
  const calculatePresentDays = () => {
    let presentDays = 0
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(currentYear, currentMonth, day)
      const status = getAttendanceStatus(date)
      
      // Count only present days
      if (status === 'Present') {
        presentDays++
      }
    }
    return presentDays
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Calendar
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Monthly calendar with holidays and attendance status. Click on dates to add leave requests.
          </p>
        </CardHeader>
        <CardContent>
          {/* Calendar Navigation */}
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="text-lg font-semibold">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Working Days Counter */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Working Days</span>
              </div>
              <div className="text-lg font-bold text-blue-900">
                {(backendPresentDays ?? calculatePresentDays())}/{(backendWorkingDays ?? calculateWorkingDays())} days
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Present days for {monthNames[currentMonth]} {currentYear}
            </p>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {renderCalendarDays()}
          </div>

          {/* Admin: Configure Saturday Off (max 2) */}
          {(userRole === 'Admin' || userRole === 'Sub-Admin') && (
            <div className="mt-6">
              <Button variant="outline" size="sm" onClick={() => setIsAdminDialogOpen(true)}>
                Configure Saturday Off
              </Button>
            </div>
          )}

          {/* Holidays for this month */}
          {holidays.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 mb-2">Holidays this month:</h4>
              <div className="space-y-1">
                {holidays.map(holiday => (
                  <div key={holiday.date} className="text-sm text-red-700">
                    {holiday.date.split('-')[2]} {monthNames[currentMonth]}: {holiday.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configured Saturday Off this month */}
          {(saturdayOffDates.length > 0 || true) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Saturday Off this month:</h4>
              <div className="space-y-1">
                {allSaturdaysInMonth.map(date => (
                  <div key={date} className={`text-sm ${saturdayOffDates.includes(date) ? 'text-blue-700' : 'text-muted-foreground'}`}>
                    {date.split('-')[2]} {monthNames[currentMonth]}: {saturdayOffDates.includes(date) ? 'Saturday Off' : 'Working'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Leave Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                value={selectedDate}
                disabled
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Allotment (2 Days Fixed)</SelectItem>
                  <SelectItem value="emergency">Emergency & Medical</SelectItem>
                  <SelectItem value="misc">Other / Special Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Reason for Leave</Label>
              <Input
                id="reason"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="Enter reason for leave..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setLeaveReason('')
                  setSelectedDate('')
                  setLeaveType('monthly')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddLeave}
                disabled={!leaveReason.trim() || isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Leave'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Saturday Off Dialog */}
      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Saturday Off</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select any Saturdays for {monthNames[currentMonth]} {currentYear}.</p>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-auto">
              {allSaturdaysInMonth.map(date => {
                const label = `${date.split('-')[2]} ${monthNames[currentMonth]}`
                const checked = adminSelectedSaturdays.includes(date)
                return (
                  <label key={date} className={`flex items-center gap-2 p-2 border rounded cursor-pointer ${checked ? 'bg-blue-50 border-blue-300' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setAdminSelectedSaturdays(prev => {
                          if (e.target.checked) {
                            return Array.from(new Set([...prev, date]))
                          }
                          return prev.filter(d => d !== date)
                        })
                      }}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                )
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsAdminDialogOpen(false); setAdminSelectedSaturdays(saturdayOffDates) }}>Cancel</Button>
              <Button onClick={async () => {
                try {
                  await saveSaturdayOffDates(currentYear, currentMonth + 1, adminSelectedSaturdays)
                  setSaturdayOffDates(adminSelectedSaturdays)
                  setIsAdminDialogOpen(false)
                  toast({ title: 'Saved', description: 'Saturday offs updated.' })
                } catch (e: any) {
                  toast({ title: 'Error', description: e.message || 'Failed to save', variant: 'destructive' })
                }
              }}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
