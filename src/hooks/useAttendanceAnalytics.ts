import { useState, useEffect } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import {
  fetchAttendanceRecords,
  fetchLeaveBalance,
  fetchTeamMetrics,
  calculateMonthlyTrends,
  calculateGeofenceCompliance,
  getCurrentMonth,
  getPreviousMonth,
  AttendanceRecord,
  LeaveBalance,
  TeamMetrics,
  MonthlyTrends,
  GeofenceCompliance
} from '@/lib/analytics'

interface UserData {
  role: string
  teamId?: string
  name?: string
  email?: string
}

interface AnalyticsData {
  records: AttendanceRecord[]
  leaveBalance: LeaveBalance | null
  teamMetrics: TeamMetrics[]
  monthlyTrends: MonthlyTrends[]
  geofenceCompliance: GeofenceCompliance
  loading: boolean
  error: string | null
}

export const useAttendanceAnalytics = (
  startDate?: string, 
  endDate?: string,
  providedUserRole?: string,
  providedUserId?: string,
  providedTeamId?: string
) => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    records: [],
    leaveBalance: null,
    teamMetrics: [],
    monthlyTrends: [],
    geofenceCompliance: { withinGeofence: 0, outsideGeofence: 0, total: 0, percentage: 0 },
    loading: true,
    error: null
  })

  // Get current user and their data
  useEffect(() => {
    // If provided data is available, use it
    if (providedUserRole && providedUserId) {
      setUserData({
        role: providedUserRole,
        teamId: providedTeamId || null,
        name: 'Current User',
        email: ''
      })
      return
    }

    // Otherwise, get current user from auth
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            setUserData({
              role: data.role || 'Employee',
              teamId: data.teamId || null,
              name: data.name || data.email || 'Unknown',
              email: data.email || ''
            })
          } else {
            setUserData({ role: 'Employee', name: 'Unknown', email: user.email || '' })
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          setUserData({ role: 'Employee', name: 'Unknown', email: user.email || '' })
        }
      }
    })

    return () => unsubscribe()
  }, [providedUserRole, providedUserId, providedTeamId])

  // Fetch analytics data when user data is available
  useEffect(() => {
    if (!userData) return

    setAnalyticsData(prev => ({ ...prev, loading: true, error: null }))

    const fetchData = async () => {
      try {
        const effectiveUserId = providedUserId || user?.uid || ''
        
        // Fetch attendance records
        const records = await fetchAttendanceRecords(
          userData.role,
          effectiveUserId,
          userData.teamId,
          startDate,
          endDate
        )

        // Calculate trends and compliance
        const monthlyTrends = calculateMonthlyTrends(records)
        const geofenceCompliance = calculateGeofenceCompliance(records)

        // Fetch leave balance for current month
        const currentMonth = getCurrentMonth()
        const leaveBalance = await fetchLeaveBalance(effectiveUserId, currentMonth)

        // Fetch team metrics (only for Admin, Sub-Admin, and Team Lead)
        const teamMetrics = await fetchTeamMetrics(userData.role, effectiveUserId, userData.teamId)

        setAnalyticsData({
          records,
          leaveBalance,
          teamMetrics,
          monthlyTrends,
          geofenceCompliance,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error fetching analytics data:', error)
        setAnalyticsData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch analytics data'
        }))
      }
    }

    fetchData()
  }, [user, userData, startDate, endDate, providedUserId])

  // Real-time updates for attendance records
  useEffect(() => {
    if (!userData) return

    const fetchRecords = async () => {
      try {
        const effectiveUserId = providedUserId || user?.uid || ''
        const records = await fetchAttendanceRecords(
          userData.role,
          effectiveUserId,
          userData.teamId,
          startDate,
          endDate
        )
        
        const monthlyTrends = calculateMonthlyTrends(records)
        const geofenceCompliance = calculateGeofenceCompliance(records)

        setAnalyticsData(prev => ({
          ...prev,
          records,
          monthlyTrends,
          geofenceCompliance
        }))
      } catch (error) {
        console.error('Error fetching attendance records:', error)
      }
    }

    fetchRecords()
  }, [user, userData, startDate, endDate, providedUserId])

  // Refresh leave balance
  const refreshLeaveBalance = async () => {
    const effectiveUserId = providedUserId || user?.uid || ''
    if (!effectiveUserId) return

    try {
      const currentMonth = getCurrentMonth()
      const leaveBalance = await fetchLeaveBalance(effectiveUserId, currentMonth)
      
      setAnalyticsData(prev => ({
        ...prev,
        leaveBalance
      }))
    } catch (error) {
      console.error('Error refreshing leave balance:', error)
    }
  }

  // Get user permissions for analytics
  const getUserPermissions = () => {
    if (!userData) return { canViewAll: false, canViewTeam: false, canViewOwn: true }

    switch (userData.role) {
      case 'Admin':
      case 'Sub-Admin':
        return { canViewAll: true, canViewTeam: true, canViewOwn: true }
      case 'HR':
        return { canViewAll: false, canViewTeam: false, canViewOwn: true }
      case 'Team Lead':
        return { canViewAll: false, canViewTeam: true, canViewOwn: true }
      default:
        return { canViewAll: false, canViewTeam: false, canViewOwn: true }
    }
  }

  return {
    ...analyticsData,
    user,
    userData,
    refreshLeaveBalance,
    getUserPermissions
  }
}
