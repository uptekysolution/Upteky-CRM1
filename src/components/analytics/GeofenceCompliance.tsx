'use client'

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GeofenceCompliance as GeofenceComplianceData } from '@/lib/analytics'

interface GeofenceComplianceProps {
  data: GeofenceComplianceData
  loading?: boolean
}

export function GeofenceComplianceChart({ data, loading = false }: GeofenceComplianceProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Geofence Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Loading compliance data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Geofence Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">No attendance data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = [
    {
      name: 'Within Geofence',
      value: data.withinGeofence,
      color: '#10b981'
    },
    {
      name: 'Outside Geofence',
      value: data.outsideGeofence,
      color: '#ef4444'
    }
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} check-ins ({((data.value / data.total) * 100).toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Geofence Compliance</CardTitle>
        <p className="text-sm text-muted-foreground">
          Percentage of check-ins within 10km office geofence
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="flex flex-col justify-center space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {data.percentage.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Compliance Rate</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Within Geofence</span>
                </div>
                <Badge variant="outline">{data.withinGeofence}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Outside Geofence</span>
                </div>
                <Badge variant="outline">{data.outsideGeofence}</Badge>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Total Check-ins</span>
                <Badge variant="secondary">{data.total}</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
