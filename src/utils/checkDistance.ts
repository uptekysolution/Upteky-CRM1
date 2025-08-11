/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
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
    distanceKm: number
    withinGeofence: boolean
}

/**
 * Check if user location is within allowed geofence
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param officeLat Office latitude (default: 22.997473)
 * @param officeLon Office longitude (default: 72.498009)
 * @param allowedKm Allowed radius in kilometers (default: 1)
 * @returns Object with distance and whether user is within geofence
 */
export function checkDistance(
    userLat: number,
    userLon: number,
    officeLat: number = 22.997473,
    officeLon: number = 72.498009,
    allowedKm: number = 1
): DistanceCheckResult {
    const distanceKm = haversineDistance(userLat, userLon, officeLat, officeLon)
    const withinGeofence = distanceKm <= allowedKm

    return {
        distanceKm: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
        withinGeofence
    }
}