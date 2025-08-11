'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Send, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { addLeaveRequest, fetchLeaveBalance, fetchLeaveRequests } from '@/lib/analytics'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'

interface LeaveRequest {
  id: string
  uid: string
  date: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAt: any
  month: string
}

interface LeaveBalance {
  uid: string
  month: string
  allocated: number
  taken: number
  remaining: number
  carryForward?: number
}

export function LeaveRequestForm() {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [leaveDate, setLeaveDate] = useState('')
  const [reason, setReason] = useState('')
  const [leaveType, setLeaveType] = useState('personal')
  const [loading, setLoading] = useState(false)
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loadingBalance, setLoadingBalance] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        await loadLeaveData(user.uid)
      }
    })

    return () => unsubscribe()
  }, [])

  const loadLeaveData = async (uid: string) => {
    try {
      setLoadingBalance(true)
      const currentMonth = new Date().toISOString().substring(0, 7)
      const balance = await fetchLeaveBalance(uid, currentMonth)
      setLeaveBalance(balance)

      const requests = await fetchLeaveRequests(uid)
      setLeaveRequests(requests)
    } catch (error) {
      console.error('Error loading leave data:', error)
      toast({
        title: "Error",
        description: "Failed to load leave data",
        variant: "destructive"
      })
    } finally {
      setLoadingBalance(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !leaveDate || !reason.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (!leaveBalance || leaveBalance.remaining <= 0) {
      toast({
        title: "Error",
        description: "No leave balance remaining for this month",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      await addLeaveRequest(user.uid, leaveDate, reason)
      
      toast({
        title: "Success",
        description: "Leave request submitted successfully",
      })

      // Reset form and reload data
      setLeaveDate('')
      setReason('')
      setLeaveType('personal')
      await loadLeaveData(user.uid)
    } catch (error) {
      console.error('Error submitting leave request:', error)
      toast({
        title: "Error",
        description: "Failed to submit leave request",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'Rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'Pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!user) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">Please log in to submit leave requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Leave Balance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBalance ? (
            <div className="flex items-center justify-center p-4">
              <p className="text-muted-foreground">Loading leave balance...</p>
            </div>
          ) : leaveBalance ? (
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
          ) : (
            <p className="text-muted-foreground">No leave balance data available</p>
          )}
        </CardContent>
      </Card>

      {/* Submit Leave Request */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Submit Leave Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="leaveDate">Leave Date *</Label>
                <Input
                  id="leaveDate"
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="emergency">Emergency Leave</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a detailed reason for your leave request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>

            {leaveBalance && leaveBalance.remaining <= 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-700">
                  No leave balance remaining for this month. Please contact HR for assistance.
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !leaveDate || !reason.trim() || (leaveBalance && leaveBalance.remaining <= 0)}
              className="w-full"
            >
              {loading ? 'Submitting...' : 'Submit Leave Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Leave Request History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Leave Request History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? (
            <p className="text-muted-foreground text-center p-4">No leave requests found</p>
          ) : (
            <div className="space-y-3">
              {leaveRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{formatDate(request.date)}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {request.createdAt?.toDate ? 
                      request.createdAt.toDate().toLocaleDateString() : 
                      'Date unavailable'
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
