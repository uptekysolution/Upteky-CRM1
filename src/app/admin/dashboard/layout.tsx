
'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Banknote,
  CalendarCheck2,
  CheckSquare,
  Clock,
  FolderKanban,
  History,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Target,
  User,
  UserCog,
  Users,
  Briefcase,
  Ticket,
  ChevronDown,
  Group,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
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
import { Logo } from '@/components/logo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { RoleGuard } from '@/components/role-guard';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import LogoImage from '@/components/LogoImage'


// --- NAVIGATION ITEMS ---


// --- NAVIGATION ITEMS ---

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', requiredPermission: 'dashboard:view' as PermissionName },
  { href: '/admin/dashboard/attendance', icon: CalendarCheck2, label: 'Attendance', requiredPermission: ['attendance:view:own', 'attendance:view:team', 'attendance:view:all'] as PermissionName[] },
  { href: '/admin/dashboard/payroll', icon: Banknote, label: 'Payroll', requiredPermission: ['payroll:view:own', 'payroll:view:all'] as PermissionName[] },
  { href: '/admin/dashboard/lead-generation', icon: Target, label: 'Lead Generation', requiredPermission: 'lead-generation:view' as PermissionName },
  { href: '/admin/dashboard/tasks', icon: CheckSquare, label: 'Tasks', requiredPermission: 'tasks:view' as PermissionName },
  { href: '/admin/dashboard/timesheet', icon: Clock, label: 'Timesheet', requiredPermission: 'timesheet:view' as PermissionName },
];

const clientHubNavItems = [
  { href: '/admin/dashboard/hub/clients', icon: Briefcase, label: 'Clients', requiredPermission: 'clients:view' as PermissionName },
  { href: '/admin/dashboard/hub/tickets', icon: Ticket, label: 'Tickets', requiredPermission: 'tickets:view' as PermissionName },
]

const adminNavItems = [
  { href: '/admin/dashboard/user-management', icon: UserCog, label: 'User Management', requiredPermission: 'users:manage' as PermissionName },
  { href: '/admin/dashboard/admin/teams-projects', icon: Group, label: 'Team & Project Hub', requiredPermission: 'teams:manage' as PermissionName },
  { href: '/admin/dashboard/permissions', icon: ShieldCheck, label: 'Permissions', requiredPermission: 'permissions:manage' as PermissionName },
  { href: '/admin/dashboard/audit-log', icon: History, label: 'Audit Log', requiredPermission: 'audit-log:view' as PermissionName },
];


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { hasAnyPermission, isLoading } = useRolePermissions();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear session cookies
      await fetch('/api/auth/clearSession', { method: 'POST' });
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    } catch (error) {
      toast({ variant: 'destructive', title: "Logout Failed", description: "Could not log you out. Please try again." });
    }
  };

  const visibleNavItems = navItems.filter(item => hasAnyPermission(item.requiredPermission));
  const visibleClientHubNavItems = clientHubNavItems.filter(item => hasAnyPermission(item.requiredPermission));
  const visibleAdminNavItems = adminNavItems.filter(item => hasAnyPermission(item.requiredPermission));
  const hasAdminAccess = visibleAdminNavItems.length > 0;
  const hasClientHubAccess = visibleClientHubNavItems.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }


  return (
    <RoleGuard allowedRoles={['Admin']} fallbackPath="/login">
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarHeader>
              <div className="flex items-center gap-2">
                <LogoImage size={160} className="h-auto w-auto" />
                {/* <Logo className="size-7 text-primary" />
               <span className="text-lg font-semibold">Upteky Central</span> */}
              </div>
            </SidebarHeader>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild tooltip={item.label} isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {hasClientHubAccess && (
                <Collapsible defaultOpen={pathname.startsWith('/dashboard/hub')}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Briefcase />
                          <span>Client Hub</span>
                        </div>
                        <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenu className="ml-4 mt-2 border-l border-border pl-4">
                      {visibleClientHubNavItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild tooltip={item.label} isActive={pathname === item.href}>
                            <Link href={item.href}>
                              <item.icon />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              )}

            </SidebarMenu>

            {hasAdminAccess && (
              <SidebarMenu className="mt-auto">
                <SidebarMenuItem>
                  <span className="px-2 text-xs font-medium text-muted-foreground">Admin</span>
                </SidebarMenuItem>
                {visibleAdminNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild tooltip={item.label} isActive={pathname.startsWith(item.href)}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="sm:hidden" />
                </TooltipTrigger>
                <TooltipContent>Toggle Sidebar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="overflow-hidden rounded-full"
                >
                  <Avatar>
                    <AvatarImage src="https://placehold.co/32x32.png" data-ai-hint="avatar woman" alt="@shadcn" />
                    <AvatarFallback>A</AvatarFallback>
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
                <DropdownMenuItem onClick={handleLogout} className='flex items-center cursor-pointer'>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
            <footer className="text-center text-sm text-muted-foreground py-4">
              © {new Date().getFullYear()} Upteky Solution Pvt Ltd. All rights reserved. | <Link href="#" className="underline">Privacy Policy</Link> | <Link href="#" className="underline">Terms of Service</Link>
            </footer>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </RoleGuard>
  );
}
