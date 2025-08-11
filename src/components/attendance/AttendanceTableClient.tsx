'use client'

import React, { useState, useEffect } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { MapPin, Clock, User as UserIcon, Building } from 'lucide-react'

interface AttendanceRecord {
    id: string
    uid: string
    role: string
    teamId?: string
    checkIn: Timestamp
    checkOut?: Timestamp
    checkInLocation: {
        latitude: number
        longitude: number
        accuracy?: number
    }
    checkOutLocation?: {
        latitude: number
        longitude: number
        accuracy?: number
    }
    withinGeofence: boolean
    reason?: string
    checkOutReason?: string
    createdAt: Timestamp
    updatedAt: Timestamp
    userName?: string // Will be populated from users collection
}

interface UserData {
    role: string
    teamId?: string
    name?: string
    email?: string
}

export function AttendanceTableClient() {
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<User | null>(null)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [filterRole, setFilterRole] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [usersData, setUsersData] = useState<Record<string, UserData>>({})

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
                            teamId: data.teamId || null,
                            name: data.name || data.email || 'Unknown',
                            email: data.email || ''
                        })
                    } else {
                        setUserData({ role: 'Employee', name: 'Unknown', email: user.email || '' })
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error)
                    setUserData({ role: 'Employee', name: 'Unknown', email: user.email || '' })
                }
            }
        })

        return () => unsubscribe()
    }, [])

    // Subscribe to attendance records based on user role
    useEffect(() => {
        if (!user || !userData) return

        let q = query(collection(db, 'attendance'), orderBy('createdAt', 'desc'))

        // Apply role-based filtering
        if (userData.role === 'Admin' || userData.role === 'Sub-Admin') {
            // Admin/Sub-Admin can see all records
        } else if (userData.role === 'HR') {
            // HR can see all except Admin/Sub-Admin
            q = query(
                collection(db, 'attendance'),
                where('role', 'in', ['Employee', 'HR', 'Team Lead', 'Business Development']),
                orderBy('createdAt', 'desc')
            )
        } else if (userData.role === 'Team Lead') {
            // Team Lead can see their team members
            if (userData.teamId) {
                q = query(
                    collection(db, 'attendance'),
                    where('teamId', '==', userData.teamId),
                    orderBy('createdAt', 'desc')
                )
            } else {
                // If no team, only show own records
                q = query(
                    collection(db, 'attendance'),
                    where('uid', '==', user.uid),
                    orderBy('createdAt', 'desc')
                )
            }
        } else {
            // Employee can only see own records
            q = query(
                collection(db, 'attendance'),
                where('uid', '==', user.uid),
                orderBy('createdAt', 'desc')
            )
        }

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const records: AttendanceRecord[] = []
            const userIds = new Set<string>()

            snapshot.forEach((doc) => {
                const data = doc.data() as AttendanceRecord
                if (data && data.uid) {
                    records.push({ ...data, id: doc.id })
                    userIds.add(data.uid)
                }
            })

            // Fetch user data for all records
            const usersDataMap: Record<string, UserData> = {}
            for (const uid of userIds) {
                if (!uid) continue // Skip if uid is undefined or null

                try {
                    const userDoc = await getDoc(doc(db, 'users', uid))
                    if (userDoc.exists()) {
                        const userData = userDoc.data()
                        usersDataMap[uid] = {
                            role: userData?.role || 'Employee',
                            teamId: userData?.teamId || null,
                            name: userData?.name || userData?.email || 'Unknown',
                            email: userData?.email || ''
                        }
                        
                        // Debug logging for user data
                        if (process.env.NODE_ENV === 'development') {
                            console.log('User data for', uid, ':', {
                                name: userData?.name,
                                email: userData?.email,
                                role: userData?.role,
                                fullUserData: userData
                            })
                        }
                    } else {
                        // Set default data if user document doesn't exist
                        usersDataMap[uid] = { role: 'Employee', name: 'Unknown', email: '' }
                        if (process.env.NODE_ENV === 'development') {
                            console.log('No user document found for', uid)
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user data for', uid, error)
                    usersDataMap[uid] = { role: 'Employee', name: 'Unknown', email: '' }
                }
            }

            setUsersData(usersDataMap)
            setAttendanceRecords(records)
            setLoading(false)
        }, (error) => {
            console.error('Error listening to attendance records:', error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [user, userData])

    // Filter records based on search and role filter
    const filteredRecords = attendanceRecords.filter((record) => {
        if (!record || !record.uid) return false // Skip records without uid

        const userName = usersData[record.uid]?.name || 'Unknown'
        const userEmail = usersData[record.uid]?.email || ''

        const safeSearchTerm = searchTerm.trim().toLowerCase()
        
        // If no search term, show all records
        if (safeSearchTerm === '') {
            const matchesRole = filterRole === 'all' || record.role === filterRole
            return matchesRole
        }

        // Check if search term matches any of the searchable fields
        const matchesSearch = 
            (userName && userName.toLowerCase().includes(safeSearchTerm)) ||
            (userEmail && userEmail.toLowerCase().includes(safeSearchTerm)) ||
            (record.uid && record.uid.toLowerCase().includes(safeSearchTerm)) ||
            (record.role && record.role.toLowerCase().includes(safeSearchTerm)) ||
            // Check if search term matches any part of the name (for partial name searches)
            (userName && userName.toLowerCase().split(' ').some(part => part.includes(safeSearchTerm))) ||
            // Fallback: if user data is not available, try to match by uid directly
            (userName === 'Unknown' && record.uid && record.uid.toLowerCase().includes(safeSearchTerm))

        const matchesRole = filterRole === 'all' || record.role === filterRole

        // Debug logging for search
        if (process.env.NODE_ENV === 'development' && safeSearchTerm !== '') {
            console.log('Search debug for record:', {
                uid: record.uid,
                userName,
                userEmail,
                role: record.role,
                searchTerm: safeSearchTerm,
                matchesSearch,
                matchesRole
            })
        }

        return matchesSearch && matchesRole
    })

    const formatTime = (timestamp: Timestamp) => {
        if (!timestamp) return 'N/A'
        try {
            return timestamp.toDate().toLocaleString()
        } catch (error) {
            console.error('Error formatting timestamp:', error)
            return 'N/A'
        }
    }

    const formatDuration = (checkIn: Timestamp, checkOut?: Timestamp) => {
        if (!checkOut) return 'Active'
        if (!checkIn) return 'N/A'

        try {
            // Validate timestamps
            if (!checkIn.toDate || !checkOut.toDate) {
                return 'Invalid'
            }

            const checkInDate = checkIn.toDate()
            const checkOutDate = checkOut.toDate()
            
            // Check if dates are valid
            if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
                return 'Invalid'
            }

            const checkInTime = checkInDate.getTime()
            const checkOutTime = checkOutDate.getTime()
            const duration = checkOutTime - checkInTime
            
            // Handle negative duration (check-out before check-in)
            if (duration < 0) {
                return 'Invalid'
            }
            

            
            const hours = Math.floor(duration / (1000 * 60 * 60))
            const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))

            // Handle very short durations (less than 1 minute)
            if (duration < 60000) { // Less than 1 minute
                const seconds = Math.floor(duration / 1000)
                return `${seconds}s`
            }

            return `${hours}h ${minutes}m`
        } catch (error) {
            // Fallback calculation using seconds since epoch
            try {
                const checkInSeconds = checkIn.seconds
                const checkOutSeconds = checkOut.seconds
                const durationSeconds = checkOutSeconds - checkInSeconds
                
                if (durationSeconds < 0) return 'Invalid'
                
                const hours = Math.floor(durationSeconds / 3600)
                const minutes = Math.floor((durationSeconds % 3600) / 60)
                
                if (durationSeconds < 60) {
                    return `${durationSeconds}s`
                }
                
                return `${hours}h ${minutes}m`
            } catch (fallbackError) {
                return 'N/A'
            }
        }
    }

    if (!user) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">Please log in to view attendance records</p>
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">Loading attendance records...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Attendance Records
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by name, email, or user ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Sub-Admin">Sub-Admin</SelectItem>
                            <SelectItem value="HR">HR</SelectItem>
                            <SelectItem value="Team Lead">Team Lead</SelectItem>
                            <SelectItem value="Employee">Employee</SelectItem>
                            <SelectItem value="Business Development">Business Development</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Check In</TableHead>
                                <TableHead>Check Out</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        No attendance records found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRecords.map((record) => {
                                    const userInfo = usersData[record.uid || '']
                                    return (
                                        <TableRow key={record.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="h-4 w-4" />
                                                    <div>
                                                        <p className="font-medium">{userInfo?.name || 'Unknown'}</p>
                                                        <p className="text-sm text-muted-foreground">{userInfo?.email || record.uid || 'Unknown'}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{record.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="text-sm">{formatTime(record.checkIn)}</p>
                                                    {record.reason && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Reason: {record.reason}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {record.checkOut ? (
                                                    <div>
                                                        <p className="text-sm">{formatTime(record.checkOut)}</p>
                                                        {record.checkOutReason && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Reason: {record.checkOutReason}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Badge variant="default">Active</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {record.checkOut ? formatDuration(record.checkIn, record.checkOut) : 'Active'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    <Badge variant={record.withinGeofence ? "default" : "destructive"}>
                                                        {record.withinGeofence ? 'Office' : 'Remote'}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={record.checkOut ? "secondary" : "default"}>
                                                    {record.checkOut ? 'Completed' : 'Active'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}