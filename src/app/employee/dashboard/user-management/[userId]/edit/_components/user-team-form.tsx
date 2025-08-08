
'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2 } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Team = {
    id: string;
    name: string;
}

type UserTeam = {
    teamId: string;
    teamName: string;
    userRole: 'member' | 'lead';
}


export function UserTeamForm({ userId, onFormChange }: { userId: string, onFormChange: (data: any) => void }) {
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [userTeams, setUserTeams] = useState<UserTeam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeamData = async () => {
            setLoading(true);
            try {
                // Fetch all teams
                const teamsSnapshot = await getDocs(collection(db, 'teams'));
                const allTeamsData = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
                setAllTeams(allTeamsData);

                // Fetch user's current teams
                const q = query(collection(db, 'team_members'), where('userId', '==', userId));
                const userTeamsSnapshot = await getDocs(q);

                const userTeamsData: UserTeam[] = userTeamsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    const team = allTeamsData.find(t => t.id === data.teamId);
                    return {
                        teamId: data.teamId,
                        teamName: team?.name || 'Unknown Team',
                        userRole: data.role,
                    };
                });
                setUserTeams(userTeamsData);
                onFormChange(userTeamsData);

            } catch (error) {
                console.error("Error fetching team data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, [userId, onFormChange]);


    const handleAddTeam = () => {
        const newTeam = allTeams.find(t => !userTeams.some(ut => ut.teamId === t.id));
        if (newTeam) {
            const updatedTeams = [...userTeams, { teamId: newTeam.id, teamName: newTeam.name, userRole: 'member' }];
            setUserTeams(updatedTeams);
            onFormChange(updatedTeams);
        }
    }

    const handleRemoveTeam = (teamId: string) => {
        const updatedTeams = userTeams.filter(t => t.teamId !== teamId);
        setUserTeams(updatedTeams);
        onFormChange(updatedTeams);
    }

    const handleRoleChange = (teamId: string, newRole: 'member' | 'lead') => {
        const updatedTeams = userTeams.map(t => t.teamId === teamId ? { ...t, userRole: newRole } : t);
        setUserTeams(updatedTeams);
        onFormChange(updatedTeams);
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Team Assignments</CardTitle>
                    <CardDescription>Manage which teams this user belongs to and their role within each.</CardDescription>
                </div>
                <Button size="sm" onClick={handleAddTeam}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add to Team
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Team Name</TableHead>
                            <TableHead>Role in Team</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">Loading team data...</TableCell>
                            </TableRow>
                        ) : userTeams.map(team => (
                            <TableRow key={team.teamId}>
                                <TableCell className="font-medium">{team.teamName}</TableCell>
                                <TableCell>
                                    <Select value={team.userRole} onValueChange={(value) => handleRoleChange(team.teamId, value as 'member' | 'lead')}>
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
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveTeam(team.teamId)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                        <span className="sr-only">Remove</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                         {!loading && userTeams.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">User is not assigned to any teams.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
