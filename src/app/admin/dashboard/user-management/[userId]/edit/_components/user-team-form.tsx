
'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Users, AlertCircle, CheckCircle } from "lucide-react";
import { collection, getDocs, query, where, writeBatch, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Team = {
    id: string;
    name: string;
    description?: string;
    teamType?: string;
}

type UserTeam = {
    teamId: string;
    teamName: string;
    userRole: 'member' | 'lead';
    teamType?: string;
}

type TeamMember = {
    id: string;
    teamId: string;
    userId: string;
    role: 'member' | 'lead';
    reportsToMemberId?: string | null;
}

export function UserTeamForm({ userId, onFormChange }: { userId: string, onFormChange: (data: any) => void }) {
    const { toast } = useToast();
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [userTeams, setUserTeams] = useState<UserTeam[]>([]);
    const [existingTeamMembers, setExistingTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeamData = async () => {
            setLoading(true);
            try {
                // Fetch all teams
                const teamsSnapshot = await getDocs(collection(db, 'teams'));
                const allTeamsData = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
                setAllTeams(allTeamsData);

                // Fetch user's current team memberships
                const q = query(collection(db, 'teamMembers'), where('userId', '==', userId));
                const userTeamsSnapshot = await getDocs(q);
                const teamMembersData: TeamMember[] = userTeamsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as TeamMember));
                setExistingTeamMembers(teamMembersData);

                // Map to UserTeam format for UI
                const userTeamsData: UserTeam[] = teamMembersData.map(member => {
                    const team = allTeamsData.find(t => t.id === member.teamId);
                    return {
                        teamId: member.teamId,
                        teamName: team?.name || 'Unknown Team',
                        userRole: member.role,
                        teamType: team?.teamType,
                    };
                });
                setUserTeams(userTeamsData);
                onFormChange(userTeamsData);

            } catch (error) {
                console.error("Error fetching team data:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load team data. Please try again.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, [userId, onFormChange, toast]);

    const handleAddTeam = () => {
        const availableTeams = allTeams.filter(team => 
            !userTeams.some(userTeam => userTeam.teamId === team.id)
        );
        
        if (availableTeams.length === 0) {
            toast({
                title: "No Available Teams",
                description: "This user is already assigned to all available teams.",
            });
            return;
        }

        const newTeam = availableTeams[0];
        const updatedTeams = [...userTeams, { 
            teamId: newTeam.id, 
            teamName: newTeam.name, 
            userRole: 'member' as 'member',
            teamType: newTeam.teamType 
        }];
        setUserTeams(updatedTeams);
        onFormChange(updatedTeams);
    };

    const handleRemoveTeam = (teamId: string) => {
        setTeamToDelete(teamId);
        setDeleteDialogOpen(true);
    };

    const confirmRemoveTeam = () => {
        if (!teamToDelete) return;
        
        const updatedTeams = userTeams.filter(t => t.teamId !== teamToDelete);
        setUserTeams(updatedTeams);
        onFormChange(updatedTeams);
        setDeleteDialogOpen(false);
        setTeamToDelete(null);
    };

    const handleRoleChange = (teamId: string, newRole: 'member' | 'lead') => {
        const updatedTeams = userTeams.map(t => 
            t.teamId === teamId ? { ...t, userRole: newRole } : t
        );
        setUserTeams(updatedTeams);
        onFormChange(updatedTeams);
    };

    const saveTeamAssignments = async () => {
        setSaving(true);
        try {
            const batch = writeBatch(db);

            // Remove existing team memberships
            existingTeamMembers.forEach(member => {
                const memberRef = doc(db, 'teamMembers', member.id);
                batch.delete(memberRef);
            });

            // Add new team memberships
            userTeams.forEach(team => {
                const newMemberRef = doc(collection(db, 'teamMembers'));
                batch.set(newMemberRef, {
                    teamId: team.teamId,
                    userId: userId,
                    role: team.userRole,
                    reportsToMemberId: null, // Could be enhanced to handle reporting structure
                });
            });

            await batch.commit();
            
            toast({
                title: "Team Assignments Saved",
                description: "User's team assignments have been updated successfully.",
            });

            // Refresh existing team members
            const q = query(collection(db, 'teamMembers'), where('userId', '==', userId));
            const userTeamsSnapshot = await getDocs(q);
            const teamMembersData: TeamMember[] = userTeamsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TeamMember));
            setExistingTeamMembers(teamMembersData);

        } catch (error) {
            console.error("Error saving team assignments:", error);
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: "Could not save team assignments. Please try again.",
            });
        } finally {
            setSaving(false);
        }
    };

    const getTeamTypeBadge = (teamType?: string) => {
        switch (teamType) {
            case 'Department':
                return <Badge variant="default">Department</Badge>;
            case 'Project':
                return <Badge variant="secondary">Project</Badge>;
            case 'Task Force':
                return <Badge variant="outline">Task Force</Badge>;
            default:
                return <Badge variant="outline">Team</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Team Assignments</CardTitle>
                        <CardDescription>Manage which teams this user belongs to and their role within each.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddTeam} disabled={loading}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add to Team
                        </Button>
                        <Button 
                            size="sm" 
                            onClick={saveTeamAssignments} 
                            disabled={saving || loading}
                            variant="outline"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                                         {loading ? (
                         <div className="space-y-4">
                             {Array.from({ length: 3 }).map((_, i) => (
                                 <Skeleton key={`team-skeleton-${i}`} className="h-10 w-full" />
                             ))}
                         </div>
                     ) : userTeams.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Team Assignments</h3>
                            <p className="text-muted-foreground mb-4">
                                This user is not assigned to any teams yet.
                            </p>
                            <Button onClick={handleAddTeam}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add to Team
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Team Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Role in Team</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userTeams.map(team => (
                                    <TableRow key={team.teamId}>
                                        <TableCell className="font-medium">{team.teamName}</TableCell>
                                        <TableCell>{getTeamTypeBadge(team.teamType)}</TableCell>
                                        <TableCell>
                                            <Select 
                                                value={team.userRole} 
                                                onValueChange={(value) => handleRoleChange(team.teamId, value as 'member' | 'lead')}
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="member">Member</SelectItem>
                                                    <SelectItem value="lead">Lead</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleRemoveTeam(team.teamId)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                <span className="sr-only">Remove</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Available Teams Info */}
            {!loading && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Available Teams</CardTitle>
                        <CardDescription>Teams this user can be added to</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            {allTeams
                                .filter(team => !userTeams.some(userTeam => userTeam.teamId === team.id))
                                .map(team => (
                                    <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <div className="font-medium">{team.name}</div>
                                            <div className="text-sm text-muted-foreground">{team.description}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getTeamTypeBadge(team.teamType)}
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => {
                                                    const updatedTeams = [...userTeams, { 
                                                        teamId: team.id, 
                                                        teamName: team.name, 
                                                        userRole: 'member' as 'member',
                                                        teamType: team.teamType 
                                                    }];
                                                    setUserTeams(updatedTeams);
                                                    onFormChange(updatedTeams);
                                                }}
                                            >
                                                <PlusCircle className="h-4 w-4 mr-1" />
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            {allTeams.filter(team => !userTeams.some(userTeam => userTeam.teamId === team.id)).length === 0 && (
                                <div className="text-center py-4 text-muted-foreground">
                                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                                    User is assigned to all available teams
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove from Team</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this user from the team? This action can be undone by adding them back.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemoveTeam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
