import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs, type AuditLogQuery } from '@/lib/auditLogger';
import { auth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user has admin privileges
    if (!decodedToken.admin && !decodedToken.role?.includes('Admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams: AuditLogQuery = {};

    if (searchParams.get('userId')) {
      queryParams.userId = searchParams.get('userId')!;
    }
    if (searchParams.get('userRole')) {
      queryParams.userRole = searchParams.get('userRole')!;
    }
    if (searchParams.get('actionType')) {
      queryParams.actionType = searchParams.get('actionType')!;
    }
    if (searchParams.get('moduleAccessed')) {
      queryParams.moduleAccessed = searchParams.get('moduleAccessed')!;
    }
    if (searchParams.get('status')) {
      queryParams.status = searchParams.get('status')!;
    }
    if (searchParams.get('startDate')) {
      queryParams.startDate = new Date(searchParams.get('startDate')!);
    }
    if (searchParams.get('endDate')) {
      queryParams.endDate = new Date(searchParams.get('endDate')!);
    }
    if (searchParams.get('limit')) {
      queryParams.limit = parseInt(searchParams.get('limit')!);
    }

    // Fetch audit logs
    const logs = await getAuditLogs(queryParams);

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    const body = await request.json();
    const { logAuditEvent } = await import('@/lib/auditLogger');
    const { getUserIPAddress, getUserAgent } = await import('@/lib/auditLogger');

    // Add IP and user agent information
    const auditEntry = {
      ...body,
      ipAddress: getUserIPAddress(request),
      userAgent: getUserAgent(request),
    };

    const logId = await logAuditEvent(auditEntry);

    return NextResponse.json({
      success: true,
      logId,
      message: 'Audit log created successfully',
    });

  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    );
  }
}
