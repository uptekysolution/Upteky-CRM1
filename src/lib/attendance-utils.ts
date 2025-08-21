export type DayStatus = 'Absent' | 'Half' | 'Full' | 'Underwork' | 'Overwork'

export interface DailyComputation {
  date: string
  checkIn?: Date | null
  checkOut?: Date | null
  totalHours: number
  status: DayStatus
  dayCredit: number // 0, 0.5, 1
  underwork: boolean
  overtimeHours: number
}

export interface MonthlyAggregate {
  presentCredit: number // sum of dayCredit (e.g., 20.5)
  halfDays: number
  fullDays: number
  zeroDays: number
  underworkAlerts: number
  overtimeHours: number
}

export function computeDailyStatus(checkIn?: Date | null, checkOut?: Date | null): DailyComputation {
  const safeCheckIn = checkIn ? new Date(checkIn) : null
  const safeCheckOut = checkOut ? new Date(checkOut) : null

  let totalHours = 0
  if (safeCheckIn && safeCheckOut && !isNaN(safeCheckIn.getTime()) && !isNaN(safeCheckOut.getTime())) {
    totalHours = Math.max(0, (safeCheckOut.getTime() - safeCheckIn.getTime()) / 36e5)
  }

  // Cutoffs
  const nineHours = 9
  const sevenHours = 7
  const fourHours = 4

  // Late in / early out rules -> half day conditions
  const isLateIn = !!safeCheckIn && safeCheckIn.getHours() >= 11
  const isEarlyOut = !!safeCheckOut && safeCheckOut.getHours() < 17

  let dayCredit = 0
  let status: DayStatus = 'Absent'
  let underwork = false
  let overtimeHours = 0

  if (totalHours >= nineHours) {
    dayCredit = 1
    status = 'Full'
    overtimeHours = totalHours - nineHours
  } else if (totalHours >= sevenHours) {
    dayCredit = 1
    status = 'Underwork'
    underwork = true
  } else if (totalHours >= fourHours || isLateIn || isEarlyOut) {
    dayCredit = 0.5
    status = 'Half'
  } else {
    dayCredit = 0
    status = 'Absent'
  }

  return {
    date: '',
    checkIn: safeCheckIn,
    checkOut: safeCheckOut,
    totalHours: Number(totalHours.toFixed(2)),
    status,
    dayCredit,
    underwork,
    overtimeHours: Number(overtimeHours.toFixed(2))
  }
}

export function aggregateMonthly(days: Array<Pick<DailyComputation, 'dayCredit' | 'underwork' | 'overtimeHours'>>): MonthlyAggregate {
  let presentCredit = 0
  let halfDays = 0
  let fullDays = 0
  let zeroDays = 0
  let underworkAlerts = 0
  let overtimeHours = 0

  for (const d of days) {
    presentCredit += d.dayCredit
    overtimeHours += d.overtimeHours
    if (d.underwork) underworkAlerts += 1
    if (d.dayCredit === 1) fullDays += 1
    else if (d.dayCredit === 0.5) halfDays += 1
    else zeroDays += 1
  }

  return {
    presentCredit: Number(presentCredit.toFixed(2)),
    halfDays,
    fullDays,
    zeroDays,
    underworkAlerts,
    overtimeHours: Number(overtimeHours.toFixed(2))
  }
}


