import { NextRequest, NextResponse } from 'next/server'
import { computeWorkingDays } from '@/lib/working-days'

// GET /api/calendar/working-days/:month/:year
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ month: string; year: string }> }
) {
  try {
    const resolved = await params
    const month = parseInt(resolved.month)
    const year = parseInt(resolved.year)
    if (!month || !year || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json({ message: 'Invalid month or year' }, { status: 400 })
    }

    const { totalWorkingDays, holidays, satOff, totalDays } = await computeWorkingDays(year, month)
    return NextResponse.json({
      month,
      year,
      totalDays,
      totalWorkingDays,
      holidays,
      satOff
    })
  } catch (e) {
    console.error('Error computing working days:', e)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}


