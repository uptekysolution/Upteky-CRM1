import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getAttendanceFilterByPermissions, getUserPermissions } from '@/lib/attendance-permissions';

// GET /api/internal/attendance - List attendance records (permission-based)
export async function GET(req: NextRequest) {
  const userId = req.headers.get('X-User-Id');
  const userRole = req.headers.get('X-User-Role');
  
  if (!userId || !userRole) {
    return NextResponse.json({ message: 'User ID and Role are required headers' }, { status: 400 });
  }

  try {
    // Get user permissions
    const userPermissions = await getUserPermissions(userId);
    
    // Get permission-based filter
    const { filter, error } = await getAttendanceFilterByPermissions(userId, userRole, userPermissions);
    
    if (error) {
      return NextResponse.json({ message: error }, { status: 403 });
    }

    // Fetch all attendance records
    const snapshot = await db.collection('attendance').get();
    let records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Apply permission-based filter
    if (filter) {
      if (typeof filter === 'function') {
        records = await filter(records);
      } else {
        records = records.filter(filter);
      }
    }
    
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