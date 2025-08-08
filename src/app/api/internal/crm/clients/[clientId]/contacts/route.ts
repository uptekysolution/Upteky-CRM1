import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const snapshot = await db.collection('clients').doc(clientId).collection('contacts').get();
  const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json(contacts);
}