# Leave Management System

A comprehensive Attendance Leave Approval System integrated with the existing Next.js + Firebase project.

## Features

### 🎯 Core Functionality

- **Leave Request Flow**: Employees can submit leave requests with date range selection
- **Admin Approval System**: Role-based approval workflow with real-time notifications
- **Calendar Integration**: Visual calendar showing leave status and attendance
- **Leave Balance Tracking**: Automatic calculation of monthly leave limits
- **Real-time Updates**: Firestore snapshot listeners for instant updates

### 📋 Leave Types

1. **Monthly Leave**: Fixed 2 days per month allowance
2. **Emergency/Medical**: For medical emergencies and urgent matters
3. **Miscellaneous**: Other personal or professional reasons

### 👥 Role-Based Access

- **Admin**: Can view and approve/reject all leave requests
- **HR**: Can manage all requests except Admin/Sub-Admin
- **Sub-Admin**: Can manage Employee and Team Lead requests
- **Team Lead**: Can view team member requests (enhanced with team logic)
- **Employee**: Can only view and manage their own requests

## System Architecture

### Database Schema

#### LeaveRequests Collection
```typescript
{
  id: string,
  userId: string,
  userName: string,
  role: string,
  leaveType: 'monthly' | 'emergency' | 'miscellaneous',
  startDate: Timestamp,
  endDate: Timestamp,
  reason: string,
  status: 'pending' | 'approved' | 'rejected',
  requestedAt: Timestamp,
  approvedBy?: string,
  approvedAt?: Timestamp,
  rejectionReason?: string
}
```

### API Endpoints

#### `/api/internal/leave-requests`
- `GET`: Fetch leave requests with role-based filtering
- `POST`: Create new leave request with validation

#### `/api/internal/leave-requests/[requestId]`
- `PUT`: Update leave request status (approve/reject)
- `DELETE`: Delete pending leave request

#### `/api/internal/leave-balance`
- `GET`: Fetch leave balance and history for a user

## Components

### Core Components

1. **LeaveRequestForm** (`src/components/attendance/LeaveRequestForm.tsx`)
   - Date range selection with validation
   - Leave type selection with descriptions
   - Monthly leave limit enforcement
   - Form validation and error handling

2. **LeaveRequestsTable** (`src/components/attendance/LeaveRequestsTable.tsx`)
   - Admin interface for managing requests
   - Role-based action permissions
   - Detailed request information display
   - Approval/rejection workflow

3. **LeaveCalendar** (`src/components/ui/leave-calendar.tsx`)
   - Enhanced calendar with leave integration
   - Role-based visibility controls
   - Visual indicators for different leave types
   - Attendance and leave status display

### Pages

1. **Employee Leave Page** (`src/app/dashboard/leave-requests/page.tsx`)
   - Leave balance overview
   - Request submission interface
   - Personal request history
   - Calendar view

2. **Admin Leave Page** (`src/app/admin/dashboard/leave-requests/page.tsx`)
   - All requests management
   - Statistics and analytics
   - Filtering and search capabilities
   - Bulk operations

## Hooks and Utilities

### useLeaveManagement Hook
```typescript
const {
  leaveRequests,
  leaveBalance,
  isLoading,
  submitLeaveRequest,
  updateLeaveRequestStatus,
  deleteLeaveRequest,
  getPendingRequestsCount,
  getMonthlyLeaveUsed
} = useLeaveManagement({
  userRole: 'Employee',
  currentUserId: 'user-123',
  currentUserName: 'John Doe'
});
```

### Types
```typescript
// Leave request types
type LeaveType = 'monthly' | 'emergency' | 'miscellaneous';
type LeaveStatus = 'pending' | 'approved' | 'rejected';

// Form data interface
interface LeaveRequestFormData {
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
}
```

## Business Rules

### Leave Validation
- **Past Dates**: Cannot request leave for past dates
- **Date Range**: End date must be after start date
- **Monthly Limits**: Maximum 2 approved days per month for monthly leave
- **Reason Length**: Minimum 10 characters required
- **Duplicate Prevention**: System prevents overlapping approved requests

### Approval Workflow
1. Employee submits leave request
2. Request is stored with 'pending' status
3. Admins/HR receive real-time notifications
4. Admin reviews and approves/rejects with reason
5. Employee receives status update notification
6. Calendar is automatically updated

### Role Permissions
- **View Permissions**: Based on role hierarchy
- **Action Permissions**: Approve/reject based on role and target user role
- **Data Access**: Filtered based on user role and team membership

## Integration Points

### Existing Attendance System
- Calendar integration shows both attendance and leave status
- Leave requests affect attendance calculations
- Unified dashboard experience

### Firebase Integration
- Firestore for data persistence
- Real-time listeners for instant updates
- Firebase Admin SDK for secure server operations

### UI Components
- Uses existing shadcn/ui components
- Consistent design language
- Responsive design for mobile and desktop

## Security Features

### Authentication & Authorization
- Role-based access control
- User session validation
- Secure API endpoints with role verification

### Data Validation
- Server-side validation for all inputs
- Date range validation
- Business rule enforcement
- SQL injection prevention through Firestore

## Usage Examples

### Submitting a Leave Request
```typescript
const handleSubmit = async (formData: LeaveRequestFormData) => {
  try {
    await submitLeaveRequest(formData);
    toast({
      title: 'Leave Request Submitted',
      description: 'Your request is pending approval.',
    });
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Submission Failed',
      description: error.message,
    });
  }
};
```

### Approving a Leave Request
```typescript
const handleApprove = async (requestId: string) => {
  try {
    await updateLeaveRequestStatus(requestId, 'approved');
    toast({
      title: 'Leave Request Approved',
      description: 'The request has been approved successfully.',
    });
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Approval Failed',
      description: error.message,
    });
  }
};
```

## Future Enhancements

### Planned Features
1. **Team Management**: Enhanced team-based leave management
2. **Leave Policies**: Configurable leave policies per role
3. **Notifications**: Email and push notifications
4. **Reports**: Advanced analytics and reporting
5. **Mobile App**: Native mobile application
6. **Integration**: HR system integration

### Technical Improvements
1. **Real-time Notifications**: WebSocket implementation
2. **Offline Support**: Service worker for offline functionality
3. **Performance**: Caching and optimization
4. **Testing**: Comprehensive test coverage
5. **Monitoring**: Error tracking and analytics

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install date-fns
   ```

2. **Database Setup**
   - Ensure Firestore is configured
   - Create LeaveRequests collection
   - Set up appropriate security rules

3. **Environment Variables**
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   ```

4. **Component Integration**
   - Add UserProvider to your app layout
   - Include leave management routes in navigation
   - Update existing attendance pages

## Troubleshooting

### Common Issues
1. **Date Validation Errors**: Ensure date-fns is properly installed
2. **Permission Errors**: Check user role and permissions
3. **Real-time Updates**: Verify Firestore listeners are active
4. **Calendar Display**: Check leave request data format

### Debug Mode
Enable debug logging by setting:
```typescript
const DEBUG_MODE = process.env.NODE_ENV === 'development';
```

## Support

For technical support or feature requests, please refer to the project documentation or contact the development team.

