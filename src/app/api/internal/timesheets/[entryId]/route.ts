import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// PUT /api/internal/timesheets/[entryId] - Update a timesheet entry
export async function PUT(req: NextRequest, { params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  try {
    const body = await req.json();
    const updateData = { ...body, updatedAt: new Date() };
    await db.collection('timesheets').doc(entryId).update(updateData);
    const updatedDoc = await db.collection('timesheets').doc(entryId).get();
    return NextResponse.json({ id: entryId, ...updatedDoc.data() });
  } catch (error) {
    console.error('Error updating timesheet entry:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/internal/timesheets/[entryId] - Delete a timesheet entry
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  try {
    await db.collection('timesheets').doc(entryId).delete();
    return NextResponse.json({ message: 'Timesheet entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting timesheet entry:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}