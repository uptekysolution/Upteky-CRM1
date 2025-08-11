'use client'
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugAPIPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFirebase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-firebase');
      const data = await response.json();
      setTestResults({ firebase: data });
    } catch (error) {
      setTestResults({ firebase: { error: error.message } });
    } finally {
      setLoading(false);
    }
  };

  const testLeaveBalance = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/internal/leave-balance?userId=user-tl-john&month=12&year=2024', {
        headers: { 'X-User-Role': 'Team Lead' }
      });
      const data = await response.json();
      setTestResults(prev => ({ ...prev, leaveBalance: data }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, leaveBalance: { error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  const testLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/internal/leave-requests?userId=user-tl-john&month=12&year=2024', {
        headers: { 'X-User-Role': 'Team Lead' }
      });
      const data = await response.json();
      setTestResults(prev => ({ ...prev, leaveRequests: data }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, leaveRequests: { error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Debug Page</CardTitle>
          <CardDescription>Test API endpoints to debug issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testFirebase} disabled={loading}>
              Test Firebase Connection
            </Button>
            <Button onClick={testLeaveBalance} disabled={loading}>
              Test Leave Balance API
            </Button>
            <Button onClick={testLeaveRequests} disabled={loading}>
              Test Leave Requests API
            </Button>
          </div>
          
          {testResults && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

