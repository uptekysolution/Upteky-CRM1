import { db } from './firebase'
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    updateDoc,
    doc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore'

interface Location {
    latitude: number
    longitude: number
    accuracy?: number
}

interface CheckInParams {
    uid: string
    role: string
    location: Location
    withinGeofence: boolean
    reason?: string
    teamId?: string
}

interface CheckOutParams {
    location: Location
    withinGeofence: boolean
    reason?: string
}

/**
 * Check in a user for attendance
 */
export async function checkIn({
    uid,
    role,
    location,
    withinGeofence,
    reason,
    teamId
}: CheckInParams): Promise<string> {
    try {
        const attendanceData = {
            uid,
            role,
            teamId: teamId || null,
            checkIn: serverTimestamp(),
            checkOut: null,
            checkInLocation: location,
            checkOutLocation: null,
            withinGeofence,
            reason: withinGeofence ? null : reason || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }

        const docRef = await addDoc(collection(db, 'attendance'), attendanceData)
        return docRef.id
    } catch (error) {
        console.error('Error checking in:', error)
        throw new Error('Failed to check in')
    }
}

/**
 * Check out a user from attendance
 */
export async function checkOut(uid: string, {
    location,
    withinGeofence,
    reason
}: CheckOutParams): Promise<void> {
    try {
        // Find the most recent attendance record for this user that hasn't been checked out
        const q = query(
            collection(db, 'attendance'),
            where('uid', '==', uid),
            where('checkOut', '==', null),
            orderBy('checkIn', 'desc'),
            limit(1)
        )

        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
            throw new Error('No active attendance record found')
        }

        const attendanceDoc = querySnapshot.docs[0]
        const attendanceData = attendanceDoc.data()

        // Update the attendance record
        const updateData: any = {
            checkOut: serverTimestamp(),
            checkOutLocation: location,
            updatedAt: serverTimestamp()
        }

        // Only update reason if user was outside geofence during check-out
        if (!withinGeofence) {
            updateData.checkOutReason = reason || null
        }

        await updateDoc(doc(db, 'attendance', attendanceDoc.id), updateData)
    } catch (error) {
        console.error('Error checking out:', error)
        throw new Error('Failed to check out')
    }
}

/**
 * Get user's current attendance status
 */
export async function getCurrentAttendance(uid: string): Promise<{
    isCheckedIn: boolean
    checkInTime?: Timestamp
    attendanceId?: string
} | null> {
    try {
        const q = query(
            collection(db, 'attendance'),
            where('uid', '==', uid),
            where('checkOut', '==', null),
            orderBy('checkIn', 'desc'),
            limit(1)
        )

        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
            return { isCheckedIn: false }
        }

        const doc = querySnapshot.docs[0]
        const data = doc.data()

        return {
            isCheckedIn: true,
            checkInTime: data.checkIn,
            attendanceId: doc.id
        }
    } catch (error) {
        console.error('Error getting current attendance:', error)
        return null
    }
}