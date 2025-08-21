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
import { getOfficeMap, getOffices } from '@/lib/office-service'

interface AttendanceRecord {
    id: string
    uid: string
    role: string
    teamId?: string
    officeId?: string | null
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
    const [filterOfficeId, setFilterOfficeId] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [usersData, setUsersData] = useState<Record<string, UserData>>({})
    const [officeMap, setOfficeMap] = useState<Record<string, { id: string; name: string }>>({})
    const [presentDaysMap, setPresentDaysMap] = useState<Record<string, number>>({})
    const [workingDays, setWorkingDays] = useState<number | null>(null)
    const [offices, setOffices] = useState<Array<{ id: string; name: string }>>([])

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

    // Load offices list for filters
    useEffect(() => {
        (async () => {
            try {
                const list = await getOffices()
                setOffices(list.map(o => ({ id: o.id, name: o.name })))
            } catch (e) {
                console.error('Failed to load offices', e)
            }
        })()
    }, [])

    // Subscribe to attendance records based on user role
    useEffect(() => {
        if (!user || !userData) return

        let q = query(collection(db, 'attendance'), orderBy('createdAt', 'desc'))

        // Apply role-based filtering
        if (userData.role === 'Admin' || userData.role === 'Sub-Admin') {
            // Admin/Sub-Admin can see all records
        } else if (userData.role === 'HR') {
            q = query(
                collection(db, 'attendance'),
                where('role', 'in', ['Employee', 'HR', 'Team Lead', 'Business Development']),
                orderBy('createdAt', 'desc')
            )
        } else if (userData.role === 'Team Lead') {
            if (userData.teamId) {
                q = query(
                    collection(db, 'attendance'),
                    where('teamId', '==', userData.teamId),
                    orderBy('createdAt', 'desc')
                )
            } else {
                q = query(
                    collection(db, 'attendance'),
                    where('uid', '==', user.uid),
                    orderBy('createdAt', 'desc')
                )
            }
        } else {
            q = query(
                collection(db, 'attendance'),
                where('uid', '==', user.uid),
                orderBy('createdAt', 'desc')
            )
        }

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const records: AttendanceRecord[] = []
            const userIds = new Set<string>()
            const officeIds = new Set<string>()

            snapshot.forEach((doc) => {
                const data = doc.data() as AttendanceRecord
                if (data && data.uid) {
                    records.push({ ...data, id: doc.id })
                    userIds.add(data.uid)
                    if ((data as any).officeId) officeIds.add((data as any).officeId as string)
                }
            })

            // Fetch user data for all records
            const usersDataMap: Record<string, UserData> = {}
            for (const uid of userIds) {
                if (!uid) continue
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
                    } else {
                        usersDataMap[uid] = { role: 'Employee', name: 'Unknown', email: '' }
                    }
                } catch (error) {
                    console.error('Error fetching user data for', uid, error)
                    usersDataMap[uid] = { role: 'Employee', name: 'Unknown', email: '' }
                }
            }

            setUsersData(usersDataMap)
            if (officeIds.size > 0) {
                try {
                    const map = await getOfficeMap(Array.from(officeIds))
                    setOfficeMap(map)
                } catch (e) {
                    console.error('Failed to load offices', e)
                }
            }
            setAttendanceRecords(records)
            setLoading(false)
        }, (error) => {
            console.error('Error listening to attendance records:', error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [user, userData])

    // Fetch monthly summaries for visible users (admin views)
    useEffect(() => {
        const run = async () => {
            if (!user || !userData) return
            try {
                const currentMonth = new Date().getMonth() + 1
                const currentYear = new Date().getFullYear()
                // Working days once
                try {
                    const wdRes = await fetch(`/api/calendar/working-days/${currentMonth}?year=${currentYear}`)
                    if (wdRes.ok) {
                        const data = await wdRes.json()
                        setWorkingDays(data.totalWorkingDays)
                    }
                } catch {}
                // Summaries per user for admins/HR, else just self
                const targetIds = (userData.role === 'Admin' || userData.role === 'Sub-Admin' || userData.role === 'HR')
                  ? Array.from(new Set(attendanceRecords.map(r => r.uid).filter(Boolean)))
                  : [user.uid]
                const token = await user.getIdToken()
                const map: Record<string, number> = {}
                await Promise.all(targetIds.map(async (uid) => {
                    try {
                        const res = await fetch(`/api/attendance/${uid}/${currentMonth}/summary?year=${currentYear}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        })
                        if (res.ok) {
                            const s = await res.json()
                            map[uid] = s.presentDays
                        }
                    } catch {}
                }))
                setPresentDaysMap(map)
            } catch (e) {
                // ignore
            }
        }
        run()
    }, [user, userData, attendanceRecords])

    // Filter records based on search, role and office filter
    const filteredRecords = attendanceRecords.filter((record) => {
        if (!record || !record.uid) return false

        const userName = usersData[record.uid]?.name || 'Unknown'
        const userEmail = usersData[record.uid]?.email || ''
        const safeSearchTerm = searchTerm.trim().toLowerCase()

        const matchesSearch = safeSearchTerm === '' ||
            (userName && userName.toLowerCase().includes(safeSearchTerm)) ||
            (userEmail && userEmail.toLowerCase().includes(safeSearchTerm)) ||
            (record.uid && record.uid.toLowerCase().includes(safeSearchTerm)) ||
            (record.role && record.role.toLowerCase().includes(safeSearchTerm)) ||
            (userName && userName.toLowerCase().split(' ').some(part => part.includes(safeSearchTerm))) ||
            (userName === 'Unknown' && record.uid && record.uid.toLowerCase().includes(safeSearchTerm))

        const matchesRole = filterRole === 'all' || record.role === filterRole
        const matchesOffice = filterOfficeId === 'all' || (record.officeId || '') === filterOfficeId

        return matchesSearch && matchesRole && matchesOffice
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
            if (!checkIn.toDate || !checkOut.toDate) {
                return 'Invalid'
            }

            const checkInDate = checkIn.toDate()
            const checkOutDate = checkOut.toDate()
            if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
                return 'Invalid'
            }

            const duration = checkOutDate.getTime() - checkInDate.getTime()
            if (duration < 0) return 'Invalid'

            const hours = Math.floor(duration / (1000 * 60 * 60))
            const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
            if (duration < 60000) {
                const seconds = Math.floor(duration / 1000)
                return `${seconds}s`
            }

            return `${hours}h ${minutes}m`
        } catch (error) {
            try {
                const checkInSeconds = (checkIn as any).seconds
                const checkOutSeconds = (checkOut as any).seconds
                const durationSeconds = checkOutSeconds - checkInSeconds
                if (durationSeconds < 0) return 'Invalid'
                const hours = Math.floor(durationSeconds / 3600)
                const minutes = Math.floor((durationSeconds % 3600) / 60)
                if (durationSeconds < 60) return `${durationSeconds}s`
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
                <div className="flex flex-col gap-3 mb-4 md:flex-row">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by name, email, or user ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger className="w-full md:w-48">
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
                    <Select value={filterOfficeId} onValueChange={setFilterOfficeId}>
                        <SelectTrigger className="w-full md:w-56">
                            <SelectValue placeholder="Filter by office" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Offices</SelectItem>
                            {offices.map((o) => (
                                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                            ))}
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
                                <TableHead className="text-center">Present Days</TableHead>
                                <TableHead>Check In</TableHead>
                                <TableHead>Check Out</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Office</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                                            <TableCell className="text-center">
                                                {presentDaysMap[record.uid] ?? '-'}{workingDays !== null ? `/${workingDays}` : ''}
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
                                                {record.officeId && officeMap[record.officeId] ? (
                                                    <Badge variant="outline">{officeMap[record.officeId].name}</Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
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