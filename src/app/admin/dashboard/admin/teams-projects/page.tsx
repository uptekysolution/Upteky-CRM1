
'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ManageProjectModal from "./ManageProjectModal";

interface Team {
  id: string;
  name: string;
  description: string;
  teamType: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
}

const TableSkeleton = () => (
    Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
            <TableCell><Skeleton className="h-5 w-64" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
    ))
)


export default function TeamsProjectsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState({ teams: true, projects: true });
    const [isSeeding, setIsSeeding] = useState({ teams: false, projects: false });
    
    // Modal states
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [creating, setCreating] = useState({ team: false, project: false });
    const [showManageProject, setShowManageProject] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    
    // Form data
    const [teamForm, setTeamForm] = useState({
        name: '',
        description: '',
        teamType: ''
    });
    
    const [projectForm, setProjectForm] = useState({
        name: '',
        description: '',
        status: ''
    });

    const fetchData = async (type: 'teams' | 'projects') => {
        setLoading(prev => ({ ...prev, [type]: true }));
        try {
            const response = await fetch(`/api/admin/${type}`, {
                headers: { 'X-User-Role': 'Admin' }
            });
            if (!response.ok) throw new Error(`Failed to fetch ${type}`);
            const data = await response.json();
            if (type === 'teams') setTeams(data);
            if (type === 'projects') setProjects(data);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: `Error fetching ${type}` });
        } finally {
            setLoading(prev => ({ ...prev, [type]: false }));
        }
    }

    useEffect(() => {
        fetchData('teams');
        fetchData('projects');
    }, []);

    const handleSeed = async (type: 'teams' | 'projects') => {
        setIsSeeding(prev => ({...prev, [type]: true}));
        try {
            const response = await fetch(`/api/admin/seed/${type}`, {
                method: 'POST',
                headers: { 'X-User-Role': 'Admin' }
            });
            if (!response.ok) throw new Error(`Failed to seed ${type}`);
            toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Seeded`, description: `Initial ${type} data has been loaded.` });
            await fetchData(type); // Refresh data after seeding
        } catch (error) {
            toast({ variant: 'destructive', title: `Error seeding ${type}` });
        } finally {
            setIsSeeding(prev => ({...prev, [type]: false}));
        }
    }

    const handleCreateTeam = async () => {
        if (!teamForm.name || !teamForm.teamType) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Name and team type are required.' });
            return;
        }

        setCreating(prev => ({ ...prev, team: true }));
        try {
            const response = await fetch('/api/admin/teams', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-User-Role': 'Admin' 
                },
                body: JSON.stringify(teamForm)
            });

            if (!response.ok) throw new Error('Failed to create team');
            
            const newTeam = await response.json();
            setTeams(prev => [...prev, newTeam]);
            setShowTeamModal(false);
            setTeamForm({ name: '', description: '', teamType: '' });
            toast({ title: 'Team Created', description: 'New team has been created successfully.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create team.' });
        } finally {
            setCreating(prev => ({ ...prev, team: false }));
        }
    };

    const handleCreateProject = async () => {
        if (!projectForm.name || !projectForm.status) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Name and status are required.' });
            return;
        }

        setCreating(prev => ({ ...prev, project: true }));
        try {
            const response = await fetch('/api/admin/projects', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-User-Role': 'Admin' 
                },
                body: JSON.stringify(projectForm)
            });

            if (!response.ok) throw new Error('Failed to create project');
            
            const newProject = await response.json();
            setProjects(prev => [...prev, newProject]);
            setShowProjectModal(false);
            setProjectForm({ name: '', description: '', status: '' });
            toast({ title: 'Project Created', description: 'New project has been created successfully.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create project.' });
        } finally {
            setCreating(prev => ({ ...prev, project: false }));
        }
    };

    return (
        <>
        <Tabs defaultValue="teams">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold">Team & Project Hub</h1>
                    <p className="text-muted-foreground">Centrally manage all teams and projects.</p>
                </div>
                <TabsList>
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="teams">
                <Card>
                    <CardHeader>
                         <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Teams</CardTitle>
                                <CardDescription>Manage all teams across the organization.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleSeed('teams')} disabled={isSeeding.teams}>
                                    {isSeeding.teams ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isSeeding.teams ? 'Seeding...' : 'Seed Teams'}
                                </Button>
                                <Button size="sm" onClick={() => setShowTeamModal(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Team
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading.teams ? <TableSkeleton /> : teams.map(team => (
                                    <TableRow key={team.id}>
                                        <TableCell className="font-medium">{team.name}</TableCell>
                                        <TableCell>{team.description}</TableCell>
                                        <TableCell>{team.teamType}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/dashboard/admin/teams/${team.id}`)}>
                                                Manage
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="projects">
                 <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Projects</CardTitle>
                                <CardDescription>Manage all company projects.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleSeed('projects')} disabled={isSeeding.projects}>
                                     {isSeeding.projects ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isSeeding.projects ? 'Seeding...' : 'Seed Projects'}
                                </Button>
                                <Button size="sm" onClick={() => setShowProjectModal(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Project
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {loading.projects ? <TableSkeleton /> : projects.map(project => (
                                    <TableRow key={project.id}>
                                        <TableCell className="font-medium">{project.name}</TableCell>
                                        <TableCell>{project.description}</TableCell>
                                        <TableCell>{project.status}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => { setSelectedProject(project); setShowManageProject(true); }}>
                                                Manage
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        {/* Create Team Modal */}
        <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                    <DialogDescription>
                        Add a new team to the organization. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="team-name">Team Name *</Label>
                        <Input
                            id="team-name"
                            value={teamForm.name}
                            onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter team name"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="team-description">Description</Label>
                        <Textarea
                            id="team-description"
                            value={teamForm.description}
                            onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter team description"
                            rows={3}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="team-type">Team Type *</Label>
                        <Select value={teamForm.teamType} onValueChange={(value) => setTeamForm(prev => ({ ...prev, teamType: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select team type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Department">Department</SelectItem>
                                <SelectItem value="Project">Project</SelectItem>
                                <SelectItem value="Task Force">Task Force</SelectItem>
                                <SelectItem value="Committee">Committee</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowTeamModal(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreateTeam} disabled={creating.team}>
                        {creating.team && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Team
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Create Project Modal */}
        <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Add a new project to the organization. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="project-name">Project Name *</Label>
                        <Input
                            id="project-name"
                            value={projectForm.name}
                            onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter project name"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="project-description">Description</Label>
                        <Textarea
                            id="project-description"
                            value={projectForm.description}
                            onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter project description"
                            rows={3}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="project-status">Status *</Label>
                        <Select value={projectForm.status} onValueChange={(value) => setProjectForm(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select project status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Planning">Planning</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="On Hold">On Hold</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowProjectModal(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreateProject} disabled={creating.project}>
                        {creating.project && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Project
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <ManageProjectModal
            open={showManageProject}
            onOpenChange={setShowManageProject}
            project={selectedProject}
            onSave={async (updated: Project) => {
                // Update in backend
                const response = await fetch(`/api/admin/projects/${updated.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Role': 'Admin',
                    },
                    body: JSON.stringify(updated),
                });
                if (!response.ok) throw new Error('Failed to update project');
                setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
                toast({ title: 'Project updated', description: 'Project details have been updated.' });
            }}
        />
        </>
    )
}
