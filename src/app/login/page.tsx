
'use client';

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getDatabase, ref, get as getFromRealtimeDb } from 'firebase/database';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { auth, db, app } from '@/lib/firebase';
import LogoImage from '@/components/LogoImage';

const loginSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, data.email, data.password);

      const userId = credential.user?.uid;
      if (!userId) {
        throw new Error('No user ID returned from authentication.');
      }

      // Fetch role: try Firestore first, then fall back to Realtime Database
      let role: string | undefined;
      let userData: any = null;

      try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          userData = userDocSnap.data();
          role = userData?.role;
          console.log('User data from Firestore:', userData);
        } else {
          console.log('User document not found in Firestore for UID:', userId);
        }
      } catch (err) {
        console.error('Error fetching role from Firestore:', err);
      }

      if (!role) {
        try {
          const rtdb = getDatabase(app);
          const roleSnap = await getFromRealtimeDb(ref(rtdb, `users/${userId}/role`));
          if (roleSnap.exists()) {
            role = roleSnap.val();
            console.log('Role from Realtime Database:', role);
          } else {
            console.log('Role not found in Realtime Database for UID:', userId);
          }
        } catch (err) {
          console.error('Error fetching role from Realtime Database:', err);
        }
      }

      const validRoles = ['Admin', 'Employee', 'Client', 'HR', 'Team Lead', 'Business Development', 'Sub-Admin'] as const;
      if (!role || !validRoles.includes(role as (typeof validRoles)[number])) {
        await signOut(auth);
        console.error('Role validation failed:', { role, validRoles, userId, userData });
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: `Your account role (${role || 'missing'}) is not recognized. Please contact support.`,
        });
        form.reset({ email: data.email, password: '' });
        return;
      }

      // Additional domain-role enforcement
      const isUpteky = data.email.toLowerCase().endsWith('@upteky.com')
      if (isUpteky && !['Admin','Employee','HR','Team Lead','Business Development','Sub-Admin'].includes(role as string)) {
        await signOut(auth)
        toast({ variant: 'destructive', title: 'Unauthorized', description: 'Use a client account for non-upteky roles.' })
        form.reset({ email: data.email, password: '' })
        return
      }
      if (!isUpteky && role !== 'Client') {
        await signOut(auth)
        toast({ variant: 'destructive', title: 'Unauthorized', description: 'Only clients can log in with external emails.' })
        form.reset({ email: data.email, password: '' })
        return
      }

      const redirectByRole: Record<string, string> = {
        Admin: '/admin/dashboard',
        Employee: '/employee/dashboard',
        Client: '/client/dashboard',
        HR: '/employee/dashboard', // HR users go to employee dashboard
        'Team Lead': '/employee/dashboard', // Team Lead users go to employee dashboard
        'Business Development': '/employee/dashboard', // Business Development users go to employee dashboard
        'Sub-Admin': '/employee/dashboard', // Sub-Admin users go to employee dashboard
      };

      toast({
        title: 'Login Successful',
        description: 'Welcome back! Redirecting to your dashboard...',
      });
      // Set session cookie for middleware
      try {
        const idToken = await credential.user.getIdToken()
        await fetch('/api/auth/setSession', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken, role }) })
      } catch (e) {
        // ignore
      }
      router.push(redirectByRole[role]);
    } catch (error: any) {
      let errorMessage = "Invalid credentials. Please check your email and password.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
      } else {
        console.error("Firebase Auth Error:", error);
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
      form.reset({
        email: data.email,
        password: '',
      });
    }
  };

  const handleResetPassword = async () => {
    const email = String(forgotEmail || '').trim() || String((form.getValues().email || '')).trim()
    if (!email) {
      toast({ variant: 'destructive', title: 'Enter your email' })
      return
    }
    setForgotSubmitting(true)
    try {
      const res = await fetch('/api/auth/sendPasswordReset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || 'Failed to send reset email')
      }
      toast({ title: 'Reset email sent. Check your inbox.' })
      setForgotOpen(false)
      setForgotEmail('')
      router.push('/login')
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Reset failed', description: e?.message || 'Could not send reset email' })
    } finally {
      setForgotSubmitting(false)
    }
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[380px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <LogoImage size={160} className="h-auto w-auto" />
              {/* <Logo className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Upteky Central</h1> */}
            </div>
            <p className="text-balance text-muted-foreground">
              Enter your Upteky email and password to access your account.
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your registered email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {form.formState.isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
              <Button type="button" variant="link" onClick={() => setForgotOpen(true)} className="w-full p-0">
                Forgot Password?
              </Button>
            </form>
          </Form>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://placehold.co/1920x1080.png"
          alt="Abstract blue and white waves"
          data-ai-hint="office building abstract"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.3]"
        />
      </div>
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>Enter your account email to receive a reset link.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Input
              type="email"
              placeholder="you@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForgotOpen(false)} disabled={forgotSubmitting}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={forgotSubmitting}>
              {forgotSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {forgotSubmitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
