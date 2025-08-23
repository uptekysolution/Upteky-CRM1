'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Calendar, Users, Check } from 'lucide-react'
import { Project } from '@/lib/project-service'
import { useToast } from '@/hooks/use-toast'

interface AssignProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  onProjectAssigned: () => void
}

interface AvailableProject extends Project {
  assigned: boolean
}

export function AssignProjectModal({ 
  open, 
  onOpenChange, 
  clientId, 
  onProjectAssigned 
}: AssignProjectModalProps) {
  const { toast } = useToast()
  const [projects, setProjects] = useState<AvailableProject[]>([])
  const [filteredProjects, setFilteredProjects] = useState<AvailableProject[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [assigning, setAssigning] = useState<string | null>(null)

  const loadAvailableProjects = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all projects that don't have a clientId assigned
      const response = await fetch('/api/internal/projects?unassigned=true', {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'Admin',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to load projects')
      }
      
      const allProjects = await response.json()
      
      // Filter out projects that already have a clientId
      const availableProjects = allProjects
        .filter((project: any) => !project.clientId)
        .map((project: any) => ({
          ...project,
          assigned: false
        }))
      
      setProjects(availableProjects)
      setFilteredProjects(availableProjects)
    } catch (error) {
      console.error('Error loading projects:', error)
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to load available projects' 
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (open) {
      loadAvailableProjects()
    }
  }, [open, loadAvailableProjects])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProjects(projects)
    } else {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.status.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProjects(filtered)
    }
  }, [searchTerm, projects])

  const handleAssignProject = async (projectId: string) => {
    setAssigning(projectId)
    try {
      const response = await fetch(`/api/internal/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'Admin',
        },
        body: JSON.stringify({ clientId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to assign project')
      }
      
      // Update local state
      setProjects(prev => prev.filter(p => p.id !== projectId))
      setFilteredProjects(prev => prev.filter(p => p.id !== projectId))
      
      toast({ title: 'Project assigned successfully' })
      onProjectAssigned()
    } catch (error) {
      console.error('Error assigning project:', error)
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to assign project' 
      })
    } finally {
      setAssigning(null)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '—'
    
    try {
      let date: Date
      
      // Handle ISO string timestamps (from API)
      if (typeof timestamp === 'string' && timestamp.includes('T')) {
        date = new Date(timestamp)
      }
      // Handle Firestore Timestamp objects
      else if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
        date = timestamp.toDate()
      }
      // Handle Firestore timestamp with seconds
      else if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000)
      }
      // Handle regular Date objects
      else if (timestamp instanceof Date) {
        date = timestamp
      }
      // Handle string timestamps
      else if (typeof timestamp === 'string') {
        date = new Date(timestamp)
      }
      // Handle numeric timestamps
      else if (typeof timestamp === 'number') {
        date = new Date(timestamp)
      }
      // Fallback
      else {
        date = new Date(timestamp)
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp for date:', timestamp)
        return '—'
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date timestamp:', timestamp, error)
      return '—'
    }
  }

  return (
         <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="text-center">Assign Project to Client</DialogTitle>
         </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search projects by name, description, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Projects List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Available Projects ({filteredProjects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm ? 'No projects match your search' : 'No available projects to assign'}
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Team</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{project.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {project.assignedTeam || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(project.deadline)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleAssignProject(project.id)}
                            disabled={assigning === project.id}
                            className="gap-2"
                          >
                            {assigning === project.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Assigning...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                Assign
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
