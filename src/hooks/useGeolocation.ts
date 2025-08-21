'use client'

import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
    lat: number | null
    lon: number | null
    loading: boolean
    error: string | null
    accuracy: number | null
    retryCount: number
}

interface GeolocationHook extends GeolocationState {
    refresh: () => void
    forceRefresh: () => void
}

// Maximum allowed accuracy in meters (100m = poor accuracy)
const MAX_ACCURACY = 100
// Maximum retry attempts for high accuracy
const MAX_RETRIES = 3
// Timeout for each GPS request
const GPS_TIMEOUT = 15000

export function useGeolocation(): GeolocationHook {
    const [state, setState] = useState<GeolocationState>({
        lat: null,
        lon: null,
        loading: true,
        error: null,
        accuracy: null,
        retryCount: 0
    })

    const getCurrentPosition = useCallback((isRetry = false) => {
        if (!navigator.geolocation) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Geolocation is not supported by this browser'
            }))
            return
        }

        // Check if we're on HTTPS (required for high accuracy GPS)
        if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'HTTPS is required for high accuracy GPS. Please use HTTPS or localhost.'
            }))
            return
        }

        setState(prev => ({ 
            ...prev, 
            loading: true, 
            error: null,
            retryCount: isRetry ? prev.retryCount + 1 : 0
        }))

        const options: PositionOptions = {
            enableHighAccuracy: true,
            timeout: GPS_TIMEOUT,
            maximumAge: 0 // Don't use cached positions - always get fresh GPS
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords
                
                console.log('📍 GPS Position received:', {
                    lat: latitude,
                    lon: longitude,
                    accuracy: `${accuracy}m`,
                    retryCount: state.retryCount,
                    timestamp: new Date(position.timestamp).toISOString()
                })

                // Validate accuracy
                if (accuracy > MAX_ACCURACY) {
                    console.warn(`⚠️ GPS accuracy too low: ${accuracy}m (max: ${MAX_ACCURACY}m)`)
                    
                    if (state.retryCount < MAX_RETRIES) {
                        console.log(`🔄 Retrying GPS (attempt ${state.retryCount + 1}/${MAX_RETRIES})...`)
                        setTimeout(() => getCurrentPosition(true), 2000) // Wait 2 seconds before retry
                        return
                    } else {
                        console.error(`❌ GPS accuracy still poor after ${MAX_RETRIES} attempts`)
                        setState(prev => ({
                            ...prev,
                            loading: false,
                            error: `GPS accuracy too low (${accuracy}m). Please ensure you're outdoors with clear sky view and try again.`
                        }))
                        return
                    }
                }

                // Success - accuracy is good enough
                console.log(`✅ GPS accuracy acceptable: ${accuracy}m`)
                setState({
                    lat: latitude,
                    lon: longitude,
                    loading: false,
                    error: null,
                    accuracy: accuracy,
                    retryCount: 0
                })
            },
            (error) => {
                let errorMessage = 'Failed to get location'

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please allow "Precise Location" in your browser settings.'
                        break
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable. Please check your GPS settings.'
                        break
                    case error.TIMEOUT:
                        errorMessage = `Location request timed out after ${GPS_TIMEOUT/1000}s. Please try again.`
                        break
                    default:
                        errorMessage = 'Unknown location error'
                }

                console.error('❌ GPS Error:', {
                    code: error.code,
                    message: errorMessage,
                    retryCount: state.retryCount
                })

                setState(prev => ({
                    ...prev,
                    lat: null,
                    lon: null,
                    loading: false,
                    error: errorMessage,
                    accuracy: null
                }))
            },
            options
        )
    }, [state.retryCount])

    const refresh = useCallback(() => {
        getCurrentPosition()
    }, [getCurrentPosition])

    const forceRefresh = useCallback(() => {
        // Force a fresh GPS reading by clearing any cached data
        setState(prev => ({
            ...prev,
            lat: null,
            lon: null,
            accuracy: null,
            retryCount: 0
        }))
        setTimeout(() => getCurrentPosition(), 100)
    }, [getCurrentPosition])

    useEffect(() => {
        getCurrentPosition()
    }, [getCurrentPosition])

    return {
        ...state,
        refresh,
        forceRefresh
    }
}