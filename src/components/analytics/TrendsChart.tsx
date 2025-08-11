'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MonthlyTrends } from '@/lib/analytics'

interface TrendsChartProps {
  data: MonthlyTrends[]
  loading?: boolean
}

export function TrendsChart({ data, loading = false }: TrendsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Loading trends...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">No attendance data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Format data for chart
  const chartData = data.map(item => ({
    month: item.month,
    Present: item.present,
    Remote: item.remote,
    Absent: item.absent
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Trends</CardTitle>
        <p className="text-sm text-muted-foreground">
          Monthly attendance patterns showing Present, Remote, and Absent days
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tickFormatter={(value) => {
                const [year, month] = value.split('-')
                return `${month}/${year.slice(2)}`
              }}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => {
                const [year, month] = value.split('-')
                const monthNames = [
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ]
                return `${monthNames[parseInt(month) - 1]} ${year}`
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Present" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="Remote" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="Absent" 
              stroke="#6b7280" 
              strokeWidth={2}
              dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
