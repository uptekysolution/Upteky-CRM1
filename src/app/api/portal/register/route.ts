
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// POST /api/portal/register - Register a client account with a token
export async function POST(req: NextRequest) {
    try {
        const { token, email, password, name } = await req.json();

        if (!token || !email || !password || !name) {
            return NextResponse.json({ message: 'Token, email, password, and name are required' }, { status: 400 });
        }

        // --- TOKEN VALIDATION & USER CREATION LOGIC ---
        // In a real application, you would:
        // 1. Look up the token in your database to find the associated `contactId`.
        // 2. Validate that the token is not expired and has not been used.
        // 3. Create a new user in Firebase Auth with the provided email and password.
        // 4. Update the corresponding `contacts` document:
        //    - Set `hasPortalAccess` to true.
        //    - Store the new Firebase Auth `uid` in `portalUserId`.
        // 5. Invalidate the registration token.

        console.log(`Client registration for email: ${email} with token: ${token}`);

        // Mock finding a contact by the token's associated email
        // This is a placeholder for real token validation logic.
        const contactRef = doc(db, 'contacts', 'contact-jane-smith'); // Example contact ID
        const contactSnap = await getDoc(contactRef);

        if (!contactSnap.exists() || contactSnap.data().email !== email) {
            return NextResponse.json({ message: 'Invalid token or email mismatch.' }, { status: 400 });
        }

        // Mock updating the contact record
        // await updateDoc(contactRef, {
        //     hasPortalAccess: true,
        //     portalUserId: 'new-firebase-auth-uid' // from createUserWithEmailAndPassword
        // });
        
        return NextResponse.json({ message: 'Registration successful. You can now log in.' }, { status: 201 });

    } catch (error) {
        console.error("Client registration error:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
