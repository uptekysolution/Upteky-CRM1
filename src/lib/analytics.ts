import { db } from './firebase'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { auth } from './firebase'

export interface AttendanceRecord {
  uid: string
  role: string
  date: string // YYYY-MM-DD
  status: 'Present' | 'Remote' | 'Absent'
  withinGeofence: boolean
  checkIn?: Timestamp
  checkOut?: Timestamp
}

export interface LeaveBalance {
  uid: string
  month: string // YYYY-MM
  allocated: number // 2 + carry forward
  taken: number
  remaining: number
  carryForward?: number
}

export interface TeamMetrics {
  teamId: string
  teamName: string
  averageAttendance: number
  totalMembers: number
  presentDays: number
  remoteDays: number
  absentDays: number
}

export interface MonthlyTrends {
  month: string
  present: number
  remote: number
  absent: number
  total: number
}

export interface GeofenceCompliance {
  withinGeofence: number
  outsideGeofence: number
  total: number
  percentage: number
}

// Fetch attendance records based on role and filters
export const fetchAttendanceRecords = async (
  userRole: string,
  userId: string,
  teamId?: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> => {
  try {
    // Get current user's auth token
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    const token = await currentUser.getIdToken()

    // Build query parameters
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (teamId) params.append('teamId', teamId)

    // Use the new API endpoint
    const response = await fetch(`/api/analytics/attendance?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const records = await response.json()
    return records.map((record: any) => ({
      uid: record.uid,
      role: record.role,
      date: record.date,
      status: record.status,
      withinGeofence: record.withinGeofence || false,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      teamId: record.teamId
    }))
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    // Fallback to direct Firestore query if API fails
    return fetchAttendanceRecordsFallback(userRole, userId, teamId, startDate, endDate)
  }
}

// Fallback function using direct Firestore queries
const fetchAttendanceRecordsFallback = async (
  userRole: string,
  userId: string,
  teamId?: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> => {
  let q = query(collection(db, 'attendance'), orderBy('createdAt', 'desc'))

  // Apply date filters if provided
  if (startDate) {
    q = query(q, where('date', '>=', startDate))
  }
  if (endDate) {
    q = query(q, where('date', '<=', endDate))
  }

  // Apply role-based filtering
  if (userRole === 'Admin' || userRole === 'Sub-Admin') {
    // Can see all records
  } else if (userRole === 'HR') {
    // Can see Employee records only
    q = query(q, where('role', 'in', ['Employee', 'HR', 'Team Lead', 'Business Development']))
  } else if (userRole === 'Team Lead') {
    // Can see team members only
    if (teamId) {
      q = query(q, where('teamId', '==', teamId))
    } else {
      q = query(q, where('uid', '==', userId))
    }
  } else {
    // Employee can only see own records
    q = query(q, where('uid', '==', userId))
  }

  const snapshot = await getDocs(q)
  const records: AttendanceRecord[] = []
  
  snapshot.forEach((doc) => {
    const data = doc.data()
    if (data) {
      // Determine status based on check-in/check-out data
      let status: 'Present' | 'Remote' | 'Absent' = 'Absent'
      
      if (data.checkIn && data.checkOut) {
        // Both check-in and check-out present
        status = 'Present'
      } else if (data.checkIn && !data.checkOut) {
        // Only check-in present (partial day)
        status = 'Present'
      } else if (!data.checkIn && !data.checkOut) {
        // No check-in or check-out
        status = 'Absent'
      }
      
      records.push({
        uid: data.uid,
        role: data.role,
        date: data.date || format(data.createdAt?.toDate() || new Date(), 'yyyy-MM-dd'),
        status: data.status || status,
        withinGeofence: data.withinGeofence || false,
        checkIn: data.checkIn,
        checkOut: data.checkOut
      })
    }
  })
  
  return records
}

// Fetch leave balance for a user
export const fetchLeaveBalance = async (uid: string, month: string): Promise<LeaveBalance> => {
  try {
    const docRef = doc(db, 'leave_balance', `${uid}_${month}`)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data() as LeaveBalance
    } else {
      // Create default leave balance
      const defaultBalance: LeaveBalance = {
        uid,
        month,
        allocated: 2,
        taken: 0,
        remaining: 2,
        carryForward: 0
      }
      await setDoc(docRef, defaultBalance)
      return defaultBalance
    }
  } catch (error) {
    console.error('Error fetching leave balance:', error)
    throw error
  }
}

// Update leave balance
export const updateLeaveBalance = async (
  uid: string,
  month: string,
  taken: number
): Promise<void> => {
  try {
    const docRef = doc(db, 'leave_balance', `${uid}_${month}`)
    const currentBalance = await fetchLeaveBalance(uid, month)
    
    const updatedBalance: LeaveBalance = {
      ...currentBalance,
      taken,
      remaining: currentBalance.allocated - taken
    }
    
    await updateDoc(docRef, updatedBalance)
  } catch (error) {
    console.error('Error updating leave balance:', error)
    throw error
  }
}

// Add leave request
export const addLeaveRequest = async (
  uid: string,
  date: string,
  reason: string,
  leaveType: string = 'monthly'
): Promise<void> => {
  try {
    // Get the month for the leave date
    const month = date.substring(0, 7) // YYYY-MM
    
    // Get current leave balance
    const currentBalance = await fetchLeaveBalance(uid, month)
    
    // Check if user has enough leave
    if (currentBalance.remaining <= 0) {
      throw new Error('No leave balance remaining for this month')
    }
    
    // Update leave balance (increment taken by 1)
    const newTaken = currentBalance.taken + 1
    await updateLeaveBalance(uid, month, newTaken)
    
    // Add leave record to leave_requests collection
    const leaveRequestRef = doc(collection(db, 'leave_requests'))
    await setDoc(leaveRequestRef, {
      uid,
      date,
      reason,
      leaveType,
      status: 'Approved', // Auto-approve for now
      createdAt: Timestamp.now(),
      month
    })
    
  } catch (error) {
    console.error('Error adding leave request:', error)
    throw error
  }
}

// Fetch leave requests for a user
export const fetchLeaveRequests = async (
  uid: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> => {
  try {
    let q = query(
      collection(db, 'leave_requests'),
      where('uid', '==', uid),
      orderBy('date', 'desc')
    )
    
    if (startDate) {
      q = query(q, where('date', '>=', startDate))
    }
    if (endDate) {
      q = query(q, where('date', '<=', endDate))
    }
    
    const snapshot = await getDocs(q)
    const requests: any[] = []
    
    snapshot.forEach((doc) => {
      const data = doc.data()
      if (data) {
        requests.push({
          id: doc.id,
          ...data
        })
      }
    })
    
    return requests
  } catch (error) {
    console.error('Error fetching leave requests:', error)
    return []
  }
}

// Calculate carry forward for next month
export const calculateCarryForward = async (uid: string, currentMonth: string): Promise<number> => {
  try {
    const currentBalance = await fetchLeaveBalance(uid, currentMonth)
    return Math.max(0, currentBalance.remaining)
  } catch (error) {
    console.error('Error calculating carry forward:', error)
    return 0
  }
}

// Fetch team metrics
export const fetchTeamMetrics = async (
  userRole: string,
  userId: string,
  teamId?: string
): Promise<TeamMetrics[]> => {
  if (userRole !== 'Admin' && userRole !== 'Sub-Admin' && userRole !== 'Team Lead') {
    return []
  }

  try {
    const records = await fetchAttendanceRecords(userRole, userId, teamId)
    
    // Group by team and calculate metrics
    const teamMap = new Map<string, TeamMetrics>()
    
    records.forEach(record => {
      const teamKey = record.teamId || 'No Team'
      
      if (!teamMap.has(teamKey)) {
        teamMap.set(teamKey, {
          teamId: teamKey,
          teamName: teamKey === 'No Team' ? 'No Team' : teamKey,
          averageAttendance: 0,
          totalMembers: 0,
          presentDays: 0,
          remoteDays: 0,
          absentDays: 0
        })
      }
      
      const team = teamMap.get(teamKey)!
      
      switch (record.status) {
        case 'Present':
          team.presentDays++
          break
        case 'Remote':
          team.remoteDays++
          break
        case 'Absent':
          team.absentDays++
          break
      }
    })
    
    // Calculate averages
    teamMap.forEach(team => {
      const totalDays = team.presentDays + team.remoteDays + team.absentDays
      team.averageAttendance = totalDays > 0 ? 
        ((team.presentDays + team.remoteDays) / totalDays) * 100 : 0
    })
    
    return Array.from(teamMap.values())
  } catch (error) {
    console.error('Error fetching team metrics:', error)
    return []
  }
}

// Calculate monthly trends
export const calculateMonthlyTrends = (records: AttendanceRecord[]): MonthlyTrends[] => {
  const monthMap = new Map<string, MonthlyTrends>()
  
  records.forEach(record => {
    const month = record.date.substring(0, 7) // YYYY-MM
    
    if (!monthMap.has(month)) {
      monthMap.set(month, {
        month,
        present: 0,
        remote: 0,
        absent: 0,
        total: 0
      })
    }
    
    const monthData = monthMap.get(month)!
    
    switch (record.status) {
      case 'Present':
        monthData.present++
        break
      case 'Remote':
        monthData.remote++
        break
      case 'Absent':
        monthData.absent++
        break
    }
    
    monthData.total++
  })
  
  return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month))
}

// Calculate geofence compliance
export const calculateGeofenceCompliance = (records: AttendanceRecord[]): GeofenceCompliance => {
  const withinGeofence = records.filter(r => r.withinGeofence).length
  const outsideGeofence = records.filter(r => !r.withinGeofence).length
  const total = records.length
  
  return {
    withinGeofence,
    outsideGeofence,
    total,
    percentage: total > 0 ? (withinGeofence / total) * 100 : 0
  }
}

// Get current month in YYYY-MM format
export const getCurrentMonth = (): string => {
  return format(new Date(), 'yyyy-MM')
}

// Get previous month in YYYY-MM format
export const getPreviousMonth = (): string => {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return format(date, 'yyyy-MM')
}
