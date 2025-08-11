/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

interface DistanceCheckResult {
    distanceM: number
    withinGeofence: boolean
    officeName: string
}

// Office locations
const OFFICE_LOCATIONS = {
    'office-1': {
        lat: 22.997473,
        lon: 72.498009,
        name: 'Office 1'
    },
    'office-2': {
        lat: 23.008349,
        lon: 72.506866,
        name: 'Office 2'
    }
}

/**
 * Check if user location is within allowed geofence for any office
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param allowedM Allowed radius in meters (default: 500)
 * @returns Object with distance, whether user is within geofence, and office name
 */
export function checkDistance(
    userLat: number,
    userLon: number,
    allowedM: number = 500
): DistanceCheckResult {
    let closestDistance = Infinity
    let closestOffice = ''
    let closestOfficeName = ''

    // Check distance to all offices
    for (const [officeKey, office] of Object.entries(OFFICE_LOCATIONS)) {
        const distanceM = haversineDistance(userLat, userLon, office.lat, office.lon)
        
        if (distanceM < closestDistance) {
            closestDistance = distanceM
            closestOffice = officeKey
            closestOfficeName = office.name
        }
    }

    const withinGeofence = closestDistance <= allowedM

    return {
        distanceM: Math.round(closestDistance * 100) / 100, // Round to 2 decimal places
        withinGeofence,
        officeName: closestOfficeName
    }
}

/**
 * Check distance to a specific office
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param officeKey Office key ('office-1' or 'office-2')
 * @param allowedM Allowed radius in meters (default: 500)
 * @returns Object with distance, whether user is within geofence, and office name
 */
export function checkDistanceToOffice(
    userLat: number,
    userLon: number,
    officeKey: 'office-1' | 'office-2',
    allowedM: number = 500
): DistanceCheckResult {
    const office = OFFICE_LOCATIONS[officeKey]
    if (!office) {
        throw new Error(`Invalid office key: ${officeKey}`)
    }

    const distanceM = haversineDistance(userLat, userLon, office.lat, office.lon)
    const withinGeofence = distanceM <= allowedM

    return {
        distanceM: Math.round(distanceM * 100) / 100, // Round to 2 decimal places
        withinGeofence,
        officeName: office.name
    }
}