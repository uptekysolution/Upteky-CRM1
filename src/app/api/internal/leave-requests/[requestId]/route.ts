import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';
import { Timestamp } from 'firebase-admin/firestore';
import { LeaveStatus } from '@/types/leave';

// PUT - Update leave request status (approve/reject)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const userRole = await getSessionAndUserRole(req);
    if (!userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await params;
    const body = await req.json();
    const { status, rejectionReason, approvedBy } = body;

    // Validate status
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Validate rejection reason for rejected requests
    if (status === 'rejected' && !rejectionReason?.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required for rejected requests' },
        { status: 400 }
      );
    }

    // Get the leave request
    const leaveRequestRef = db.collection('LeaveRequests').doc(requestId);
    const leaveRequestDoc = await leaveRequestRef.get();

    if (!leaveRequestDoc.exists) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }

    const leaveRequest = leaveRequestDoc.data();
    if (!leaveRequest) {
      return NextResponse.json(
        { error: 'Leave request data not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const canApprove = (() => {
      if (userRole === 'Admin') return true;
      if (userRole === 'HR') return leaveRequest.role !== 'Admin' && leaveRequest.role !== 'Sub-Admin';
      if (userRole === 'Sub-Admin') return leaveRequest.role === 'Employee' || leaveRequest.role === 'Team Lead';
      return false;
    })();

    if (!canApprove) {
      return NextResponse.json(
        { error: 'Insufficient permissions to approve/reject this request' },
        { status: 403 }
      );
    }

    // Check if request is already processed
    if (leaveRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Leave request has already been processed' },
        { status: 400 }
      );
    }

    // Update the leave request
    const updateData: any = {
      status,
      approvedBy: approvedBy || userRole,
      approvedAt: Timestamp.now(),
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason.trim();
    }

    await leaveRequestRef.update(updateData);

    // Get the updated document
    const updatedDoc = await leaveRequestRef.get();
    const updatedRequest = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };

    return NextResponse.json({ 
      leaveRequest: updatedRequest,
      message: `Leave request ${status} successfully` 
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    return NextResponse.json(
      { error: 'Failed to update leave request' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a leave request (only for pending requests)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const userRole = await getSessionAndUserRole(req);
    if (!userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await params;

    // Get the leave request
    const leaveRequestRef = db.collection('LeaveRequests').doc(requestId);
    const leaveRequestDoc = await leaveRequestRef.get();

    if (!leaveRequestDoc.exists) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }

    const leaveRequest = leaveRequestDoc.data();
    if (!leaveRequest) {
      return NextResponse.json(
        { error: 'Leave request data not found' },
        { status: 404 }
      );
    }

    // Check permissions - users can only delete their own pending requests
    // Admins/HR can delete any pending request
    const canDelete = (() => {
      if (userRole === 'Admin' || userRole === 'HR') return true;
      return leaveRequest.userId === userRole && leaveRequest.status === 'pending';
    })();

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this request' },
        { status: 403 }
      );
    }

    // Only allow deletion of pending requests
    if (leaveRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending requests can be deleted' },
        { status: 400 }
      );
    }

    // Delete the leave request
    await leaveRequestRef.delete();

    return NextResponse.json({ 
      message: 'Leave request deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    return NextResponse.json(
      { error: 'Failed to delete leave request' },
      { status: 500 }
    );
  }
}

