'use client'
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DebugDBPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching database debug info...');
      const response = await fetch('/api/internal/payroll/debug');
      
      if (response.ok) {
        const result = await response.json();
        console.log('Debug result:', result);
        setData(result);
      } else {
        const errorText = await response.text();
        console.error('Debug error:', errorText);
        setError(errorText);
      }
    } catch (err: any) {
      console.error('Debug failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Firebase Database Debug</h1>
      
      <Button 
        onClick={fetchDebugInfo} 
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Loading...' : 'Refresh Debug Info'}
      </Button>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {data && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Available Collections:</h2>
            <ul className="list-disc list-inside">
              {data.collections?.map((col: string) => (
                <li key={col}>{col}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Payroll Collection:</h2>
            <p>Document count: {data.payrollCount}</p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">All Collections Data:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(data.collectionData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 