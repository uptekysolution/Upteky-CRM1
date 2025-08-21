'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { checkDistanceToCoords } from '@/utils/checkDistance'
import { MapPin, CheckCircle, XCircle } from 'lucide-react'

export default function DebugDistancePage() {
  const [userLat, setUserLat] = useState('22.99417')
  const [userLon, setUserLon] = useState('72.49939')
  const [result, setResult] = useState<any>(null)

  const offices = [
    {
      id: 'office-1',
      name: 'Siddhii Vinayak Towers',
      latitude: 22.99417,
      longitude: 72.49939,
    },
    {
      id: 'office-2', 
      name: 'Matrix Corporate Road',
      latitude: 23.008349,
      longitude: 72.506866,
    }
  ]

  const testDistance = () => {
    const lat = parseFloat(userLat)
    const lon = parseFloat(userLon)
    
    if (isNaN(lat) || isNaN(lon)) {
      alert('Please enter valid coordinates')
      return
    }

    const results = offices.map(office => {
      const distance = checkDistanceToCoords(lat, lon, office.latitude, office.longitude, office.name, 50)
      return {
        office,
        ...distance
      }
    })

    setResult(results)
  }

  const presetLocations = [
    { name: 'At Siddhii Vinayak Towers', lat: '22.99417', lon: '72.49939' },
    { name: 'At Matrix Corporate Road', lat: '23.008349', lon: '72.506866' },
    { name: '50m from Siddhii Vinayak', lat: '22.99467', lon: '72.49939' },
    { name: '100m from Siddhii Vinayak', lat: '22.99517', lon: '72.49939' },
    { name: 'Between both offices', lat: '23.00126', lon: '72.50313' },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Distance Calculator Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {offices.map((office) => (
          <Card key={office.id} className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">{office.name}</CardTitle>
              <CardDescription>Office ID: {office.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Lat: {office.latitude}, Lon: {office.longitude}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Distance Calculation</CardTitle>
          <CardDescription>Enter coordinates to test distance to offices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={userLat}
                onChange={(e) => setUserLat(e.target.value)}
                placeholder="Enter latitude"
              />
            </div>
            <div>
              <Label htmlFor="lon">Longitude</Label>
              <Input
                id="lon"
                type="number"
                step="any"
                value={userLon}
                onChange={(e) => setUserLon(e.target.value)}
                placeholder="Enter longitude"
              />
            </div>
          </div>
          
          <Button onClick={testDistance} className="mb-4">
            Calculate Distance
          </Button>

          <div className="space-y-2">
            <p className="text-sm font-medium">Preset Locations:</p>
            <div className="flex flex-wrap gap-2">
              {presetLocations.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUserLat(preset.lat)
                    setUserLon(preset.lon)
                  }}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Distance Results</CardTitle>
            <CardDescription>Distance from your location to each office</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.map((r: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{r.office.name}</h3>
                    <div className="flex items-center gap-2">
                      {r.withinGeofence ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <Badge variant={r.withinGeofence ? "default" : "destructive"}>
                        {r.distanceM}m
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.withinGeofence ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        ✓ Within 50m - Check-in/out allowed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        ✗ Outside 50m - Check-in/out not allowed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
