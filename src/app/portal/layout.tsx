
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';

export default function PortalLayout({ children }: { children: ReactNode }) {
  // In a real app, user data would come from a client-side auth context
  const mockClientUser = { name: 'Jane Smith', company: 'Globex Inc.' };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
        <Link
          href="/portal/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Logo className="h-6 w-6 text-primary" />
          <span className="font-bold">Upteky Client Portal</span>
        </Link>
        <div className="flex items-center gap-4">
           <div className="text-right">
             <p className="font-semibold text-sm">{mockClientUser.name}</p>
             <p className="text-xs text-muted-foreground">{mockClientUser.company}</p>
           </div>
            <Button variant="outline" size="icon" asChild>
                <Link href="/portal/login">
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Logout</span>
                </Link>
            </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
        {children}
      </main>
       <footer className="text-center text-sm text-muted-foreground py-4 px-4">
            © {new Date().getFullYear()} Upteky Solution Pvt Ltd. All rights reserved.
        </footer>
    </div>
  );
}
