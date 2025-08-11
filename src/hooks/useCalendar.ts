import { useState, useMemo } from 'react'

export interface CalendarDate {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  hasAttendance?: boolean
  attendanceStatus?: 'present' | 'absent' | 'late' | 'half-day'
}

export interface UseCalendarProps {
  initialDate?: Date
  onDateSelect?: (date: Date) => void
}

export function useCalendar({ initialDate = new Date(), onDateSelect }: UseCalendarProps = {}) {
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const calendarDates = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const startDate = new Date(firstDayOfMonth)
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())
    
    const endDate = new Date(lastDayOfMonth)
    endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()))
    
    const dates: CalendarDate[] = []
    const today = new Date()
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const date = new Date(d)
      dates.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: selectedDate ? date.toDateString() === selectedDate.toDateString() : false,
      })
    }
    
    return dates
  }, [currentDate, selectedDate])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
    onDateSelect?.(today)
  }

  const selectDate = (date: Date) => {
    setSelectedDate(date)
    onDateSelect?.(date)
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' })
  const year = currentDate.getFullYear()

  return {
    currentDate,
    selectedDate,
    calendarDates,
    monthName,
    year,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectDate,
  }
}

