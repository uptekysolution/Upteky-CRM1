
import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';

// POST /api/internal/crm/tickets/{ticketId}/convert-to-task - Convert ticket to a task
export async function POST(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
    const { ticketId } = await params;
    // Require authentication; set creator/assigner fields from current user
    const authHeader = req.headers.get('authorization') || ''
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : ''
    let authorId = 'system-process-id'
    let authorName = 'Upteky Central System'
    let creatorRole: 'ADMIN' | 'TEAM_LEAD' | 'UNKNOWN' = 'UNKNOWN'
    if (bearer) {
      try {
        const decoded = await auth.verifyIdToken(bearer)
        authorId = decoded.uid
        const userDoc = await db.collection('users').doc(decoded.uid).get()
        const roleLower = (userDoc.data()?.role || '').toLowerCase()
        authorName = userDoc.data()?.name || authorName
        creatorRole = roleLower === 'admin' ? 'ADMIN' : (roleLower === 'team lead' ? 'TEAM_LEAD' : 'UNKNOWN')
      } catch {}
    }

    try {
        const ticketRef = db.collection('tickets').doc(ticketId);
        const ticketSnap = await ticketRef.get();

        if (!ticketSnap.exists) {
            return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
        }
        
        const ticketData = ticketSnap.data();

        // Prevent creating duplicate tasks
        if (ticketData.linkedTaskId) {
            return NextResponse.json({ message: 'This ticket has already been converted to a task' }, { status: 400 });
        }

        const batch = db.batch();

        // 1. Create new task
        const taskNumber = Math.floor(Date.now() / 1000);
        const newTaskRef = db.collection('tasks').doc(); // Auto-generate ID
        
        batch.set(newTaskRef, {
            title: ticketData.title,
            description: ticketData.description,
            status: 'To Do',
            priority: 'Medium',
            progress: 0,
            assigneeId: ticketData.assignedToUserId || null,
            assigneeName: '',
            assigneeEmail: '',
            createdBy: authorId,
            createdById: authorId,
            createdByRole: creatorRole,
            assignedById: authorId,
            assignedByRole: creatorRole,
            linkedTicketId: ticketId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // 2. Update the original ticket with the new task ID
        batch.update(ticketRef, { linkedTaskId: newTaskRef.id });

        // 3. Post an internal note to the ticket
        const newReplyRef = db.collection('ticketReplies').doc(); // Auto-generate ID
        
        batch.set(newReplyRef, {
            ticketId,
            authorId,
            authorName,
            message: `This ticket has been converted to Task #${taskNumber}.`,
            isInternalNote: true,
            createdAt: new Date(),
        });

        // Commit all batched writes
        await batch.commit();

        return NextResponse.json({ 
            message: 'Ticket converted to task successfully',
            newTaskId: newTaskRef.id
        }, { status: 201 });

    } catch (error) {
        console.error(`Error converting ticket ${ticketId} to task:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
