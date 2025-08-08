'use client'
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SeedPayrollPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Triggering payroll seed...');
      const response = await fetch('/api/internal/payroll/seed', {
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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Seed Payroll Data</h1>
      
      <Button 
        onClick={handleSeed} 
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Seeding...' : 'Seed Payroll Data'}
      </Button>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <strong>Success:</strong> {result.message}
          <br />
          Records added: {result.count}
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">What this does:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Adds test payroll data to your Firebase database</li>
          <li>Includes the "Sagar Pandey" record from your screenshot</li>
          <li>Adds a few additional test records</li>
          <li>After seeding, you can check the payroll page to see the data</li>
        </ul>
      </div>
    </div>
  );
} 