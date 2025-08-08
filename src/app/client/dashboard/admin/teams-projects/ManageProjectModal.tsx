import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Upload, FileText, Users, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import React from "react";

const formatFirestoreTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
  }
  if (timestamp && typeof timestamp === 'object' && ('_seconds' in timestamp || 'seconds' in timestamp)) {
      const seconds = timestamp.seconds || timestamp._seconds;
      return new Date(seconds * 1000).toLocaleString();
  }
  return 'Invalid Date';
};

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignee: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  projectId: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  teamType: string;
}

interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  projectId: string;
}

interface Activity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  projectId: string;
}

interface ManageProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSave: (updated: Project) => void;
  loading?: boolean;
}

export default function ManageProjectModal({ open, onOpenChange, project, onSave, loading }: ManageProjectModalProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState("details");
  const [form, setForm] = useState<Project>(project || { id: '', name: '', description: '', status: '' });
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState({ tasks: false, teams: false, files: false, activity: false });

  // Real data from API
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignedTeams, setAssignedTeams] = useState<Team[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Form states
  const [newTask, setNewTask] = useState({ title: '', description: '', assignee: '', dueDate: '', priority: 'medium' as const });
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskForm, setEditTaskForm] = useState<{ title: string; description: string; assignee: string; dueDate: string; priority: Task['priority']; }>({ title: '', description: '', assignee: '', dueDate: '', priority: 'medium' });

  // Sync form with project prop
  React.useEffect(() => {
    if (project) setForm(project);
  }, [project]);

  // Fetch data when project changes
  useEffect(() => {
    if (project?.id && open) {
      fetchTasks();
      fetchTeams();
      fetchFiles();
      fetchActivity();
    }
  }, [project?.id, open]);

  const fetchTasks = async () => {
    if (!project?.id) return;
    setDataLoading(prev => ({ ...prev, tasks: true }));
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/tasks`, {
        headers: { 'X-User-Role': 'Admin' }
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch tasks' });
    } finally {
      setDataLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  const fetchTeams = async () => {
    if (!project?.id) return;
    setDataLoading(prev => ({ ...prev, teams: true }));
    try {
      // Fetch all teams and project assignments
      const [teamsResponse, assignmentsResponse] = await Promise.all([
        fetch('/api/admin/teams', { 
          headers: { 'X-User-Role': 'Admin' }
        }),
        fetch(`/api/internal/project-assignments?projectId=${project.id}`, { 
          headers: { 'X-User-Role': 'Admin' }
        })
      ]);
      
      if (!teamsResponse.ok) throw new Error('Failed to fetch teams');
      const allTeams = await teamsResponse.json();
      
      // Get assignments for this project
      let assignments = [];
      if (assignmentsResponse.ok) {
        assignments = await assignmentsResponse.json();
      }
      
      const assignedTeamIds = assignments.map((a: any) => a.teamId);
      const assignedTeams = allTeams.filter((team: Team) => assignedTeamIds.includes(team.id));
      const availableTeams = allTeams.filter((team: Team) => !assignedTeamIds.includes(team.id));
      
      setAssignedTeams(assignedTeams);
      setAvailableTeams(availableTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch teams' });
    } finally {
      setDataLoading(prev => ({ ...prev, teams: false }));
    }
  };

  const fetchFiles = async () => {
    if (!project?.id) return;
    setDataLoading(prev => ({ ...prev, files: true }));
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/files`, {
        headers: { 'X-User-Role': 'Admin' }
      });
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch files' });
    } finally {
      setDataLoading(prev => ({ ...prev, files: false }));
    }
  };

  const fetchActivity = async () => {
    if (!project?.id) return;
    setDataLoading(prev => ({ ...prev, activity: true }));
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/activity`, {
        headers: { 'X-User-Role': 'Admin' }
      });
      if (!response.ok) throw new Error('Failed to fetch activity');
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activity:', error);
      // For now, show empty activity if the endpoint doesn't exist
      setActivities([]);
    } finally {
      setDataLoading(prev => ({ ...prev, activity: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async () => {
    if (!project?.id || !newTask.title || !newTask.assignee) return;
    
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': 'Admin' 
        },
        body: JSON.stringify(newTask)
      });

      if (!response.ok) throw new Error('Failed to create task');
      
      const createdTask = await response.json();
      setTasks(prev => [...prev, createdTask]);
      setNewTask({ title: '', description: '', assignee: '', dueDate: '', priority: 'medium' });
      setShowAddTask(false);
      toast({ title: 'Task Created', description: 'New task has been added to the project' });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create task' });
    }
  };

  const handleEditTaskSave = async () => {
    if (!project?.id || !editingTask) return;
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'Admin'
        },
        body: JSON.stringify(editTaskForm)
      });
      if (!response.ok) throw new Error('Failed to update task');
      setTasks(prev => prev.map(task => task.id === editingTask.id ? { ...task, ...editTaskForm } : task));
      setEditingTask(null);
      toast({ title: 'Task Updated', description: 'Task has been updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update task' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!project?.id) return;
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'X-User-Role': 'Admin' }
      });
      if (!response.ok) throw new Error('Failed to delete task');
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast({ title: 'Task Deleted', description: 'Task has been deleted.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete task' });
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: Task['status']) => {
    if (!project?.id) return;
    
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': 'Admin' 
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update task');
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update task status' });
    }
  };

  const handleAssignTeam = async (teamId: string) => {
    if (!project?.id) return;
    
    try {
      const response = await fetch('/api/internal/project-assignments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': 'Admin' 
        },
        body: JSON.stringify({ projectId: project.id, teamId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign team');
      }
      
      const team = availableTeams.find(t => t.id === teamId);
      if (team) {
        setAssignedTeams(prev => [...prev, team]);
        setAvailableTeams(prev => prev.filter(t => t.id !== teamId));
        toast({ title: 'Team Assigned', description: 'Team has been assigned to the project' });
      }
    } catch (error) {
      console.error('Error assigning team:', error);
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to assign team' });
    }
  };

  const handleUnassignTeam = async (teamId: string) => {
    if (!project?.id) return;
    
    try {
      const response = await fetch('/api/internal/project-assignments', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': 'Admin' 
        },
        body: JSON.stringify({ projectId: project.id, teamId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unassign team');
      }
      
      const team = assignedTeams.find(t => t.id === teamId);
      if (team) {
        setAvailableTeams(prev => [...prev, team]);
        setAssignedTeams(prev => prev.filter(t => t.id !== teamId));
        toast({ title: 'Team Unassigned', description: 'Team has been removed from the project' });
      }
    } catch (error) {
      console.error('Error unassigning team:', error);
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to unassign team' });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !project?.id) return;
    
    try {
      const fileData = {
        name: file.name,
        type: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedBy: 'Current User',
      };

      const response = await fetch(`/api/admin/projects/${project.id}/files`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': 'Admin' 
        },
        body: JSON.stringify(fileData)
      });

      if (!response.ok) throw new Error('Failed to upload file');
      
      const createdFile = await response.json();
      setFiles(prev => [...prev, createdFile]);
      toast({ title: 'File Uploaded', description: 'File has been uploaded successfully' });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload file' });
    }
  };

  const handleFileDownload = async (fileId: string, fileName: string) => {
    if (!project?.id) return;
    
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/files/${fileId}`, {
        headers: { 'X-User-Role': 'Admin' }
      });
      
      if (response.ok) {
        const fileData = await response.json();
        
        // In a real application, you would:
        // 1. Get the actual file from storage
        // 2. Create a blob and download it
        // For now, we'll create a mock download
        
        const blob = new Blob(['Mock file content'], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download started",
          description: `${fileName} is being downloaded.`,
        });
      } else {
        toast({
          title: "Download failed",
          description: "Failed to download file. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "An error occurred while downloading the file.",
        variant: "destructive",
      });
    }
  };

  const handleFileDelete = async (fileId: string, fileName: string) => {
    if (!project?.id) return;
    
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/projects/${project.id}/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'X-User-Role': 'Admin' }
      });
      
      if (response.ok) {
        await fetchFiles();
        toast({
          title: "File deleted successfully",
          description: `${fileName} has been deleted from the project.`,
        });
      } else {
        toast({
          title: "Delete failed",
          description: "Failed to delete file. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete failed",
        description: "An error occurred while deleting the file.",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Project: {project?.name}</DialogTitle>
          <DialogDescription>Edit project details, manage tasks, teams, files, and view activity.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Enter project name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-status">Status</Label>
                <Select value={form.status} onValueChange={value => setForm(f => ({ ...f, status: value }))}>
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
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || loading}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="tasks">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Project Tasks</h3>
                <Button size="sm" onClick={() => setShowAddTask(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>

              {dataLoading.tasks && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading tasks...</span>
                </div>
              )}

              {showAddTask && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">Add New Task</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Task Title</Label>
                      <Input
                        value={newTask.title}
                        onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter task title"
                      />
                    </div>
                    <div>
                      <Label>Assignee</Label>
                      <Input
                        value={newTask.assignee}
                        onChange={e => setNewTask(prev => ({ ...prev, assignee: e.target.value }))}
                        placeholder="Enter assignee name"
                      />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={newTask.dueDate}
                        onChange={e => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select value={newTask.priority} onValueChange={value => setNewTask(prev => ({ ...prev, priority: value as any }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newTask.description}
                      onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter task description"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddTask}>Add Task</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {editingTask && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">Edit Task</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Task Title</Label>
                      <Input
                        value={editTaskForm.title}
                        onChange={e => setEditTaskForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter task title"
                      />
                    </div>
                    <div>
                      <Label>Assignee</Label>
                      <Input
                        value={editTaskForm.assignee}
                        onChange={e => setEditTaskForm(prev => ({ ...prev, assignee: e.target.value }))}
                        placeholder="Enter assignee name"
                      />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={editTaskForm.dueDate}
                        onChange={e => setEditTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select value={editTaskForm.priority} onValueChange={value => setEditTaskForm(prev => ({ ...prev, priority: value as any }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editTaskForm.description}
                      onChange={e => setEditTaskForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter task description"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEditTaskSave}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
                  </div>
                </div>
              )}

              {!dataLoading.tasks && tasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No tasks found for this project
                </div>
              )}

              {!dataLoading.tasks && tasks.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map(task => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <Select value={task.status} onValueChange={value => handleTaskStatusChange(task.id, value as Task['status'])}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm text-gray-500">{task.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{task.assignee}</TableCell>
                        <TableCell>{formatFirestoreTimestamp(task.dueDate)}</TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingTask(task);
                            setEditTaskForm({
                              title: task.title,
                              description: task.description,
                              assignee: task.assignee,
                              dueDate: task.dueDate,
                              priority: task.priority,
                            });
                          }}>Edit</Button>
                          <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDeleteTask(task.id)}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="teams">
            <div className="space-y-6">
              {dataLoading.teams && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading teams...</span>
                </div>
              )}

              {!dataLoading.teams && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Assigned Teams</h3>
                    <div className="grid gap-4">
                      {assignedTeams.map(team => (
                        <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="text-sm text-gray-500">{team.description}</div>
                            <Badge variant="secondary">{team.teamType}</Badge>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleUnassignTeam(team.id)}>
                            Unassign
                          </Button>
                        </div>
                      ))}
                      {assignedTeams.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No teams assigned to this project
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Available Teams</h3>
                    <div className="grid gap-4">
                      {availableTeams.map(team => (
                        <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="text-sm text-gray-500">{team.description}</div>
                            <Badge variant="secondary">{team.teamType}</Badge>
                          </div>
                          <Button size="sm" onClick={() => handleAssignTeam(team.id)}>
                            Assign
                          </Button>
                        </div>
                      ))}
                      {availableTeams.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          All teams are already assigned
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="files">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Project Files</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <label>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </Button>
                </div>
              </div>

              {dataLoading.files && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading files...</span>
                </div>
              )}

              {!dataLoading.files && files.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No files uploaded for this project
                </div>
              )}

              {!dataLoading.files && files.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map(file => (
                      <TableRow key={file.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{file.type}</Badge>
                        </TableCell>
                        <TableCell>{file.size}</TableCell>
                        <TableCell>{file.uploadedBy}</TableCell>
                        <TableCell>{formatFirestoreTimestamp(file.uploadedAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleFileDownload(file.id, file.name)}
                            >
                              Download
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleFileDelete(file.id, file.name)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Project Activity</h3>
              </div>

              {dataLoading.activity && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading activity...</span>
                </div>
              )}

              {!dataLoading.activity && activities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No activity found for this project
                </div>
              )}

              {!dataLoading.activity && activities.length > 0 && (
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{activity.action}</span>
                          <span className="text-sm text-gray-500">by {activity.user}</span>
                        </div>
                        <div className="text-sm text-gray-600">{activity.details}</div>
                        <div className="text-xs text-gray-400 mt-1">{formatFirestoreTimestamp(activity.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}