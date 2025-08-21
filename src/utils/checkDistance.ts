/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point (in degrees)
 * @param lon1 Longitude of first point (in degrees)
 * @param lat2 Latitude of second point (in degrees)
 * @param lon2 Longitude of second point (in degrees)
 * @returns Distance in meters
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Earth's radius in meters
    const R = 6371000;
    
    // Convert degrees to radians
    const lat1Rad = lat1 * Math.PI / 180;
    const lon1Rad = lon1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const lon2Rad = lon2 * Math.PI / 180;
    
    // Differences in coordinates
    const dLat = lat2Rad - lat1Rad;
    const dLon = lon2Rad - lon1Rad;
    
    // Haversine formula
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    // Distance in meters
    const distance = R * c;
    
    return distance;
}

/**
 * Test function to verify distance calculation
 */
export function testDistanceCalculation() {
    console.log('🧪 Testing distance calculation...');
    
    // Test 1: Same coordinates (should be ~0m)
    const test1 = calculateDistance(22.99401750936968, 72.49933952072686, 22.99401750936968, 72.49933952072686);
    console.log('Test 1 - Same coordinates:', {
        coordinates: { lat: 22.99401750936968, lon: 72.49933952072686 },
        distance: `${test1.toFixed(2)}m`,
        expected: '~0m'
    });
    
    // Test 2: Very close coordinates (should be small distance)
    const test2 = calculateDistance(22.99401750936968, 72.49933952072686, 22.99401750936968, 72.49933952072687);
    console.log('Test 2 - Very close coordinates:', {
        distance: `${test2.toFixed(2)}m`,
        expected: 'very small distance'
    });
    
    // Test 3: Distance between the two offices
    const test3 = calculateDistance(22.99401750936968, 72.49933952072686, 23.008348, 72.506866);
    console.log('Test 3 - Between offices:', {
        office1: { lat: 22.99401750936968, lon: 72.49933952072686 },
        office2: { lat: 23.008348, lon: 72.506866 },
        distance: `${test3.toFixed(2)}m (${(test3/1000).toFixed(2)}km)`
    });
    
    // Test 4: Known distance calculation (Mumbai to Delhi ~1150km)
    const test4 = calculateDistance(19.0760, 72.8777, 28.7041, 77.1025);
    console.log('Test 4 - Mumbai to Delhi:', {
        distance: `${test4.toFixed(0)}m (${(test4/1000).toFixed(0)}km)`,
        expected: '~1150km'
    });
    
    console.log('✅ Distance calculation tests completed');
}

/**
 * Check distance to coordinates and determine if within geofence
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param officeLat Office latitude
 * @param officeLon Office longitude
 * @param officeName Name of the office
 * @param thresholdM Distance threshold in meters
 * @returns Object with distance info and geofence status
 */
export function checkDistanceToCoords(
    userLat: number,
    userLon: number,
    officeLat: number,
    officeLon: number,
    officeName: string,
    thresholdM: number = 50
): { distanceM: number; withinGeofence: boolean; officeName: string } {
    // Validate input coordinates
    if (isNaN(userLat) || isNaN(userLon) || isNaN(officeLat) || isNaN(officeLon)) {
        console.error('Invalid coordinates provided:', { userLat, userLon, officeLat, officeLon });
        return {
            distanceM: 0,
            withinGeofence: false,
            officeName
        };
    }

    const distanceM = calculateDistance(userLat, userLon, officeLat, officeLon);
    const withinGeofence = distanceM <= thresholdM;

    // Debug logging
    console.log('Distance calculation:', {
        userLocation: { lat: userLat, lon: userLon },
        officeLocation: { lat: officeLat, lon: officeLon },
        officeName,
        calculatedDistanceM: distanceM,
        roundedDistanceM: Math.round(distanceM),
        withinGeofence,
        thresholdM
    });

    return {
        distanceM: Math.round(distanceM),
        withinGeofence,
        officeName
    };
}
