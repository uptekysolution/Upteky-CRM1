# Attendance Analytics Module

A comprehensive role-based attendance analytics dashboard for Next.js 15 with Firebase integration.

## Features

### 📊 Analytics Dashboard
- **Attendance Trends**: Line charts showing Present/Remote/Absent days per month
- **Geofence Compliance**: Pie charts showing % of check-ins within 10km geofence
- **Team Performance**: Average attendance rates per team (Admin/Sub-Admin/Team Lead only)
- **Leave Tracking**: 2 days/month allowance with carry-forward functionality
- **Holiday Calendar**: Monthly calendar with predefined holidays and attendance status

### 🔐 Role-Based Access Control

#### Admin & Sub-Admin (`/admin/dashboard/attendance-analytics`)
- View all analytics for all users
- Access to team performance metrics
- Full leave management capabilities

#### HR (`/employee/dashboard/attendance-analytics`)
- View analytics for Employees only
- Cannot see Admin/Sub-Admin data
- Access to leave tracking for employees

#### Team Lead (`/employee/dashboard/attendance-analytics`)
- View analytics for their team members only
- Cannot see HR or Admin data
- Access to team performance metrics for their team

#### Employee (`/employee/dashboard/attendance-analytics`)
- View their own analytics only
- Cannot see team or other user data
- Access to personal leave tracking

## Data Structure

### Firestore Collections

#### `attendance` Collection
```typescript
{
  uid: string,
  role: string,
  date: string, // YYYY-MM-DD
  status: 'Present' | 'Remote' | 'Absent',
  withinGeofence: boolean,
  checkIn?: Timestamp,
  checkOut?: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `leave_balance` Collection
```typescript
{
  uid: string,
  month: string, // YYYY-MM
  allocated: number, // 2 + carry forward
  taken: number,
  remaining: number,
  carryForward?: number
}
```

### Predefined Holidays (2025)
- New Year's Day (Jan 1)
- Makar Sankranti (Jan 14)
- Dhuleti (Mar 14)
- Independence Day (Aug 15)
- Gandhi Jayanti & Dussehra (Oct 2)
- Ganesh Chaturthi (Sep 6)
- Diwali (Oct 20-22)
- Christmas Day (Dec 25)

## Components

### Core Components
- `AnalyticsDashboard`: Main dashboard container with role-based data filtering
- `TrendsChart`: Line chart for attendance trends
- `GeofenceComplianceChart`: Pie chart for geofence compliance
- `LeaveTracker`: Leave balance management with carry-forward
- `HolidayCalendar`: Interactive calendar with holidays and attendance
- `TeamMetricsTable`: Team performance metrics table

### Hooks
- `useAttendanceAnalytics`: Custom hook for fetching and managing analytics data

### Utilities
- `analytics.ts`: Core analytics functions and data processing
- `holidays.ts`: Holiday constants and utility functions

## Installation & Setup

1. **Dependencies**: Ensure `recharts` is installed for charts
2. **Firebase**: Configure Firebase Auth and Firestore
3. **Data Structure**: Set up the required Firestore collections
4. **Routing**: Add analytics routes to your Next.js app

## Usage

### Basic Implementation
```tsx
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export default function AnalyticsPage() {
  return (
    <AnalyticsDashboard 
      userRole="Admin"
      userId="user123"
      teamId="team456"
    />
  )
}
```

### Role-Based Access
```tsx
// Admin/Sub-Admin route
// /admin/dashboard/attendance-analytics

// Employee routes (HR, Team Lead, Employee)
// /employee/dashboard/attendance-analytics
```

## Business Logic

### Leave Management
- **Monthly Allocation**: 2 days per month
- **Carry Forward**: Unused leaves carry forward to next month
- **No Limit**: Unlimited carry-forward unless specified otherwise
- **Automatic Calculation**: System automatically calculates carry-forward

### Attendance Status
- **Present**: Check-in and check-out within geofence
- **Remote**: Check-in and check-out outside geofence
- **Absent**: No attendance record for the day

### Geofence Compliance
- **10km Radius**: Check-ins within 10km of office location
- **Real-time Calculation**: Percentage calculated from actual check-in data
- **Visual Indicators**: Color-coded compliance status

## Styling

- **TailwindCSS**: All components use Tailwind for styling
- **ShadCN UI**: Consistent design system with ShadCN components
- **Responsive**: Mobile-first responsive design
- **Color Coding**: 
  - Green: Present/Within Geofence
  - Blue: Remote
  - Gray: Absent
  - Red: Holidays/Outside Geofence

## Real-time Updates

- **Firestore Listeners**: Real-time data updates using `onSnapshot`
- **Live Charts**: Charts update automatically when data changes
- **Instant Feedback**: UI updates immediately on data changes

## Performance

- **Optimized Queries**: Role-based filtering at database level
- **Lazy Loading**: Components load data only when needed
- **Caching**: Efficient data caching and state management
- **Debounced Updates**: Optimized for frequent data changes

## Security

- **Role Validation**: Server-side and client-side role checks
- **Data Filtering**: Users can only access data they're authorized to see
- **Firebase Rules**: Implement proper Firestore security rules
- **Input Validation**: All user inputs are validated

## Customization

### Adding New Holidays
```typescript
// In src/lib/constants/holidays.ts
export const HOLIDAYS_2025: Holiday[] = [
  // ... existing holidays
  {
    date: '2025-12-31',
    day: 'Wednesday',
    name: 'New Year\'s Eve'
  }
]
```

### Custom Date Ranges
```typescript
// In AnalyticsDashboard component
const [dateRange, setDateRange] = useState('3months')
// Options: '1month', '3months', '6months', '1year'
```

### Custom Team Metrics
```typescript
// Extend TeamMetrics interface in analytics.ts
interface TeamMetrics {
  // ... existing properties
  customMetric?: number
}
```

## Troubleshooting

### Common Issues
1. **No Data Displayed**: Check Firestore permissions and data structure
2. **Role Access Issues**: Verify user role in Firestore users collection
3. **Chart Not Rendering**: Ensure recharts is properly installed
4. **Real-time Updates Not Working**: Check Firestore listener setup

### Debug Mode
Enable debug logging in development:
```typescript
// In useAttendanceAnalytics hook
if (process.env.NODE_ENV === 'development') {
  console.log('Analytics data:', data)
}
```

## Future Enhancements

- **Export Functionality**: PDF/Excel export of analytics data
- **Advanced Filtering**: Date range picker and custom filters
- **Notifications**: Alerts for low attendance or leave balance
- **Mobile App**: React Native version for mobile access
- **API Endpoints**: REST API for external integrations
