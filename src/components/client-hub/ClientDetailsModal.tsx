'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Calendar, Clock, Users } from 'lucide-react'
import { ClientRecord } from '@/lib/client-service'
import { Project, ProjectService } from '@/lib/project-service'
import { PermissionGuard } from '@/components/permission-guard'
import { AssignProjectModal } from './AssignProjectModal'
import { useToast } from '@/hooks/use-toast'

interface ClientDetailsModalProps {
  client: ClientRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientUpdate: (updatedClient: ClientRecord) => void
}

export function ClientDetailsModal({ 
  client, 
  open, 
  onOpenChange, 
  onClientUpdate 
}: ClientDetailsModalProps) {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)

  const loadProjects = useCallback(async () => {
    if (!client?.id) return
    
    setLoading(true)
    try {
      console.log('Loading projects for client:', client.id)
      
      // Use the API endpoint instead of direct Firestore query
      const response = await fetch(`/api/internal/projects?clientId=${client.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'Admin',
        },
      })
      
      console.log('API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error(`Failed to load client projects: ${response.status}`)
      }
      
      const clientProjects = await response.json()
      console.log('Loaded projects:', clientProjects)
      
      setProjects(clientProjects)
      
      // Update client with new projects count
      if (client.projectsCount !== clientProjects.length) {
        const updatedClient = { ...client, projectsCount: clientProjects.length }
        onClientUpdate(updatedClient)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to load client projects' 
      })
    } finally {
      setLoading(false)
    }
  }, [client?.id, client?.projectsCount, onClientUpdate, toast])

  useEffect(() => {
    if (open && client?.id) {
      loadProjects()
    }
  }, [open, client?.id, loadProjects])

  const handleProjectAssigned = useCallback(async () => {
    await loadProjects()
    setShowAssignModal(false)
    toast({ title: 'Project assigned successfully' })
  }, [loadProjects, toast])

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

  const formatDateTime = (timestamp: any) => {
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
        console.warn('Invalid timestamp:', timestamp)
        return '—'
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting timestamp:', timestamp, error)
      return '—'
    }
  }

  if (!client) return null

  return (
    <>
             <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle className="text-center">Client Details</DialogTitle>
           </DialogHeader>
          
          <div className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Name</div>
                    <div className="font-medium">{client.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Website</div>
                    <div>{client.website || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Contact Email</div>
                    <div>{client.email || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge variant="outline">{client.status || 'Prospect'}</Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Industry</div>
                    <div>{client.industry || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Projects Count</div>
                    <div className="font-medium">{projects.length}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div>{client.description || '—'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projects Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Projects ({projects.length})</CardTitle>
                <PermissionGuard requiredPermission="clients:view">
                  <Button 
                    size="sm" 
                    onClick={() => setShowAssignModal(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Assign Project
                  </Button>
                </PermissionGuard>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">No projects assigned yet</div>
                    <PermissionGuard requiredPermission="clients:view">
                      <Button onClick={() => setShowAssignModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Project
                      </Button>
                    </PermissionGuard>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned Team</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                                             {projects.map((project) => (
                         <TableRow key={project.id}>
                           <TableCell className="font-medium">{project.name}</TableCell>
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
                             <div className="flex items-center gap-2">
                               <Clock className="h-4 w-4 text-muted-foreground" />
                               {formatDateTime(project.createdAt)}
                             </div>
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

      {/* Assign Project Modal */}
      <AssignProjectModal
        open={showAssignModal}
        onOpenChange={setShowAssignModal}
        clientId={client.id}
        onProjectAssigned={handleProjectAssigned}
      />
    </>
  )
}
