'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuditLogs, useAuditLogsStats } from '@/hooks/use-audit-logs'
import { Loader2, Search, Filter, Calendar } from 'lucide-react'
import { format } from 'date-fns'

// Fallback mock data for when Firebase is not configured
const mockAuditLogs = [
  {
    id: "1",
    userId: "admin-123",
    userEmail: "admin@upteky.com",
    userRole: "Admin",
    actionType: "update" as const,
    moduleAccessed: "Permissions",
    description: "Changed 'HR' role permissions for 'Payroll' module.",
    timestamp: new Date(),
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    status: "success" as const,
    severity: "low" as const,
  },
  {
    id: "2",
    userId: "hr-456",
    userEmail: "hr@upteky.com",
    userRole: "HR",
    actionType: "read" as const,
    moduleAccessed: "Payroll",
    description: "Viewed payroll records for 'John Doe'.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    ipAddress: "192.168.1.5",
    userAgent: "Mozilla/5.0...",
    status: "success" as const,
  },
  {
    id: "3",
    userId: "employee-789",
    userEmail: "employee@upteky.com",
    userRole: "Employee",
    actionType: "read" as const,
    moduleAccessed: "Payroll",
    description: "Attempted to access payroll data.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0...",
    status: "failed" as const,
    severity: "medium" as const,
  },
];

const mockStats = {
  total: 3,
  unusual: 1,
  failed: 1,
  today: 3,
};

export default function AuditLogTable() {
  const [filters, setFilters] = useState({
    userRole: 'all',
    actionType: 'all',
    moduleAccessed: 'all',
    status: 'all',
    search: '',
  })

  // Try to use real data, fallback to mock data if there's an error
  const { logs: realLogs, loading, error } = useAuditLogs({ limit: 100 })
  const { stats: realStats } = useAuditLogsStats()

  // Use real data if available, otherwise use mock data
  const logs = error ? mockAuditLogs : realLogs
  const stats = error ? mockStats : realStats

  const filteredLogs = logs.filter(log => {
    if (filters.userRole !== 'all' && log.userRole !== filters.userRole) return false
    if (filters.actionType !== 'all' && log.actionType !== filters.actionType) return false
    if (filters.moduleAccessed !== 'all' && log.moduleAccessed !== filters.moduleAccessed) return false
    if (filters.status !== 'all' && log.status !== filters.status) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        log.userEmail.toLowerCase().includes(searchLower) ||
        log.description.toLowerCase().includes(searchLower) ||
        log.moduleAccessed.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'outline'
      case 'failed':
        return 'destructive'
      case 'pending':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getActionVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'update':
      case 'write':
        return 'default'
      case 'delete':
        return 'destructive'
      case 'read':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getSeverityVariant = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Logs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.unusual}</div>
            <div className="text-sm text-muted-foreground">Unusual Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed Actions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
            <div className="text-sm text-muted-foreground">Today's Events</div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <p className="text-sm text-yellow-800">
              Using demo data. Firebase connection not configured. 
              <span className="ml-2 text-xs text-yellow-600">
                Configure Firebase Admin SDK environment variables to see real audit logs.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={filters.userRole} onValueChange={(value) => setFilters(prev => ({ ...prev, userRole: value }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
            <SelectItem value="Team Lead">Team Lead</SelectItem>
            <SelectItem value="Employee">Employee</SelectItem>
            <SelectItem value="Client">Client</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.actionType} onValueChange={(value) => setFilters(prev => ({ ...prev, actionType: value }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="write">Write</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading audit logs...</p>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No audit logs found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.userEmail}</div>
                      <div className="text-sm text-muted-foreground">{log.userRole}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionVariant(log.actionType)}>
                      {log.actionType.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.moduleAccessed}</TableCell>
                  <TableCell className="max-w-xs truncate" title={log.description}>
                    {log.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {format(log.timestamp, 'MMM dd, yyyy HH:mm')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(log.status)}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.severity && (
                      <Badge variant={getSeverityVariant(log.severity)}>
                        {log.severity}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Simple Card component for stats
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border rounded-lg bg-card ${className}`}>
      {children}
    </div>
  )
}

function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}
