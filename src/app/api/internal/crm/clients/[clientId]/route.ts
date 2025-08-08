import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const doc = await db.collection('clients').doc(clientId).get();
  if (!doc.exists) {
    return NextResponse.json({ message: 'Client not found' }, { status: 404 });
  }
  return NextResponse.json({ id: doc.id, ...doc.data() });
}