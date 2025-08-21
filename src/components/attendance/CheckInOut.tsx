'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useGeolocation } from '@/hooks/useGeolocation'
import { checkDistanceToCoords, testDistanceCalculation } from '@/utils/checkDistance'
import { checkIn, checkOut, getCurrentAttendance } from '@/lib/attendance'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MapPin, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { getOffices, Office } from '@/lib/office-service'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UserData {
    role: string
    teamId?: string
}

// Predefined offices that should always be available
const PREDEFINED_OFFICES: Office[] = [
    {
        id: 'siddhi-vinayak',
        name: 'Siddhi Vinayak Business Tower',
        latitude: 22.99401750936968, 
        longitude: 72.49933952072686,
        isActive: true
    },
    {
        id: 'matrix-corporate',
        name: 'Matrix Corporate Business Park',
        latitude: 23.008348, 
        longitude: 72.506866,
        isActive: true
    }
]

export function CheckInOut() {
    const { toast } = useToast()
    const { lat, lon, loading: locationLoading, error: locationError, accuracy, retryCount, refresh: refreshLocation, forceRefresh } = useGeolocation()
    const [user, setUser] = useState<User | null>(null)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [isCheckedIn, setIsCheckedIn] = useState(false)
    const [loading, setLoading] = useState(false)
    const [actionType, setActionType] = useState<'checkIn' | 'checkOut'>('checkIn')
    const [distanceInfo, setDistanceInfo] = useState<{ distanceM: number; withinGeofence: boolean; officeName: string } | null>(null)
    const [firebaseOffices, setFirebaseOffices] = useState<Office[]>([])
    const [selectedOfficeId, setSelectedOfficeId] = useState<string>('')
    const [showReasonModal, setShowReasonModal] = useState(false)
    const [reason, setReason] = useState('')
    const [pendingAction, setPendingAction] = useState<{ type: 'checkIn' | 'checkOut'; distance: any } | null>(null)

    // Combine predefined offices with Firebase offices
    const allOffices = React.useMemo(() => [...PREDEFINED_OFFICES, ...firebaseOffices], [firebaseOffices])

    // Test distance calculation on component mount
    useEffect(() => {
        testDistanceCalculation()
    }, [])

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

    // Load offices from Firebase
    useEffect(() => {
        (async () => {
            try {
                const list = await getOffices()
                setFirebaseOffices(list)
                // Set default selection to first predefined office if no office is selected
                if (!selectedOfficeId && PREDEFINED_OFFICES.length > 0) {
                    setSelectedOfficeId(PREDEFINED_OFFICES[0].id)
                }
            } catch (e) {
                console.error('Failed to load offices', e)
                // Set default selection to first predefined office even if Firebase fails
                if (!selectedOfficeId && PREDEFINED_OFFICES.length > 0) {
                    setSelectedOfficeId(PREDEFINED_OFFICES[0].id)
                }
            }
        })()
    }, []) // Remove selectedOfficeId from dependencies

    // Check distance when office is selected and location is available
    useEffect(() => {
        if (selectedOfficeId && lat && lon) {
            const office = allOffices.find(o => o.id === selectedOfficeId)
            if (office) {
                // Debug: Log current location and office details
                console.log('📍 Location check:', {
                    userLocation: { lat: lat.toFixed(8), lon: lon.toFixed(8) },
                    selectedOffice: {
                        id: office.id,
                        name: office.name,
                        latitude: office.latitude.toFixed(8),
                        longitude: office.longitude.toFixed(8)
                    }
                });
                
                const distance = checkDistanceToCoords(lat, lon, office.latitude, office.longitude, office.name, 50)
                console.log('📏 Distance result:', {
                    distanceM: distance.distanceM,
                    withinGeofence: distance.withinGeofence,
                    officeName: distance.officeName
                });
                setDistanceInfo(distance)
            }
        }
    }, [selectedOfficeId, lat, lon, allOffices])

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
        if (!user || !userData || !lat || !lon || !selectedOfficeId) {
            toast({
                title: "Error",
                description: "Please ensure you're logged in, selected an office, and location is available",
                variant: "destructive"
            })
            return
        }

        setActionType(type)
        setLoading(true)

        try {
            const office = allOffices.find(o => o.id === selectedOfficeId)
            if (!office) {
                throw new Error('Selected office not found')
            }
            const distance = checkDistanceToCoords(lat, lon, office.latitude, office.longitude, office.name, 50)
            setDistanceInfo(distance)

            if (!distance.withinGeofence) {
                // Show reason modal for out-of-range check-in/out
                setPendingAction({ type, distance })
                setShowReasonModal(true)
                setLoading(false)
                return
            }

            await performAction(type, distance)
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

    const handleReasonSubmit = async () => {
        if (!pendingAction || !reason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a reason for out-of-range check-in/out",
                variant: "destructive"
            })
            return
        }

        setLoading(true)
        try {
            await performAction(pendingAction.type, pendingAction.distance, reason)
            setShowReasonModal(false)
            setReason('')
            setPendingAction(null)
        } catch (error) {
            console.error('Error performing action with reason:', error)
            toast({
                title: "Error",
                description: "Failed to perform action. Please try again.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const performAction = async (type: 'checkIn' | 'checkOut', distance: { distanceM: number; withinGeofence: boolean; officeName: string }, reason?: string) => {
        if (!user || !userData || !lat || !lon || !selectedOfficeId) return

        try {
            const location = { latitude: lat, longitude: lon }

            if (type === 'checkIn') {
                await checkIn({
                    uid: user.uid,
                    role: userData.role,
                    location,
                    withinGeofence: distance.withinGeofence,
                    teamId: userData.teamId || undefined,
                    officeId: selectedOfficeId,
                    reason: reason || undefined
                })

                toast({
                    title: "Success",
                    description: `Checked in successfully at ${distance.officeName}${!distance.withinGeofence ? ' (out of range)' : ''}`,
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
                    description: `Checked out successfully from ${distance.officeName}${!distance.withinGeofence ? ' (out of range)' : ''}`,
                })
                setIsCheckedIn(false)
            }

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

    if (!user) {
        return (
            <div className="text-center p-4">
                <p className="text-muted-foreground">Please log in to use attendance</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Office Selection */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Label className="text-sm">Office</Label>
                <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
                    <SelectTrigger className="w-56">
                        <SelectValue placeholder="Select office" />
                    </SelectTrigger>
                    <SelectContent>
                        {/* Predefined offices section */}
                        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                            Main Offices
                        </div>
                        {PREDEFINED_OFFICES.map((office) => (
                            <SelectItem key={office.id} value={office.id}>
                                {office.name}
                            </SelectItem>
                        ))}
                        
                        {/* Firebase offices section (if any exist) */}
                        {firebaseOffices.length > 0 && (
                            <>
                                <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground mt-2">
                                    Additional Offices
                                </div>
                                {firebaseOffices.map((office) => (
                                    <SelectItem key={office.id} value={office.id}>
                                        {office.name}
                                    </SelectItem>
                                ))}
                            </>
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Distance Requirement Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-800">
                        <strong>Distance Requirement:</strong> Check-in/out is only allowed within 50 meters of the selected office location.
                    </p>
                </div>
            </div>

            {/* Location Status */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <MapPin className="h-4 w-4" />
                <div className="flex-1">
                    {locationLoading ? (
                        <div className="space-y-1">
                            <p className="text-sm">Getting location...</p>
                            {retryCount > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Retry attempt {retryCount}/3 - Ensuring high accuracy GPS
                                </p>
                            )}
                        </div>
                    ) : locationError ? (
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <div className="flex-1">
                                <p className="text-sm text-destructive">{locationError}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    For best accuracy: Use HTTPS, allow "Precise Location", and ensure clear sky view
                                </p>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" onClick={refreshLocation}>
                                    Retry
                                </Button>
                                <Button variant="outline" size="sm" onClick={forceRefresh}>
                                    Force Refresh
                                </Button>
                            </div>
                        </div>
                    ) : lat && lon ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <p className="text-sm">Location available</p>
                                {accuracy && (
                                    <Badge variant="secondary" className="text-xs">
                                        GPS Accuracy: {accuracy}m
                                    </Badge>
                                )}
                                {distanceInfo && (
                                    <div className="flex items-center gap-2">
                                        <Badge variant={distanceInfo.withinGeofence ? "default" : "destructive"}>
                                            {distanceInfo.distanceM < 1000 
                                                ? `${distanceInfo.distanceM}m` 
                                                : `${(distanceInfo.distanceM / 1000).toFixed(1)}km`
                                            } from {distanceInfo.officeName}
                                        </Badge>
                                        {distanceInfo.withinGeofence ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                ✓ Within 50m
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                                                ✗ Outside 50m
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                            {/* Debug info - remove in production */}
                            {lat && lon && (
                                <div className="text-xs text-muted-foreground">
                                    <p>Your location: {lat.toFixed(8)}, {lon.toFixed(8)}</p>
                                    {selectedOfficeId && (
                                        <p>Office location: {allOffices.find(o => o.id === selectedOfficeId)?.latitude.toFixed(8)}, {allOffices.find(o => o.id === selectedOfficeId)?.longitude.toFixed(8)}</p>
                                    )}
                                </div>
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
                    disabled={loading || locationLoading || !!locationError || isCheckedIn || !lat || !lon || !selectedOfficeId}
                    className="flex-1"
                >
                    {loading && actionType === 'checkIn' ? 'Checking In...' : 'Check In'}
                </Button>

                <Button
                    onClick={() => handleAction('checkOut')}
                    disabled={loading || locationLoading || !!locationError || !isCheckedIn || !lat || !lon || !selectedOfficeId}
                    variant="outline"
                    className="flex-1"
                >
                    {loading && actionType === 'checkOut' ? 'Checking Out...' : 'Check Out'}
                </Button>
            </div>

            {/* Reason Modal for Out-of-Range Check-in/Out */}
            <Dialog open={showReasonModal} onOpenChange={setShowReasonModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Out of Range Check-in/Out</DialogTitle>
                        <DialogDescription>
                            You are {pendingAction?.distance.distanceM < 1000 
                                ? `${pendingAction?.distance.distanceM}m` 
                                : `${(pendingAction?.distance.distanceM / 1000).toFixed(1)}km`
                            } from {pendingAction?.distance.officeName}. 
                            Please provide a reason for checking in/out outside the allowed 50m radius.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reason">Reason</Label>
                            <Textarea
                                id="reason"
                                placeholder="Please explain why you need to check in/out from outside the office..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="mt-2"
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowReasonModal(false)
                                    setReason('')
                                    setPendingAction(null)
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleReasonSubmit}
                                disabled={!reason.trim() || loading}
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