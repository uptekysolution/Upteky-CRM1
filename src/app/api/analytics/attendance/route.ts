import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import { auth } from '@/lib/firebase-admin'

// Helper: get role-based filter
async function getAttendanceFilter(userId: string, userRole: string, teamId?: string) {
  if (userRole === 'Admin' || userRole === 'Sub-Admin') {
    return null // No filter, return all
  }
  if (userRole === 'HR') {
    // HR: all except Admin/Sub-Admin
    return (doc: any) => doc.role !== 'Admin' && doc.role !== 'Sub-Admin'
  }
  if (userRole === 'Team Lead') {
    // Find teams led by this user
    const leadTeamsSnapshot = await db.collection('teamMembers').where('userId', '==', userId).where('role', '==', 'lead').get()
    const leadTeamIds = leadTeamsSnapshot.docs.map(doc => doc.data().teamId)
    if (leadTeamIds.length === 0) {
      return (doc: any) => doc.userId === userId
    }
    // Get all userIds in those teams
    let teamMemberUserIds: string[] = []
    for (const teamId of leadTeamIds) {
      const membersSnap = await db.collection('teamMembers').where('teamId', '==', teamId).get()
      teamMemberUserIds.push(...membersSnap.docs.map(doc => doc.data().userId))
    }
    return (doc: any) => teamMemberUserIds.includes(doc.userId)
  }
  // Employee: only own records
  return (doc: any) => doc.userId === userId
}

// GET /api/analytics/attendance - Get attendance records for analytics
export async function GET(req: NextRequest) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    
    // Verify Firebase token
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }

    const userId = decodedToken.uid

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const userRole = userData?.role || 'Employee'
    const teamId = userData?.teamId

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const targetUserId = searchParams.get('userId') // For admin/HR viewing specific user
    const targetTeamId = searchParams.get('teamId') // For team lead viewing specific team

    // Build query
    let query = db.collection('attendance')

    // Apply date filters if provided
    if (startDate) {
      query = query.where('date', '>=', startDate)
    }
    if (endDate) {
      query = query.where('date', '<=', endDate)
    }

    // Apply role-based filtering
    if (userRole === 'Admin' || userRole === 'Sub-Admin') {
      // Can see all records, but can filter by specific user/team
      if (targetUserId) {
        query = query.where('userId', '==', targetUserId)
      } else if (targetTeamId) {
        query = query.where('teamId', '==', targetTeamId)
      }
    } else if (userRole === 'HR') {
      // Can see Employee records only
      query = query.where('role', 'in', ['Employee', 'HR', 'Team Lead', 'Business Development'])
      if (targetUserId) {
        query = query.where('userId', '==', targetUserId)
      }
    } else if (userRole === 'Team Lead') {
      // Can see team members only
      if (targetTeamId) {
        query = query.where('teamId', '==', targetTeamId)
      } else {
        // Get team members for this lead
        const leadTeamsSnapshot = await db.collection('teamMembers').where('userId', '==', userId).where('role', '==', 'lead').get()
        const leadTeamIds = leadTeamsSnapshot.docs.map(doc => doc.data().teamId)
        if (leadTeamIds.length > 0) {
          query = query.where('teamId', 'in', leadTeamIds)
        } else {
          query = query.where('userId', '==', userId)
        }
      }
    } else {
      // Employee can only see own records
      query = query.where('userId', '==', userId)
    }

    const snapshot = await query.get()
    const records = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        uid: data.userId || data.uid,
        role: data.role,
        date: data.date,
        status: data.status,
        withinGeofence: data.withinGeofence || false,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        teamId: data.teamId,
        createdAt: data.createdAt
      }
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching attendance records for analytics:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
