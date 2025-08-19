import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getSessionAndUserRole } from '@/lib/auth';

async function ensurePermission(req: NextRequest, permissions: string[]) {
  const role = await getSessionAndUserRole(req);
  const map: Record<string, string[]> = {
    Admin: ['clients:view', 'clients:update', 'clients:delete'],
    'Sub-Admin': ['clients:view', 'clients:update'],
    'Team Lead': ['clients:view'],
    HR: ['clients:view'],
    'Business Development': ['clients:view'],
  };
  const granted = map[role || ''] || [];
  return permissions.every(p => granted.includes(p));
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  if (!await ensurePermission(req, ['clients:view'])) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const { clientId } = await params;
  const doc = await db.collection('clients').doc(clientId).get();
  if (!doc.exists) {
    return NextResponse.json({ message: 'Client not found' }, { status: 404 });
  }
  return NextResponse.json({ id: doc.id, ...doc.data() });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  if (!await ensurePermission(req, ['clients:update'])) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const { clientId } = await params;
  try {
    const body = await req.json();
    const allowed = ['firstName','lastName','email','phone','position','industry','website','status','description','logoUrl','lastContactAt'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    if ('firstName' in updates || 'lastName' in updates) {
      const firstName = (updates.firstName ?? body.firstName) || '';
      const lastName = (updates.lastName ?? body.lastName) || '';
      const name = `${String(firstName).trim()} ${String(lastName).trim()}`.trim();
      updates.name = name;
      updates.nameLower = name.toLowerCase();
    }
    updates.updatedAt = new Date();
    await db.collection('clients').doc(clientId).set(updates, { merge: true });
    const doc = await db.collection('clients').doc(clientId).get();
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    console.error('Error updating client', e);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  if (!await ensurePermission(req, ['clients:delete'])) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const { clientId } = await params;
  try {
    await db.collection('clients').doc(clientId).delete();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error deleting client', e);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}