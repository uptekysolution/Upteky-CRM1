import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// Helper: get role-based filter
async function getAttendanceFilter(userId: string, userRole: string) {
  if (userRole === 'Admin' || userRole === 'Sub-Admin') {
    return null; // No filter, return all
  }
  if (userRole === 'HR') {
    // HR: all except Admin/Sub-Admin
    return (doc: any) => doc.role !== 'Admin' && doc.role !== 'Sub-Admin';
  }
  if (userRole === 'Team Lead') {
    // Find teams led by this user
    const leadTeamsSnapshot = await db.collection('teamMembers').where('userId', '==', userId).where('role', '==', 'lead').get();
    const leadTeamIds = leadTeamsSnapshot.docs.map(doc => doc.data().teamId);
    if (leadTeamIds.length === 0) {
      return (doc: any) => doc.userId === userId;
    }
    // Get all userIds in those teams
    let teamMemberUserIds: string[] = [];
    for (const teamId of leadTeamIds) {
      const membersSnap = await db.collection('teamMembers').where('teamId', '==', teamId).get();
      teamMemberUserIds.push(...membersSnap.docs.map(doc => doc.data().userId));
    }
    return (doc: any) => teamMemberUserIds.includes(doc.userId);
  }
  // Employee: only own records
  return (doc: any) => doc.userId === userId;
}

// GET /api/internal/attendance - List attendance records (role-based)
export async function GET(req: NextRequest) {
  const userId = req.headers.get('X-User-Id');
  const userRole = req.headers.get('X-User-Role');
  if (!userId || !userRole) {
    return NextResponse.json({ message: 'User ID and Role are required headers' }, { status: 400 });
  }
  try {
    const snapshot = await db.collection('attendance').get();
    let records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const filter = await getAttendanceFilter(userId, userRole);
    if (filter) records = records.filter(filter);
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/internal/attendance - Create a new attendance record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // You may want to validate required fields here
    const newRecord = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const docRef = await db.collection('attendance').add(newRecord);
    return NextResponse.json({ id: docRef.id, ...newRecord }, { status: 201 });
  } catch (error) {
    console.error('Error creating attendance record:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}