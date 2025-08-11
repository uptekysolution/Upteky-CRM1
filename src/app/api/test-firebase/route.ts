import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    console.log('Testing Firebase connection...');
    
    // Test basic connection
    const testSnapshot = await db.collection('test').limit(1).get();
    console.log('Basic connection test passed');
    
    // Test LeaveRequests collection
    try {
      const leaveRequestsSnapshot = await db.collection('LeaveRequests').limit(1).get();
      console.log('LeaveRequests collection exists, count:', leaveRequestsSnapshot.size);
    } catch (error) {
      console.log('LeaveRequests collection error:', error.message);
    }
    
    // Test creating a test document
    try {
      const testDoc = await db.collection('test').add({
        timestamp: new Date(),
        message: 'Test document'
      });
      console.log('Test document created:', testDoc.id);
      
      // Clean up
      await testDoc.delete();
      console.log('Test document cleaned up');
    } catch (error) {
      console.log('Test document creation error:', error.message);
    }
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Firebase connection test completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Firebase test failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        error: 'Firebase connection failed', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
