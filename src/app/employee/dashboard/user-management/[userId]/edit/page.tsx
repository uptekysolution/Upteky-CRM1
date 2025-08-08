
'use client'

import { useEffect, useState, use } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfileForm } from "./_components/user-profile-form";
import { UserTeamForm } from "./_components/user-team-form";
import { UserPermissionForm } from "./_components/user-permission-form";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";


export default function UserEditPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = use(params);
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // State for child components
    const [profileData, setProfileData] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [permissionData, setPermissionData] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = { id: userSnap.id, ...userSnap.data() };
                    setUser(userData);
                    setProfileData(userData); // Initialize form data
                } else {
                    toast({ variant: 'destructive', title: 'User not found' });
                }
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Failed to fetch user data' });
                 console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [userId, toast]);


    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            // --- Save Profile Data ---
            if (profileData) {
                const userRef = doc(db, 'users', user.id);
                // We only update fields that can be changed in the form
                const { firstName, lastName, role } = profileData as any;
                await setDoc(userRef, {
                    ...user, // preserve existing data
                    firstName,
                    lastName,
                    name: `${firstName} ${lastName}`,
                    role,
                });
            }

            // --- Save Team Data ---
            if (teamData) {
                // This is more complex in reality. You'd likely delete all existing
                // team memberships for this user and add the new ones in a batch write.
                console.log("Saving Team Data (not implemented):", teamData);
            }

            // --- Save Permission Overrides ---
            if (permissionData) {
                const permissionRef = doc(db, 'user_permissions', user.id);
                await setDoc(permissionRef, { overrides: permissionData });
            }

            toast({ title: "Changes Saved", description: "User data has been updated successfully." });

        } catch (error) {
            console.error("Failed to save changes:", error);
            toast({ variant: 'destructive', title: "Save Failed", description: "Could not save changes to the database." });
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
             <div className="grid gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-10 w-full" />
                    </CardHeader>
                    <CardContent className="p-6 pt-6">
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-1/2" />
                             <Skeleton className="h-10 w-1/2" />
                             <Skeleton className="h-24 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }


    if (!user) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>User Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The requested user could not be found.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-4">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Edit User: {user.name}</h1>
                    <p className="text-muted-foreground">Manage user profile, team assignments, and permissions.</p>
                </div>
                <Button onClick={handleSaveChanges} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="teams">Team Assignments</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>
                <TabsContent value="profile">
                    <UserProfileForm user={user} onFormChange={setProfileData} />
                </TabsContent>
                <TabsContent value="teams">
                    <UserTeamForm userId={user.id} onFormChange={setTeamData} />
                </TabsContent>
                <TabsContent value="permissions">
                    <UserPermissionForm user={user} onFormChange={setPermissionData} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
