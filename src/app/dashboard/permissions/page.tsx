
'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';

const roles = ["Admin", "Sub-Admin", "HR", "Team Lead", "Employee", "Business Development"];

const allPermissions = {
    'dashboard:view': { id: 1, name: 'dashboard:view', description: 'View main dashboard' },
    'attendance:view:own': { id: 2, name: 'attendance:view:own', description: 'View own attendance' },
    'attendance:view:team': { id: 3, name: 'attendance:view:team', description: 'View team attendance' },
    'attendance:view:all': { id: 4, name: 'attendance:view:all', description: 'View all attendance' },
    'payroll:view:own': { id: 5, name: 'payroll:view:own', description: 'View own payroll' },
    'payroll:view:all': { id: 6, name: 'payroll:view:all', description: 'View all payroll (except Admins)' },
    'clients:view': { id: 7, name: 'clients:view', description: 'View all clients' },
    'tickets:view': { id: 8, name: 'tickets:view', description: 'View all support tickets' },
    'lead-generation:view': { id: 10, name: 'lead-generation:view', description: 'Access lead generation tools' },
    'tasks:view': { id: 11, name: 'tasks:view', description: 'View tasks' },
    'timesheet:view': { id: 12, name: 'timesheet:view', description: 'View timesheets' },
    'users:manage': { id: 13, name: 'users:manage', description: 'Manage users (create, edit, delete)' },
    'permissions:manage': { id: 14, name: 'permissions:manage', description: 'Manage roles and permissions' },
    'audit-log:view': { id: 15, name: 'audit-log:view', description: 'View audit logs' },
} as const;


type PermissionName = keyof typeof allPermissions;
type PermissionsMatrix = Record<string, Partial<Record<PermissionName, boolean>>>;

export default function PermissionsPage() {
    const { toast } = useToast();
    const [permissions, setPermissions] = React.useState<PermissionsMatrix>({});
    const [isSaving, setIsSaving] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchPermissions = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/internal/permissions/roles', {
                    headers: { 'X-User-Role': 'Admin' }
                });
                if (!response.ok) throw new Error('Failed to fetch permissions');
                const data = await response.json();
                setPermissions(data.permissions || {});
            } catch (error) {
                setPermissions({});
                toast({
                    variant: 'destructive',
                    title: "Error",
                    description: "Failed to load permissions from backend.",
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchPermissions();
    }, [toast]);

    const handlePermissionChange = (role: string, permission: PermissionName, checked: boolean) => {
        setPermissions(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                [permission]: checked,
            }
        }));
    };
    
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/internal/permissions/roles', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-User-Role': 'Admin' // Required for permission check
                },
                body: JSON.stringify({ permissions }),
            });

            if (!response.ok) {
                throw new Error('Failed to save permissions.');
            }

            toast({
                title: "Permissions Updated",
                description: "Default role permissions have been saved successfully.",
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: "Save Failed",
                description: "An error occurred while saving permissions.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading permissions...</span>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Role Permissions Matrix</CardTitle>
                        <CardDescription>Manage default permissions for each role. Admin permissions cannot be changed.</CardDescription>
                    </div>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <div className="overflow-x-auto">
                        <Table className="min-w-full border-collapse">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px] sticky left-0 bg-card z-10">Role</TableHead>
                                    {Object.values(allPermissions).map(permission => (
                                        <TableHead key={permission.id} className="text-center p-0">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="h-full w-full px-2 py-3 border-l">
                                                        <span className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-xs font-medium text-muted-foreground">
                                                          {permission.name}
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    <p className="font-semibold">{permission.name}</p>
                                                    <p className="text-muted-foreground">{permission.description}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map(role => (
                                    <TableRow key={role}>
                                        <TableCell className="font-medium sticky left-0 bg-card z-10">{role}</TableCell>
                                        {Object.keys(allPermissions).map(permissionKey => (
                                            <TableCell key={`${role}-${permissionKey}`} className="text-center border-l">
                                                <Checkbox
                                                    checked={permissions[role]?.[permissionKey as PermissionName] || false}
                                                    onCheckedChange={(checked) => handlePermissionChange(role, permissionKey as PermissionName, !!checked)}
                                                    disabled={role === 'Admin' || isSaving}
                                                    aria-label={`${role} ${permissionKey} permission`}
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}
