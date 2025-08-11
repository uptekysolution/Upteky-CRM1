'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LeaveBalance } from '@/lib/analytics'
import { updateLeaveBalance } from '@/lib/analytics'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Plus, Minus } from 'lucide-react'

interface LeaveTrackerProps {
  leaveBalance: LeaveBalance | null
  loading?: boolean
  onRefresh?: () => void
}

export function LeaveTracker({ leaveBalance, loading = false, onRefresh }: LeaveTrackerProps) {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [leaveDays, setLeaveDays] = useState(1)
  const [isUpdating, setIsUpdating] = useState(false)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Loading leave data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!leaveBalance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">No leave data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleUpdateLeave = async (action: 'add' | 'subtract') => {
    if (!leaveBalance) return

    setIsUpdating(true)
    try {
      const newTaken = action === 'add' 
        ? leaveBalance.taken + leaveDays
        : Math.max(0, leaveBalance.taken - leaveDays)

      await updateLeaveBalance(leaveBalance.uid, leaveBalance.month, newTaken)
      
      toast({
        title: "Leave Updated",
        description: `Successfully ${action === 'add' ? 'added' : 'subtracted'} ${leaveDays} day(s)`,
      })

      setIsDialogOpen(false)
      setLeaveDays(1)
      onRefresh?.()
    } catch (error) {
      console.error('Error updating leave:', error)
      toast({
        title: "Error",
        description: "Failed to update leave balance",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getProgressPercentage = () => {
    if (!leaveBalance) return 0
    return (leaveBalance.taken / leaveBalance.allocated) * 100
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Leave Tracker
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          2 days/month allowance with carry-forward from previous months
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Leave Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {leaveBalance.allocated}
            </div>
            <p className="text-sm text-green-700">Total Allocated</p>
            {leaveBalance.carryForward && leaveBalance.carryForward > 0 && (
              <p className="text-xs text-green-600 mt-1">
                +{leaveBalance.carryForward} carried forward
              </p>
            )}
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {leaveBalance.taken}
            </div>
            <p className="text-sm text-blue-700">Days Taken</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">
              {leaveBalance.remaining}
            </div>
            <p className="text-sm text-purple-700">Days Remaining</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Leave Usage</span>
            <span>{getProgressPercentage().toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(getProgressPercentage())}`}
              style={{ width: `${Math.min(getProgressPercentage(), 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Leave Details Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Leave Details</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Update Leave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Leave Balance</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="leaveDays">Number of Days</Label>
                    <Input
                      id="leaveDays"
                      type="number"
                      min="1"
                      max={leaveBalance.remaining}
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateLeave('add')}
                      disabled={isUpdating || leaveDays > leaveBalance.remaining}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Leave
                    </Button>
                    <Button
                      onClick={() => handleUpdateLeave('subtract')}
                      disabled={isUpdating || leaveDays > leaveBalance.taken}
                      variant="outline"
                      className="flex-1"
                    >
                      <Minus className="h-4 w-4 mr-2" />
                      Subtract Leave
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Allocated</TableHead>
                <TableHead>Taken</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Carry Forward</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  {leaveBalance.month}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{leaveBalance.allocated}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{leaveBalance.taken}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="default">{leaveBalance.remaining}</Badge>
                </TableCell>
                <TableCell>
                  {leaveBalance.carryForward ? (
                    <Badge variant="outline" className="text-green-600">
                      +{leaveBalance.carryForward}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
