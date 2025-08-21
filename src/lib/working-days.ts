import { db } from '@/lib/firebase-admin'
import { getHolidaysForMonth, isSunday } from '@/lib/constants/holidays'

function toMonthStr(month: number): string {
  return month.toString().padStart(2, '0')
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${toMonthStr(month)}-${day.toString().padStart(2, '0')}`
}

export async function getSaturdayOffDates(year: number, month: number): Promise<string[]> {
  const monthStr = toMonthStr(month)
  try {
    const docRef = db.collection('company_settings').doc(`saturday_off_${year}_${monthStr}`)
    const snap = await docRef.get()
    if (snap.exists) {
      const data = snap.data() as { dates?: string[] }
      return Array.isArray(data?.dates) ? data!.dates! : []
    }
    return []
  } catch (e) {
    console.error('Failed to fetch Saturday off dates:', e)
    return []
  }
}

export function getAllDatesInMonth(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  const dates: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(formatDate(year, month, d))
  }
  return dates
}

export async function computeWorkingDays(
  year: number,
  month: number
): Promise<{ totalWorkingDays: number; holidays: string[]; satOff: string[]; totalDays: number }> {
  const monthHolidays = getHolidaysForMonth(year, month).map(h => h.date)
  const holidaySet = new Set(monthHolidays)
  const satOff = await getSaturdayOffDates(year, month)
  const satOffSet = new Set(satOff)
  const allDates = getAllDatesInMonth(year, month)

  let totalWorkingDays = 0
  for (const dateStr of allDates) {
    if (isSunday(dateStr)) continue
    if (holidaySet.has(dateStr)) continue
    if (satOffSet.has(dateStr)) continue
    totalWorkingDays++
  }

  // Persist for caching/inspection
  try {
    const monthStr = toMonthStr(month)
    await db.collection('calendar_working_days').doc(`${year}_${monthStr}`).set({
      year,
      month,
      totalDays: allDates.length,
      totalWorkingDays,
      holidays: monthHolidays,
      satOff,
      updatedAt: new Date()
    }, { merge: true })
  } catch (e) {
    console.error('Failed to save calendar working days:', e)
  }

  return { totalWorkingDays, holidays: monthHolidays, satOff, totalDays: allDates.length }
}


