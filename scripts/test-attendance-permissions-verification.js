/**
 * Attendance Permission System Verification Script
 * This script tests the complete attendance permission functionality
 */

const { db } = require('../src/lib/firebase-admin');
const { 
  checkAttendancePermissions, 
  getAttendanceFilterByPermissions,
  canViewAttendanceRecord,
  getUserPermissions 
} = require('../src/lib/attendance-permissions');

// Test scenarios
const testScenarios = [
  {
    name: 'Employee with attendance:view:own only',
    user: {
      id: 'test-employee-own',
      role: 'Employee',
      permissions: ['attendance:view:own']
    },
    expected: {
      canViewOwn: true,
      canViewAll: false,
      canViewTeam: false,
      hasAnyPermission: true,
      shouldSeeOwnRecords: true,
      shouldSeeOtherRecords: false,
      shouldSeeAdminRecords: false
    }
  },
  {
    name: 'Employee with attendance:view:all only',
    user: {
      id: 'test-employee-all',
      role: 'Employee',
      permissions: ['attendance:view:all']
    },
    expected: {
      canViewOwn: false,
      canViewAll: true,
      canViewTeam: false,
      hasAnyPermission: true,
      shouldSeeOwnRecords: true, // Users can always see their own records
      shouldSeeOtherRecords: true,
      shouldSeeAdminRecords: false // Admin records should be excluded
    }
  },
  {
    name: 'Team Lead with attendance:view:team',
    user: {
      id: 'test-team-lead',
      role: 'Team Lead',
      permissions: ['attendance:view:own', 'attendance:view:team']
    },
    expected: {
      canViewOwn: true,
      canViewAll: false,
      canViewTeam: true,
      hasAnyPermission: true,
      shouldSeeOwnRecords: true,
      shouldSeeOtherRecords: true, // Team members
      shouldSeeAdminRecords: false
    }
  },
  {
    name: 'HR with attendance:view:all',
    user: {
      id: 'test-hr',
      role: 'HR',
      permissions: ['attendance:view:all']
    },
    expected: {
      canViewOwn: false,
      canViewAll: true,
      canViewTeam: false,
      hasAnyPermission: true,
      shouldSeeOwnRecords: true,
      shouldSeeOtherRecords: true,
      shouldSeeAdminRecords: false
    }
  },
  {
    name: 'Admin with all permissions',
    user: {
      id: 'test-admin',
      role: 'Admin',
      permissions: ['attendance:view:own', 'attendance:view:team', 'attendance:view:all']
    },
    expected: {
      canViewOwn: true,
      canViewAll: true,
      canViewTeam: true,
      hasAnyPermission: true,
      shouldSeeOwnRecords: true,
      shouldSeeOtherRecords: true,
      shouldSeeAdminRecords: true // Admin can see everything
    }
  },
  {
    name: 'User with no attendance permissions',
    user: {
      id: 'test-no-permission',
      role: 'Employee',
      permissions: []
    },
    expected: {
      canViewOwn: false,
      canViewAll: false,
      canViewTeam: false,
      hasAnyPermission: false,
      shouldSeeOwnRecords: false,
      shouldSeeOtherRecords: false,
      shouldSeeAdminRecords: false
    }
  }
];

// Mock attendance records for testing
const mockAttendanceRecords = [
  { id: '1', userId: 'test-employee-own', role: 'Employee', date: '2024-01-15', status: 'present' },
  { id: '2', userId: 'test-employee-all', role: 'Employee', date: '2024-01-15', status: 'present' },
  { id: '3', userId: 'test-team-lead', role: 'Team Lead', date: '2024-01-15', status: 'present' },
  { id: '4', userId: 'test-hr', role: 'HR', date: '2024-01-15', status: 'present' },
  { id: '5', userId: 'test-admin', role: 'Admin', date: '2024-01-15', status: 'present' },
  { id: '6', userId: 'test-no-permission', role: 'Employee', date: '2024-01-15', status: 'present' }
];

async function testAttendancePermissions() {
  console.log('🧪 Testing Attendance Permission System...\n');

  let allTestsPassed = true;

  for (const scenario of testScenarios) {
    console.log(`📋 Testing: ${scenario.name}`);
    console.log(`   User: ${scenario.user.role} (${scenario.user.id})`);
    console.log(`   Permissions: [${scenario.user.permissions.join(', ')}]`);

    try {
      // Test 1: Check permission structure
      const permissions = await checkAttendancePermissions(
        scenario.user.id,
        scenario.user.role,
        scenario.user.permissions
      );

      const permissionChecks = [
        { name: 'canViewOwn', actual: permissions.canViewOwn, expected: scenario.expected.canViewOwn },
        { name: 'canViewAll', actual: permissions.canViewAll, expected: scenario.expected.canViewAll },
        { name: 'canViewTeam', actual: permissions.canViewTeam, expected: scenario.expected.canViewTeam },
        { name: 'hasAnyPermission', actual: permissions.hasAnyPermission, expected: scenario.expected.hasAnyPermission }
      ];

      let scenarioPassed = true;
      for (const check of permissionChecks) {
        const status = check.actual === check.expected ? '✅' : '❌';
        console.log(`   ${status} ${check.name}: ${check.actual} (expected: ${check.expected})`);
        if (check.actual !== check.expected) {
          scenarioPassed = false;
        }
      }

      // Test 2: Check attendance filtering
      const { filter, error } = await getAttendanceFilterByPermissions(
        scenario.user.id,
        scenario.user.role,
        scenario.user.permissions
      );

      if (scenario.expected.hasAnyPermission) {
        if (error) {
          console.log(`   ❌ Unexpected error: ${error}`);
          scenarioPassed = false;
        } else if (filter) {
          const filteredRecords = await filter(mockAttendanceRecords);
          console.log(`   📊 Filtered records: ${filteredRecords.length}/${mockAttendanceRecords.length}`);
          
          // Check if own records are included
          const ownRecord = filteredRecords.find(r => r.userId === scenario.user.id);
          const hasOwnRecord = !!ownRecord;
          const ownStatus = hasOwnRecord === scenario.expected.shouldSeeOwnRecords ? '✅' : '❌';
          console.log(`   ${ownStatus} Own records visible: ${hasOwnRecord} (expected: ${scenario.expected.shouldSeeOwnRecords})`);
          
          // Check if other records are included
          const otherRecords = filteredRecords.filter(r => r.userId !== scenario.user.id);
          const hasOtherRecords = otherRecords.length > 0;
          const otherStatus = hasOtherRecords === scenario.expected.shouldSeeOtherRecords ? '✅' : '❌';
          console.log(`   ${otherStatus} Other records visible: ${hasOtherRecords} (expected: ${scenario.expected.shouldSeeOtherRecords})`);
          
          // Check if admin records are excluded (for non-admin users)
          const adminRecords = filteredRecords.filter(r => r.role === 'Admin');
          const hasAdminRecords = adminRecords.length > 0;
          const adminStatus = hasAdminRecords === scenario.expected.shouldSeeAdminRecords ? '✅' : '❌';
          console.log(`   ${adminStatus} Admin records visible: ${hasAdminRecords} (expected: ${scenario.expected.shouldSeeAdminRecords})`);
          
          if (hasOwnRecord !== scenario.expected.shouldSeeOwnRecords ||
              hasOtherRecords !== scenario.expected.shouldSeeOtherRecords ||
              hasAdminRecords !== scenario.expected.shouldSeeAdminRecords) {
            scenarioPassed = false;
          }
        }
      } else {
        if (!error) {
          console.log(`   ❌ Expected error but got none`);
          scenarioPassed = false;
        } else {
          console.log(`   ✅ Correctly blocked: ${error}`);
        }
      }

      // Test 3: Check specific record access
      const testCases = [
        { targetUser: scenario.user.id, shouldAccess: scenario.expected.shouldSeeOwnRecords, description: 'own record' },
        { targetUser: 'test-employee-own', shouldAccess: scenario.expected.shouldSeeOtherRecords, description: 'other employee record' },
        { targetUser: 'test-admin', shouldAccess: scenario.expected.shouldSeeAdminRecords, description: 'admin record' }
      ];

      for (const testCase of testCases) {
        const canView = await canViewAttendanceRecord(
          testCase.targetUser,
          scenario.user.id,
          scenario.user.role,
          scenario.user.permissions
        );
        
        const status = canView === testCase.shouldAccess ? '✅' : '❌';
        console.log(`   ${status} Can view ${testCase.description}: ${canView} (expected: ${testCase.shouldAccess})`);
        
        if (canView !== testCase.shouldAccess) {
          scenarioPassed = false;
        }
      }

      if (scenarioPassed) {
        console.log(`   🎉 ${scenario.name} - ALL TESTS PASSED\n`);
      } else {
        console.log(`   💥 ${scenario.name} - SOME TESTS FAILED\n`);
        allTestsPassed = false;
      }

    } catch (error) {
      console.log(`   💥 Error testing ${scenario.name}:`, error.message);
      allTestsPassed = false;
    }
  }

  // Summary
  console.log('📋 Test Summary:');
  if (allTestsPassed) {
    console.log('   🎉 ALL SCENARIOS PASSED!');
    console.log('   ✅ Permission checks working correctly');
    console.log('   ✅ Attendance filtering working correctly');
    console.log('   ✅ Record access control working correctly');
    console.log('   ✅ Admin exclusion working correctly');
  } else {
    console.log('   💥 SOME SCENARIOS FAILED!');
    console.log('   ⚠️  Please check the failed tests above');
  }

  return allTestsPassed;
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAttendancePermissions()
    .then((success) => {
      if (success) {
        console.log('\n✨ Attendance Permission System is working correctly!');
        process.exit(0);
      } else {
        console.log('\n💥 Attendance Permission System has issues that need to be fixed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Test failed with error:', error);
      process.exit(1);
    });
}

module.exports = { testAttendancePermissions };
