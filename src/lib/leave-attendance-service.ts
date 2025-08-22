import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { LeaveRequest, LeavePaymentType } from '@/types/leave';

export interface AttendanceUpdate {
  userId: string;
  date: string;
  status: 'present' | 'absent' | 'leave';
  leaveRequestId?: string;
  paymentType?: LeavePaymentType;
}

export interface PayrollUpdate {
  userId: string;
  month: number;
  year: number;
  presentDays: number;
  leaveDays: number;
  totalDays: number;
}

/**
 * Update attendance records when a leave request is approved
 */
export async function updateAttendanceForLeave(
  leaveRequest: LeaveRequest,
  paymentType: LeavePaymentType
): Promise<void> {
  try {
    const startDate = leaveRequest.startDate.toDate ? leaveRequest.startDate.toDate() : new Date(leaveRequest.startDate);
    const endDate = leaveRequest.endDate.toDate ? leaveRequest.endDate.toDate() : new Date(leaveRequest.endDate);
    
    const attendanceUpdates: AttendanceUpdate[] = [];
    
    // Generate attendance records for each day in the leave period
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      attendanceUpdates.push({
        userId: leaveRequest.userId,
        date: dateString,
        status: paymentType === 'paid' ? 'present' : 'leave',
        leaveRequestId: leaveRequest.id,
        paymentType
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Batch update attendance records
    const batch = db.batch();
    
    for (const update of attendanceUpdates) {
      const attendanceRef = db.collection('Attendance')
        .doc(`${update.userId}_${update.date}`);
      
      batch.set(attendanceRef, {
        userId: update.userId,
        date: update.date,
        status: update.status,
        leaveRequestId: update.leaveRequestId,
        paymentType: update.paymentType,
        updatedAt: Timestamp.now()
      }, { merge: true });
    }
    
    await batch.commit();
    console.log(`Updated attendance for ${attendanceUpdates.length} days for user ${leaveRequest.userId}`);
    
    // Update payroll calculations
    await updatePayrollForLeave(leaveRequest, paymentType);
    
  } catch (error) {
    console.error('Error updating attendance for leave:', error);
    throw error;
  }
}

/**
 * Update payroll calculations when a leave request is approved
 */
export async function updatePayrollForLeave(
  leaveRequest: LeaveRequest,
  paymentType: LeavePaymentType
): Promise<void> {
  try {
    const startDate = leaveRequest.startDate.toDate ? leaveRequest.startDate.toDate() : new Date(leaveRequest.startDate);
    const endDate = leaveRequest.endDate.toDate ? leaveRequest.endDate.toDate() : new Date(leaveRequest.endDate);
    
    const month = startDate.getMonth() + 1;
    const year = startDate.getFullYear();
    
    // Calculate days in the leave period
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Get existing payroll record
    const payrollRef = db.collection('Payroll')
      .doc(`${leaveRequest.userId}_${year}_${month.toString().padStart(2, '0')}`);
    
    const payrollDoc = await payrollRef.get();
    
    if (payrollDoc.exists) {
      const payrollData = payrollDoc.data();
      const currentPresentDays = payrollData?.presentDays || 0;
      const currentLeaveDays = payrollData?.leaveDays || 0;
      const currentTotalDays = payrollData?.totalDays || 0;
      
      // Update based on payment type
      const updates: any = {
        updatedAt: Timestamp.now()
      };
      
      if (paymentType === 'paid') {
        updates.presentDays = currentPresentDays + daysDiff;
        updates.totalDays = currentTotalDays + daysDiff;
      } else {
        updates.leaveDays = currentLeaveDays + daysDiff;
        updates.totalDays = currentTotalDays + daysDiff;
      }
      
      await payrollRef.update(updates);
      console.log(`Updated payroll for user ${leaveRequest.userId} - ${paymentType} leave: ${daysDiff} days`);
    } else {
      // Create new payroll record
      const newPayrollData = {
        userId: leaveRequest.userId,
        month,
        year,
        presentDays: paymentType === 'paid' ? daysDiff : 0,
        leaveDays: paymentType === 'unpaid' ? daysDiff : 0,
        totalDays: daysDiff,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      await payrollRef.set(newPayrollData);
      console.log(`Created new payroll record for user ${leaveRequest.userId}`);
    }
    
  } catch (error) {
    console.error('Error updating payroll for leave:', error);
    throw error;
  }
}

/**
 * Revert attendance and payroll when a leave request is rejected or deleted
 */
export async function revertAttendanceForLeave(leaveRequest: LeaveRequest): Promise<void> {
  try {
    const startDate = leaveRequest.startDate.toDate ? leaveRequest.startDate.toDate() : new Date(leaveRequest.startDate);
    const endDate = leaveRequest.endDate.toDate ? leaveRequest.endDate.toDate() : new Date(leaveRequest.endDate);
    
    // Remove attendance records for the leave period
    const batch = db.batch();
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const attendanceRef = db.collection('Attendance')
        .doc(`${leaveRequest.userId}_${dateString}`);
      
      batch.delete(attendanceRef);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    await batch.commit();
    console.log(`Reverted attendance for leave request ${leaveRequest.id}`);
    
    // Revert payroll calculations if the leave was approved
    if (leaveRequest.status === 'approved' && leaveRequest.paymentType) {
      await revertPayrollForLeave(leaveRequest);
    }
    
  } catch (error) {
    console.error('Error reverting attendance for leave:', error);
    throw error;
  }
}

/**
 * Revert payroll calculations when a leave request is rejected or deleted
 */
export async function revertPayrollForLeave(leaveRequest: LeaveRequest): Promise<void> {
  try {
    const startDate = leaveRequest.startDate.toDate ? leaveRequest.startDate.toDate() : new Date(leaveRequest.startDate);
    const endDate = leaveRequest.endDate.toDate ? leaveRequest.endDate.toDate() : new Date(leaveRequest.endDate);
    
    const month = startDate.getMonth() + 1;
    const year = startDate.getFullYear();
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const payrollRef = db.collection('Payroll')
      .doc(`${leaveRequest.userId}_${year}_${month.toString().padStart(2, '0')}`);
    
    const payrollDoc = await payrollRef.get();
    
    if (payrollDoc.exists) {
      const payrollData = payrollDoc.data();
      const currentPresentDays = payrollData?.presentDays || 0;
      const currentLeaveDays = payrollData?.leaveDays || 0;
      const currentTotalDays = payrollData?.totalDays || 0;
      
      const updates: any = {
        updatedAt: Timestamp.now()
      };
      
      if (leaveRequest.paymentType === 'paid') {
        updates.presentDays = Math.max(0, currentPresentDays - daysDiff);
        updates.totalDays = Math.max(0, currentTotalDays - daysDiff);
      } else {
        updates.leaveDays = Math.max(0, currentLeaveDays - daysDiff);
        updates.totalDays = Math.max(0, currentTotalDays - daysDiff);
      }
      
      await payrollRef.update(updates);
      console.log(`Reverted payroll for user ${leaveRequest.userId} - ${leaveRequest.paymentType} leave: ${daysDiff} days`);
    }
    
  } catch (error) {
    console.error('Error reverting payroll for leave:', error);
    throw error;
  }
}
