'use client'

import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
    lat: number | null
    lon: number | null
    loading: boolean
    error: string | null
}

interface GeolocationHook extends GeolocationState {
    refresh: () => void
}

export function useGeolocation(): GeolocationHook {
    const [state, setState] = useState<GeolocationState>({
        lat: null,
        lon: null,
        loading: true,
        error: null
    })

    const getCurrentPosition = useCallback(() => {
        if (!navigator.geolocation) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Geolocation is not supported by this browser'
            }))
            return
        }

        setState(prev => ({ ...prev, loading: true, error: null }))

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    loading: false,
                    error: null
                })
            },
            (error) => {
                let errorMessage = 'Failed to get location'

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied'
                        break
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable'
                        break
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out'
                        break
                    default:
                        errorMessage = 'Unknown location error'
                }

                setState({
                    lat: null,
                    lon: null,
                    loading: false,
                    error: errorMessage
                })
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        )
    }, [])

    const refresh = useCallback(() => {
        getCurrentPosition()
    }, [getCurrentPosition])

    useEffect(() => {
        getCurrentPosition()
    }, [getCurrentPosition])

    return {
        ...state,
        refresh
    }
}