'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useGeolocation } from '@/hooks/useGeolocation'
import { checkDistance } from '@/utils/checkDistance'
import { checkIn, checkOut, getCurrentAttendance } from '@/lib/attendance'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MapPin, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface UserData {
    role: string
    teamId?: string
}

export function CheckInOut() {
    const { toast } = useToast()
    const { lat, lon, loading: locationLoading, error: locationError, refresh: refreshLocation } = useGeolocation()
    const [user, setUser] = useState<User | null>(null)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [isCheckedIn, setIsCheckedIn] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showReasonModal, setShowReasonModal] = useState(false)
    const [reason, setReason] = useState('')
    const [actionType, setActionType] = useState<'checkIn' | 'checkOut'>('checkIn')
    const [distanceInfo, setDistanceInfo] = useState<{ distanceKm: number; withinGeofence: boolean } | null>(null)

    // Get current user and their data
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user)
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid))
                    if (userDoc.exists()) {
                        const data = userDoc.data()
                        setUserData({
                            role: data.role || 'Employee',
                            teamId: data.teamId || null
                        })
                    } else {
                        setUserData({ role: 'Employee' })
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error)
                    setUserData({ role: 'Employee' })
                }
            }
        })

        return () => unsubscribe()
    }, [])

    // Check current attendance status
    useEffect(() => {
        if (user) {
            checkCurrentAttendance()
        }
    }, [user])

    const checkCurrentAttendance = async () => {
        if (!user) return

        try {
            const attendance = await getCurrentAttendance(user.uid)
            setIsCheckedIn(attendance?.isCheckedIn || false)
        } catch (error) {
            console.error('Error checking attendance status:', error)
        }
    }

    const handleAction = async (type: 'checkIn' | 'checkOut') => {
        if (!user || !userData || !lat || !lon) {
            toast({
                title: "Error",
                description: "Please ensure you're logged in and location is available",
                variant: "destructive"
            })
            return
        }

        setActionType(type)
        setLoading(true)

        try {
            // Check distance from office
            const distance = checkDistance(lat, lon)
            setDistanceInfo(distance)

            if (distance.withinGeofence) {
                // Within geofence - proceed immediately
                await performAction(type, distance, null)
            } else {
                // Outside geofence - show reason modal
                setShowReasonModal(true)
                setLoading(false)
                return
            }
        } catch (error) {
            console.error('Error performing action:', error)
            toast({
                title: "Error",
                description: "Failed to perform action. Please try again.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const performAction = async (type: 'checkIn' | 'checkOut', distance: { distanceKm: number; withinGeofence: boolean }, reason: string | null) => {
        if (!user || !userData || !lat || !lon) return

        try {
            const location = { latitude: lat, longitude: lon }

            if (type === 'checkIn') {
                await checkIn({
                    uid: user.uid,
                    role: userData.role,
                    location,
                    withinGeofence: distance.withinGeofence,
                    reason: reason || undefined,
                    teamId: userData.teamId || undefined
                })

                toast({
                    title: "Success",
                    description: `Checked in successfully${!distance.withinGeofence ? ' (outside office)' : ''}`,
                })
                setIsCheckedIn(true)
            } else {
                await checkOut(user.uid, {
                    location,
                    withinGeofence: distance.withinGeofence,
                    reason: reason || undefined
                })

                toast({
                    title: "Success",
                    description: `Checked out successfully${!distance.withinGeofence ? ' (outside office)' : ''}`,
                })
                setIsCheckedIn(false)
            }

            setShowReasonModal(false)
            setReason('')
            setDistanceInfo(null)
        } catch (error) {
            console.error('Error performing action:', error)
            toast({
                title: "Error",
                description: "Failed to perform action. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleReasonSubmit = () => {
        if (!reason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a reason for being outside the office",
                variant: "destructive"
            })
            return
        }

        setLoading(true)
        performAction(actionType, distanceInfo!, reason.trim())
    }

    if (!user) {
        return (
            <div className="text-center p-4">
                <p className="text-muted-foreground">Please log in to use attendance</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Location Status */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <MapPin className="h-4 w-4" />
                <div className="flex-1">
                    {locationLoading ? (
                        <p className="text-sm">Getting location...</p>
                    ) : locationError ? (
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <p className="text-sm text-destructive">{locationError}</p>
                            <Button variant="outline" size="sm" onClick={refreshLocation}>
                                Retry
                            </Button>
                        </div>
                    ) : lat && lon ? (
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <p className="text-sm">Location available</p>
                            {distanceInfo && (
                                <Badge variant={distanceInfo.withinGeofence ? "default" : "destructive"}>
                                    {distanceInfo.distanceKm}km from office
                                </Badge>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Location not available</p>
                    )}
                </div>
            </div>

            {/* Current Status */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Clock className="h-4 w-4" />
                <div className="flex-1">
                    <p className="text-sm font-medium">
                        Status: {isCheckedIn ? 'Checked In' : 'Not Checked In'}
                    </p>
                </div>
                <Badge variant={isCheckedIn ? "default" : "secondary"}>
                    {isCheckedIn ? 'Active' : 'Inactive'}
                </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button
                    onClick={() => handleAction('checkIn')}
                    disabled={loading || locationLoading || !!locationError || isCheckedIn || !lat || !lon}
                    className="flex-1"
                >
                    {loading && actionType === 'checkIn' ? 'Checking In...' : 'Check In'}
                </Button>

                <Button
                    onClick={() => handleAction('checkOut')}
                    disabled={loading || locationLoading || !!locationError || !isCheckedIn || !lat || !lon}
                    variant="outline"
                    className="flex-1"
                >
                    {loading && actionType === 'checkOut' ? 'Checking Out...' : 'Check Out'}
                </Button>
            </div>

            {/* Reason Modal */}
            <Dialog open={showReasonModal} onOpenChange={setShowReasonModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Outside Office Location</DialogTitle>
                        <DialogDescription>
                            You are {distanceInfo?.distanceKm}km from the office. Please provide a reason for being outside the office.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reason">Reason</Label>
                            <Textarea
                                id="reason"
                                placeholder="Please explain why you're working outside the office..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowReasonModal(false)
                                    setReason('')
                                    setDistanceInfo(null)
                                    setLoading(false)
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleReasonSubmit}
                                disabled={loading || !reason.trim()}
                            >
                                {loading ? 'Processing...' : 'Submit'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}