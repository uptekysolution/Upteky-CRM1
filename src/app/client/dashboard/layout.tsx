
'use client';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Search, Settings, User, Bell } from 'lucide-react';
import { signOut, getAuth } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { RoleGuard } from '@/components/role-guard';
import LogoImage from '@/components/LogoImage'
import { useUserProfile } from '@/hooks/use-user-profile';


// No left sidebar; horizontal tabs will be rendered inside page content.


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      // Clear session cookies
      await fetch('/api/auth/clearSession', { method: 'POST' });
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: 'Could not log you out. Please try again.' });
    }
  };

  return (
    <RoleGuard allowedRoles={['Client']} fallbackPath="/login">
      <TooltipProvider>
        <div className="min-h-screen bg-[#F9FAFB]">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <LogoImage size={140} className="h-auto w-auto" />
              {/* <h1 className="text-xl md:text-2xl font-semibold text-black">
                {userProfile?.companyName ? `${userProfile.companyName} Dashboard` : 'Dashboard'}
              </h1> */}
            </div>
            <div className="relative ml-auto w-full md:grow-0">
              {/* <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              /> */}
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                  <Avatar>
                    <AvatarImage src="https://placehold.co/32x32.png" data-ai-hint="avatar woman" alt="@shadcn" />
                    <AvatarFallback>C</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="mx-auto max-w-7xl flex flex-1 flex-col gap-6 p-4 md:gap-8">
            {children}
            <footer className="text-center text-sm text-muted-foreground py-4">
              © {new Date().getFullYear()} Upteky Solution Pvt Ltd. All rights reserved.
            </footer>
          </main>
        </div>
      </TooltipProvider>
    </RoleGuard>
  );
}
