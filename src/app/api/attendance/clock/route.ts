
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getSessionAndUserRole } from '@/lib/auth';
import { collection, getDocs, query, where, addDoc, updateDoc, Timestamp, doc, orderBy, limit } from 'firebase/firestore';

// Define the structure for an office location document
interface OfficeLocation {
    id: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    whitelistedIps: string[];
}

/**
 * Calculates the distance between two geo-coordinates in meters using the Haversine formula.
 */
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
}


export async function POST(req: NextRequest) {
    // 1. User Authentication & Authorization
    // In a real app, get user from a verified session token
    const requestingUserId = req.headers.get('X-User-Id');
    if (!requestingUserId) {
        return NextResponse.json({ message: 'Authentication failed: User ID is missing.' }, { status: 401 });
    }
    
    // 2. Receive and Validate Request Body
    const body = await req.json();
    const { userId, eventType, latitude, longitude, deviceId, photoBase64, overtimeReason } = body;

    if (!userId || !eventType || latitude === undefined || longitude === undefined || !deviceId) {
        return NextResponse.json({ message: 'Missing required fields in request body.' }, { status: 400 });
    }

    if (userId !== requestingUserId) {
        return NextResponse.json({ message: 'Forbidden: You can only record attendance for yourself.' }, { status: 403 });
    }

    // 3. Retrieve Active Office Locations
    const officeLocationsQuery = query(collection(db, 'officeLocations'), where('isActive', '==', true));
    const officeSnapshot = await getDocs(officeLocationsQuery);
    const activeOffices: OfficeLocation[] = officeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfficeLocation));

    if (activeOffices.length === 0) {
        return NextResponse.json({ message: 'No active office locations are configured.' }, { status: 500 });
    }
    
    // 4. Perform Verification Checks
    const clientIp = req.headers.get('x-forwarded-for') ?? req.ip ?? '127.0.0.1';
    let isLocationVerified = false;
    let isIpVerified = false;
    let verificationStatus = 'Pending Review';
    let verificationDetails = [];

    for (const office of activeOffices) {
        const distance = getDistanceInMeters(latitude, longitude, office.latitude, office.longitude);
        if (distance <= office.radiusMeters) {
            isLocationVerified = true;
            // Only check IP if location is valid for that office
            if (office.whitelistedIps.length === 0 || office.whitelistedIps.includes(clientIp)) {
                isIpVerified = true;
            }
            break; // Stop checking once a valid office is found
        }
    }

    if (!isLocationVerified) {
        verificationStatus = 'Location Mismatch';
        verificationDetails.push(`Clock-in location is outside the allowed radius for all active offices.`);
    } else if (!isIpVerified) {
        verificationStatus = 'IP Mismatch';
        verificationDetails.push(`IP address ${clientIp} is not whitelisted for the in-range office.`);
    } else {
        verificationStatus = 'Verified';
    }
    
    // If any verification failed, we could stop here, but for this example, we'll record it and flag it.
    if (verificationStatus !== 'Verified') {
         // Optionally, you could reject the request entirely here
         // return NextResponse.json({ message: verificationStatus, details: verificationDetails.join(' ') }, { status: 403 });
    }
    
    // 5. Photo Capture & Storage (Simulated)
    let photoUrl = null;
    if (photoBase64) {
        // In a real app, you would upload the base64 data to Firebase Storage and get the URL.
        // For simulation:
        console.log(`[Simulating] Uploading photo for user ${userId}...`);
        photoUrl = `https://placehold.co/200x200.png`; // Placeholder URL
    }

    // 6. Record/Update Attendance
    try {
        const today = new Date().toISOString().split('T')[0];
        
        if (eventType === 'clockIn') {
            const newRecord = {
                userId,
                date: today,
                clockInTime: Timestamp.now(),
                clockInLocation: { latitude, longitude, ipAddress: clientIp },
                clockInPhotoUrl: photoUrl,
                clockInDeviceId: deviceId,
                clockOutTime: null,
                clockOutLocation: null,
                clockOutPhotoUrl: null,
                clockOutDeviceId: null,
                totalHours: null,
                regularHours: null,
                potentialOvertimeHours: null,
                approvedOvertimeHours: 0,
                status: 'Present',
                approvedByUserId: null,
                approvedAt: null,
                verificationStatus,
                verificationDetails: verificationDetails.join(' '),
                overtimeApprovalStatus: 'N/A',
                overtimeApprovedByUserId: null,
                overtimeApprovedAt: null,
                overtimeReason: null,
                adminComment: null,
            };
            const docRef = await addDoc(collection(db, 'attendanceRecords'), newRecord);
            return NextResponse.json({ message: 'Clock-in successful', id: docRef.id, verificationStatus }, { status: 201 });
        } else if (eventType === 'clockOut') {
            const q = query(
                collection(db, 'attendanceRecords'),
                where('userId', '==', userId),
                where('date', '==', today),
                where('clockOutTime', '==', null),
                orderBy('clockInTime', 'desc'),
                limit(1)
            );
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                return NextResponse.json({ message: 'Cannot clock out: No open clock-in record found for today.' }, { status: 400 });
            }

            const recordDoc = snapshot.docs[0];
            const clockInTime = (recordDoc.data().clockInTime as Timestamp).toDate();
            const clockOutTime = new Date();
            const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

            const standardWorkHours = 8;
            let regularHours = totalHours;
            let potentialOvertimeHours = 0;
            let overtimeApprovalStatus: 'N/A' | 'Pending' = 'N/A';

            if (totalHours > standardWorkHours) {
                regularHours = standardWorkHours;
                potentialOvertimeHours = totalHours - standardWorkHours;
                overtimeApprovalStatus = 'Pending';
            }

            await updateDoc(doc(db, 'attendanceRecords', recordDoc.id), {
                clockOutTime: Timestamp.fromDate(clockOutTime),
                clockOutLocation: { latitude, longitude, ipAddress: clientIp },
                clockOutPhotoUrl: photoUrl,
                clockOutDeviceId: deviceId,
                totalHours: totalHours,
                regularHours: regularHours,
                potentialOvertimeHours: potentialOvertimeHours,
                overtimeApprovalStatus: overtimeApprovalStatus,
                overtimeReason: overtimeReason || null,
                // Update verification status if clock-out is also problematic
                // For simplicity, we assume clock-out verification passes if clock-in did.
            });
             return NextResponse.json({ message: 'Clock-out successful', verificationStatus }, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Invalid event type.' }, { status: 400 });
        }
    } catch (error) {
        console.error("Error processing attendance:", error);
        return NextResponse.json({ message: 'Internal Server Error while recording attendance.' }, { status: 500 });
    }
}
