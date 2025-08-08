
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

type Permission = {
    id: string;
    name: string;
    description: string;
};

type AllPermissions = Record<string, Permission[]>;

type PermissionState = 'inherit' | 'allow' | 'deny';
type PermissionOverrides = Record<string, PermissionState>;

export function UserPermissionForm({ user, onFormChange }: { user: any, onFormChange: (data: any) => void }) {
    const [allPermissions, setAllPermissions] = useState<AllPermissions>({});
    const [overrides, setOverrides] = useState<PermissionOverrides>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPermissionsAndOverrides = async () => {
            setLoading(true);
            try {
                // Fetch all possible permissions
                const permissionsCollection = collection(db, 'permissions');
                const permSnapshot = await getDocs(permissionsCollection);
                const groupedPermissions: AllPermissions = {
                    'User Management': [], 'Auditing': [], 'Payroll': [], 'CRM': [], 'Attendance': [], 'Tasks': [], 'Timesheet': [], 'Lead Generation': []
                };

                permSnapshot.docs.forEach(doc => {
                    const perm = { id: doc.id, ...doc.data() } as Permission;
                    const module = perm.name.split(':')[0];
                    if (module.includes('user') || module.includes('permission')) groupedPermissions['User Management'].push(perm);
                    else if (module.includes('audit')) groupedPermissions['Auditing'].push(perm);
                    else if (module.includes('payroll')) groupedPermissions['Payroll'].push(perm);
                    else if (module.includes('crm')) groupedPermissions['CRM'].push(perm);
                    else if (module.includes('attendance')) groupedPermissions['Attendance'].push(perm);
                    else if (module.includes('tasks')) groupedPermissions['Tasks'].push(perm);
                    else if (module.includes('timesheet')) groupedPermissions['Timesheet'].push(perm);
                    else if (module.includes('lead-generation')) groupedPermissions['Lead Generation'].push(perm);
                });
                setAllPermissions(groupedPermissions);

                // Fetch existing user overrides
                const overrideRef = doc(db, 'user_permissions', user.id);
                const overrideSnap = await getDoc(overrideRef);
                if (overrideSnap.exists()) {
                    setOverrides(overrideSnap.data().overrides || {});
                    onFormChange(overrideSnap.data().overrides || {});
                }

            } catch (error) {
                console.error("Error fetching permission data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPermissionsAndOverrides();
    }, [user.id, onFormChange]);

    const handleOverrideChange = (permissionId: string, value: PermissionState) => {
        const newOverrides = {
            ...overrides,
            [permissionId]: value
        };
        setOverrides(newOverrides);
        onFormChange(newOverrides);
    };

    if(loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Permission Overrides</CardTitle>
                    <CardDescription>
                        Explicitly grant or revoke permissions for this user, overriding their base role ({user.role}).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {Array.from({length: 3}).map((_, i) => (
                            <div key={i}>
                                <Skeleton className="h-6 w-32 mb-4" />
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Permission</TableHead>
                                                <TableHead className="text-right w-[300px]">Override Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>
                                                    <Skeleton className="h-5 w-40 mb-1" />
                                                    <Skeleton className="h-3 w-64" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-8 w-full" />
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Permission Overrides</CardTitle>
                <CardDescription>
                    Explicitly grant or revoke permissions for this user, overriding their base role ({user.role}).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {Object.entries(allPermissions).map(([moduleName, permissions]) => (
                        <div key={moduleName}>
                            <h3 className="font-semibold mb-2">{moduleName}</h3>
                            <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Permission</TableHead>
                                        <TableHead className="text-right w-[300px]">Override Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {permissions.map(permission => (
                                        <TableRow key={permission.id}>
                                            <TableCell>
                                                <p className="font-medium">{permission.name}</p>
                                                <p className="text-muted-foreground text-xs">{permission.description}</p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <RadioGroup
                                                    value={overrides[permission.name] || 'inherit'}
                                                    onValueChange={(value) => handleOverrideChange(permission.name, value as PermissionState)}
                                                    className="flex justify-end gap-4"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="inherit" id={`${permission.id}-inherit`} />
                                                        <Label htmlFor={`${permission.id}-inherit`}>Inherit</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="allow" id={`${permission.id}-allow`} />
                                                        <Label htmlFor={`${permission.id}-allow`}>Allow</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="deny" id={`${permission.id}-deny`} />
                                                        <Label htmlFor={`${permission.id}-deny`}>Deny</Label>
                                                    </div>
                                                </RadioGroup>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
