export interface Holiday {
  date: string // YYYY-MM-DD
  day: string
  name: string
}

export const HOLIDAYS_2025: Holiday[] = [
  {
    date: '2025-01-01',
    day: 'Wednesday',
    name: "New Year's Day"
  },
  {
    date: '2025-01-14',
    day: 'Tuesday',
    name: 'Makar Sankranti'
  },
  {
    date: '2025-03-14',
    day: 'Friday',
    name: 'Dhuleti'
  },
  {
    date: '2025-08-15',
    day: 'Friday',
    name: 'Independence Day'
  },
  {
    date: '2025-10-02',
    day: 'Thursday',
    name: 'Gandhi Jayanti & Dussehra'
  },
  {
    date: '2025-09-06',
    day: 'Saturday',
    name: 'Ganesh Chaturthi'
  },
  {
    date: '2025-10-20',
    day: 'Monday',
    name: 'Diwali'
  },
  {
    date: '2025-10-21',
    day: 'Tuesday',
    name: 'Extended Diwali Holiday'
  },
  {
    date: '2025-10-22',
    day: 'Wednesday',
    name: 'Vikram Samvat New Year'
  },
  {
    date: '2025-12-25',
    day: 'Thursday',
    name: 'Christmas Day'
  }
]

export const isHoliday = (date: string): Holiday | null => {
  return HOLIDAYS_2025.find(holiday => holiday.date === date) || null
}

export const getHolidaysForMonth = (year: number, month: number): Holiday[] => {
  const monthStr = month.toString().padStart(2, '0')
  return HOLIDAYS_2025.filter(holiday => 
    holiday.date.startsWith(`${year}-${monthStr}`)
  )
}

// New functions for additional holiday logic
export const isSunday = (date: string): boolean => {
  const dayOfWeek = new Date(date).getDay()
  return dayOfWeek === 0
}

export const isSecondSaturday = (date: string): boolean => {
  const dayOfWeek = new Date(date).getDay()
  const dayOfMonth = new Date(date).getDate()
  return dayOfWeek === 6 && dayOfMonth >= 8 && dayOfMonth <= 14
}

export const isFourthSaturday = (date: string): boolean => {
  const dayOfWeek = new Date(date).getDay()
  const dayOfMonth = new Date(date).getDate()
  return dayOfWeek === 6 && dayOfMonth >= 22 && dayOfMonth <= 28
}

export const isAdditionalHoliday = (date: string): boolean => {
  return isSunday(date) || isSecondSaturday(date) || isFourthSaturday(date)
}

export const getAdditionalHolidayName = (date: string): string => {
  if (isSunday(date)) return 'Sunday'
  if (isSecondSaturday(date)) return '2nd Saturday'
  if (isFourthSaturday(date)) return '4th Saturday'
  return ''
}
