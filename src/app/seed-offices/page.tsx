'use client'
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SeedOfficesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const offices = [
    {
      id: 'office-1',
      name: 'Siddhii Vinayak Towers',
      latitude: 22.99417,
      longitude: 72.49939,
      isActive: true
    },
    {
      id: 'office-2', 
      name: 'Matrix Corporate Road',
      latitude: 23.008349,
      longitude: 72.506866,
      isActive: true
    }
  ];

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Triggering office seed...');
      const response = await fetch('/api/admin/seed/offices', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Seed result:', data);
        setResult(data);
      } else {
        const errorText = await response.text();
        console.error('Seed error:', errorText);
        setError(errorText);
      }
    } catch (err: any) {
      console.error('Seed failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Seed Office Data</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {offices.map((office) => (
          <Card key={office.id} className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{office.name}</CardTitle>
                <Badge variant={office.isActive ? "default" : "secondary"}>
                  {office.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription>Office ID: {office.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Lat: {office.latitude}, Lon: {office.longitude}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    Check-in/out allowed within 50m radius
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Button 
        onClick={handleSeed} 
        disabled={loading}
        className="mb-6"
        size="lg"
      >
        {loading ? 'Seeding Offices...' : 'Seed Office Data'}
      </Button>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}
      
      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <strong>Success:</strong> {result.message}
          </div>
          <div className="mt-2">
            Offices added: {result.count}
          </div>
        </div>
      )}
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>What this does:</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2">
            <li>Adds two office locations to your Firebase database</li>
            <li><strong>Siddhii Vinayak Towers:</strong> Located at coordinates (22.99417, 72.49939)</li>
            <li><strong>Matrix Corporate Road:</strong> Located at coordinates (23.008349, 72.506866)</li>
            <li>Both offices are set as active and allow check-in/out within 50 meters</li>
            <li>After seeding, users can select these offices in the attendance system</li>
            <li>The system will automatically check if users are within 50m of the selected office</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
