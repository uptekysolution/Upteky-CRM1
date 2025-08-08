
'use client'
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";


// Define interfaces for our data structures
interface Team {
  id: string;
  name: string;
}

interface TeamMember {
  id: string; // This is the doc ID from the teamMembers collection
  userId: string;
  userName: string;
  teamRole: string;
  reportsToMemberId: string | null;
}

interface User {
  id: string;
  name: string;
}

interface Tool {
    id: string;
    name: string;
}

interface ToolAccess {
    id: string;
    teamId: string;
    toolId: string;
}

interface Project {
    id: string;
    name: string;
}

interface ProjectAssignment {
    id: string;
    projectId: string;
    teamId: string;
}


// --- Component for Roster Management ---
const RosterTab = ({ teamId, members, users }: { teamId: string, members: TeamMember[], users: User[] }) => {
    const { toast } = useToast();
    const [teamMembers, setTeamMembers] = useState(members);

    const handleAddMember = async () => {
        // Find a user not already in the team
        const newUser = users.find(u => !teamMembers.some(tm => tm.userId === u.id));
        if (!newUser) {
            toast({ variant: 'destructive', title: "No more users to add" });
            return;
        }

        try {
            const response = await fetch(`/api/admin/teams/${teamId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-User-Role': 'Admin' },
                body: JSON.stringify({ userId: newUser.id, teamRole: 'New Member' })
            });
            if (!response.ok) throw new Error("Failed to add member");
            const newMemberData = await response.json();
            
            // Note: In a real app, you'd probably want to refresh the whole member list
            // to ensure data consistency. For now, we optimistically update the state.
            setTeamMembers(prev => [...prev, { ...newMemberData, userName: newUser.name, id: newMemberData.id }]);
            toast({ title: "Member Added" });

        } catch (error) {
            toast({ variant: 'destructive', title: "Failed to add member" });
        }
    };

    const handleRemoveMember = async (memberDocId: string) => {
        try {
            const response = await fetch(`/api/admin/teams/${teamId}/members/${memberDocId}`, {
                method: 'DELETE',
                headers: { 'X-User-Role': 'Admin' },
            });
            if (!response.ok) throw new Error("Failed to remove member");
            setTeamMembers(prev => prev.filter(m => m.id !== memberDocId));
            toast({ title: "Member Removed" });
        } catch (error) {
            toast({ variant: 'destructive', title: "Failed to remove member" });
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Team Roster & Hierarchy</CardTitle>
                    <Button size="sm" onClick={handleAddMember}><PlusCircle className="mr-2 h-4 w-4"/>Add Member</Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member Name</TableHead>
                            <TableHead>Role in Team</TableHead>
                            <TableHead>Reports To</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teamMembers.map(member => (
                            <TableRow key={member.id}>
                                <TableCell>{member.userName}</TableCell>
                                <TableCell>{member.teamRole}</TableCell>
                                <TableCell>
                                    <Select defaultValue={member.reportsToMemberId || 'none'}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {teamMembers.filter(m => m.id !== member.id).map(potentialManager => (
                                                <SelectItem key={potentialManager.id} value={potentialManager.id}>{potentialManager.userName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};


// --- Component for Tool Access ---
const ToolAccessTab = ({ teamId, allTools, initialAccess }: { teamId: string, allTools: Tool[], initialAccess: ToolAccess[] }) => {
    const { toast } = useToast();
    const [toolAccess, setToolAccess] = useState<Set<string>>(new Set(initialAccess.map(a => a.toolId)));

    const handleAccessChange = async (toolId: string, checked: boolean) => {
        const url = `/api/admin/teams/${teamId}/tools${!checked ? `/${toolId}` : ''}`;
        const method = checked ? 'POST' : 'DELETE';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'X-User-Role': 'Admin' },
                ...(checked && { body: JSON.stringify({ toolId }) }),
            });
            if (!response.ok) throw new Error("Failed to update tool access");
            
            setToolAccess(prev => {
                const newSet = new Set(prev);
                if(checked) newSet.add(toolId);
                else newSet.delete(toolId);
                return newSet;
            });
            toast({ title: `Access ${checked ? 'granted' : 'revoked'}` });
        } catch (error) {
             toast({ variant: 'destructive', title: "Update failed" });
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tool Access</CardTitle>
                <CardDescription>Grant or revoke access to entire modules for this team.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allTools.map(tool => (
                    <div key={tool.id} className="flex items-center space-x-2 rounded-md border p-4">
                        <Checkbox
                            id={`tool-${tool.id}`}
                            checked={toolAccess.has(tool.id)}
                            onCheckedChange={(checked) => handleAccessChange(tool.id, !!checked)}
                        />
                        <label htmlFor={`tool-${tool.id}`} className="text-sm font-medium leading-none">
                            {tool.name}
                        </label>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

// --- Component for Project Assignments ---
const AssignedProjectsTab = ({ teamId, allProjects, initialAssignments }: { teamId: string, allProjects: Project[], initialAssignments: ProjectAssignment[] }) => {
    const {toast} = useToast();
    const [assignedProjects, setAssignedProjects] = useState(new Set(initialAssignments.map(a => a.projectId)));
    
    const handleUnassign = async (projectId: string) => {
        try {
            const response = await fetch('/api/internal/project-assignments', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'X-User-Role': 'Admin' },
                body: JSON.stringify({ teamId, projectId })
            });
            if (!response.ok) throw new Error("Failed to unassign project");
            setAssignedProjects(prev => {
                const newSet = new Set(prev);
                newSet.delete(projectId);
                return newSet;
            });
            toast({ title: "Project Unassigned" });
        } catch (error) {
            toast({ variant: 'destructive', title: "Unassignment failed" });
        }
    };

    const handleAssignment = async (projectId: string) => {
        try {
            const response = await fetch('/api/internal/project-assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-User-Role': 'Admin' },
                body: JSON.stringify({ teamId, projectId })
            });
            if (!response.ok) throw new Error("Failed to assign project");
            setAssignedProjects(prev => new Set(prev).add(projectId));
            toast({ title: "Project Assigned" });
        } catch (error) {
            toast({ variant: 'destructive', title: "Assignment failed" });
        }
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Assigned Projects</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <Select onValueChange={handleAssignment}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Assign team to a new project..." />
                        </SelectTrigger>
                        <SelectContent>
                            {allProjects.filter(p => !assignedProjects.has(p.id)).map(project => (
                                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project Name</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from(assignedProjects).map(projectId => {
                            const project = allProjects.find(p => p.id === projectId);
                            return (
                                <TableRow key={projectId}>
                                    <TableCell>{project?.name || 'Unknown Project'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleUnassign(projectId)}>Unassign</Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};


// --- Main Page Component ---
export default function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
    const { teamId } = use(params);
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [tools, setTools] = useState<Tool[]>([]);
    const [toolAccess, setToolAccess] = useState<ToolAccess[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([]);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // This is a placeholder for a real user fetch
                 const allUsers = [
                    { id: 'user-admin', name: 'Admin User' },
                    { id: 'user-tl-john', name: 'John Doe' },
                    { id: 'user-emp-jane', name: 'Jane Smith' },
                    { id: 'user-hr-peter', name: 'Peter Jones'},
                    { id: 'user-subadmin', name: 'Sub Admin'},
                    { id: 'user-hr-alisha', name: 'Alisha Anand'},
                    { id: 'user-bd-alex', name: 'Alex Ray'},
                    { id: 'user-bd-sam', name: 'Sam Wilson'},
                ];
                // This is a placeholder for a real tools fetch
                const allTools = [
                    {id: 'Tasks', name: 'Tasks'}, {id: 'Timesheet', name: 'Timesheet'}, {id: 'CRM', name: 'CRM'}, {id: 'Payroll', name: 'Payroll'}
                ];

                const [membersRes, projectsRes, projectAssignmentsRes, toolAccessRes] = await Promise.all([
                    fetch(`/api/admin/teams/${teamId}/members`, { headers: { 'X-User-Role': 'Admin' } }),
                    fetch(`/api/admin/projects`, { headers: { 'X-User-Role': 'Admin' } }),
                    fetch(`/api/internal/project-assignments?teamId=${teamId}`, { headers: { 'X-User-Role': 'Admin' } }),
                    fetch(`/api/admin/teams/${teamId}/tools`, { headers: { 'X-User-Role': 'Admin' } })
                ]);
                
                const membersData = await membersRes.json();
                const populatedMembers = membersData.map((m: any) => ({
                    ...m,
                    userName: allUsers.find((u: User) => u.id === m.userId)?.name || 'Unknown User'
                }));

                setMembers(populatedMembers);
                setUsers(allUsers);
                setTools(allTools);
                setToolAccess(await toolAccessRes.json());
                setProjects(await projectsRes.json());
                setProjectAssignments(await projectAssignmentsRes.json());

            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: "Failed to load team data" });
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
        
    }, [teamId, toast]);

    if (loading) return <div><Loader2 className="animate-spin" /> Loading...</div>;


    return (
        <div className="space-y-4">
             <div>
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/admin/teams-projects">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Hub
                    </Link>
                </Button>
            </div>
            <h1 className="text-2xl font-bold">Manage Team: {team?.name || '...'}</h1>
            <Tabs defaultValue="roster">
                <TabsList>
                    <TabsTrigger value="roster">Roster & Hierarchy</TabsTrigger>
                    <TabsTrigger value="tool-access">Tool Access</TabsTrigger>
                    <TabsTrigger value="projects">Assigned Projects</TabsTrigger>
                </TabsList>
                <TabsContent value="roster">
                    <RosterTab teamId={teamId} members={members} users={users} />
                </TabsContent>
                <TabsContent value="tool-access">
                    <ToolAccessTab teamId={teamId} allTools={tools} initialAccess={toolAccess} />
                </TabsContent>
                <TabsContent value="projects">
                    <AssignedProjectsTab teamId={teamId} allProjects={projects} initialAssignments={projectAssignments} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
