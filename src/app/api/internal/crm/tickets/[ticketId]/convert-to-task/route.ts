
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// POST /api/internal/crm/tickets/{ticketId}/convert-to-task - Convert ticket to a task
export async function POST(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
    const { ticketId } = await params;
    // In a real app, add permission checks and get authorId from auth session
    const authorId = 'system-process-id'; // System action
    const authorName = 'Upteky Central System'; 

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
            assignee: ticketData.assignedToUserId || null,
            linkedTicketId: ticketId,
            createdAt: new Date(),
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
