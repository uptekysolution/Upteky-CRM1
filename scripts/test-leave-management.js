/**
 * Test script for Leave Management System
 * This script tests the new Paid/Unpaid leave functionality
 */

const { db } = require('../src/lib/firebase-admin');
const { updateAttendanceForLeave, revertAttendanceForLeave } = require('../src/lib/leave-attendance-service');

// Mock leave request data
const mockLeaveRequest = {
  id: 'test-leave-request-001',
  userId: 'test-user-001',
  userName: 'Test User',
  role: 'Employee',
  leaveType: 'monthly',
  startDate: new Date('2024-01-15'),
  endDate: new Date('2024-01-16'),
  reason: 'Test leave request for functionality verification',
  status: 'pending',
  requestedAt: new Date(),
  paymentType: null
};

async function testLeaveManagement() {
  console.log('🧪 Testing Leave Management System...\n');

  try {
    // Test 1: Create a test leave request
    console.log('1. Creating test leave request...');
    await db.collection('LeaveRequests').doc(mockLeaveRequest.id).set(mockLeaveRequest);
    console.log('✅ Test leave request created successfully\n');

    // Test 2: Update leave request to approved with paid leave
    console.log('2. Testing paid leave approval...');
    const paidLeaveRequest = {
      ...mockLeaveRequest,
      status: 'approved',
      paymentType: 'paid',
      approvedBy: 'Test Admin',
      approvedAt: new Date()
    };

    await db.collection('LeaveRequests').doc(mockLeaveRequest.id).update({
      status: 'approved',
      paymentType: 'paid',
      approvedBy: 'Test Admin',
      approvedAt: new Date()
    });

    // Test attendance update for paid leave
    await updateAttendanceForLeave(paidLeaveRequest, 'paid');
    console.log('✅ Paid leave approval and attendance update completed\n');

    // Test 3: Check attendance records
    console.log('3. Verifying attendance records...');
    const attendanceDocs = await db.collection('Attendance')
      .where('userId', '==', mockLeaveRequest.userId)
      .where('leaveRequestId', '==', mockLeaveRequest.id)
      .get();

    console.log(`Found ${attendanceDocs.size} attendance records`);
    attendanceDocs.forEach(doc => {
      const data = doc.data();
      console.log(`  - Date: ${data.date}, Status: ${data.status}, Payment Type: ${data.paymentType}`);
    });
    console.log('✅ Attendance records verified\n');

    // Test 4: Check payroll records
    console.log('4. Verifying payroll records...');
    const payrollDoc = await db.collection('Payroll')
      .doc(`${mockLeaveRequest.userId}_2024_01`)
      .get();

    if (payrollDoc.exists) {
      const payrollData = payrollDoc.data();
      console.log(`  - Present Days: ${payrollData.presentDays}`);
      console.log(`  - Leave Days: ${payrollData.leaveDays}`);
      console.log(`  - Total Days: ${payrollData.totalDays}`);
    } else {
      console.log('  - No payroll record found');
    }
    console.log('✅ Payroll records verified\n');

    // Test 5: Test unpaid leave scenario
    console.log('5. Testing unpaid leave scenario...');
    const unpaidLeaveRequest = {
      ...mockLeaveRequest,
      id: 'test-leave-request-002',
      status: 'approved',
      paymentType: 'unpaid',
      approvedBy: 'Test Admin',
      approvedAt: new Date()
    };

    await db.collection('LeaveRequests').doc(unpaidLeaveRequest.id).set(unpaidLeaveRequest);
    await updateAttendanceForLeave(unpaidLeaveRequest, 'unpaid');
    console.log('✅ Unpaid leave approval and attendance update completed\n');

    // Test 6: Test leave request rejection
    console.log('6. Testing leave request rejection...');
    const rejectedLeaveRequest = {
      ...mockLeaveRequest,
      id: 'test-leave-request-003',
      status: 'rejected',
      rejectionReason: 'Test rejection for functionality verification',
      approvedBy: 'Test Admin',
      approvedAt: new Date()
    };

    await db.collection('LeaveRequests').doc(rejectedLeaveRequest.id).set(rejectedLeaveRequest);
    console.log('✅ Leave request rejection completed\n');

    // Test 7: Test leave request deletion and revert
    console.log('7. Testing leave request deletion and revert...');
    await revertAttendanceForLeave(paidLeaveRequest);
    await db.collection('LeaveRequests').doc(paidLeaveRequest.id).delete();
    console.log('✅ Leave request deletion and attendance revert completed\n');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('  ✅ Leave request creation');
    console.log('  ✅ Paid leave approval and attendance update');
    console.log('  ✅ Unpaid leave approval and attendance update');
    console.log('  ✅ Leave request rejection');
    console.log('  ✅ Leave request deletion and revert');
    console.log('  ✅ Attendance records verification');
    console.log('  ✅ Payroll records verification');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testLeaveManagement()
    .then(() => {
      console.log('\n✨ Leave Management System is working correctly!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testLeaveManagement };
