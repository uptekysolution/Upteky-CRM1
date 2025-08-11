'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TeamMetrics as TeamMetricsData } from '@/lib/analytics'
import { Users, TrendingUp, TrendingDown } from 'lucide-react'

interface TeamMetricsProps {
  data: TeamMetricsData[]
  loading?: boolean
}

export function TeamMetricsTable({ data, loading = false }: TeamMetricsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Loading team metrics...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">No team data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAttendanceIcon = (percentage: number) => {
    if (percentage >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  const getAttendanceBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>
    if (percentage >= 80) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Good</Badge>
    if (percentage >= 70) return <Badge variant="default" className="bg-orange-100 text-orange-800">Fair</Badge>
    return <Badge variant="default" className="bg-red-100 text-red-800">Poor</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Performance Metrics
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Average attendance rates and performance by team
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                {data.length}
              </div>
              <p className="text-sm text-blue-700">Total Teams</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {data.reduce((sum, team) => sum + team.totalMembers, 0)}
              </div>
              <p className="text-sm text-green-700">Total Members</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">
                {(data.reduce((sum, team) => sum + team.averageAttendance, 0) / data.length).toFixed(1)}%
              </div>
              <p className="text-sm text-purple-700">Avg. Attendance</p>
            </div>
          </div>

          {/* Team Metrics Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Team Details</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  <TableHead>Present Days</TableHead>
                  <TableHead>Remote Days</TableHead>
                  <TableHead>Absent Days</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((team) => (
                  <TableRow key={team.teamId}>
                    <TableCell className="font-medium">
                      {team.teamName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{team.totalMembers}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getAttendanceIcon(team.averageAttendance)}
                        <span className={`font-medium ${getAttendanceColor(team.averageAttendance)}`}>
                          {team.averageAttendance.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={team.averageAttendance} 
                        className="mt-1 h-2"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {team.presentDays}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        {team.remoteDays}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-gray-100 text-gray-800">
                        {team.absentDays}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getAttendanceBadge(team.averageAttendance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Performance Insights */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Performance Insights</h4>
            <div className="space-y-2 text-sm text-gray-600">
              {data.length > 0 && (
                <>
                  <div>
                    • Best performing team: <span className="font-medium">
                      {data.reduce((best, current) => 
                        current.averageAttendance > best.averageAttendance ? current : best
                      ).teamName}
                    </span>
                  </div>
                  <div>
                    • Overall average attendance: <span className="font-medium">
                      {(data.reduce((sum, team) => sum + team.averageAttendance, 0) / data.length).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    • Teams with >90% attendance: <span className="font-medium">
                      {data.filter(team => team.averageAttendance >= 90).length}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
