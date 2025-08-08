import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// PUT /api/internal/attendance/[attendanceId] - Update a record
export async function PUT(req: NextRequest, { params }: { params: Promise<{ attendanceId: string }> }) {
  const { attendanceId } = await params;
  try {
    const body = await req.json();
    const updateData = { ...body, updatedAt: new Date() };
    await db.collection('attendance').doc(attendanceId).update(updateData);
    const updatedDoc = await db.collection('attendance').doc(attendanceId).get();
    return NextResponse.json({ id: attendanceId, ...updatedDoc.data() });
  } catch (error) {
    console.error('Error updating attendance record:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/internal/attendance/[attendanceId] - Delete a record
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ attendanceId: string }> }) {
  const { attendanceId } = await params;
  try {
    await db.collection('attendance').doc(attendanceId).delete();
    return NextResponse.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}