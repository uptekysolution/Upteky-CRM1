import { NextRequest, NextResponse } from 'next/server'
import { computeWorkingDays } from '@/lib/working-days'

// GET /api/calendar/working-days/:month?year=YYYY
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ month: string }> }
) {
  try {
    const { searchParams } = new URL(req.url)
    const resolved = await params
    const month = parseInt(resolved.month)
    const year = parseInt(searchParams.get('year') || `${new Date().getFullYear()}`)
    if (!month || !year || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json({ message: 'Invalid month or year' }, { status: 400 })
    }
    const { totalWorkingDays, holidays, satOff, totalDays } = await computeWorkingDays(year, month)
    return NextResponse.json({ month, year, totalDays, totalWorkingDays, holidays, satOff })
  } catch (e) {
    console.error('Error computing working days:', e)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}


