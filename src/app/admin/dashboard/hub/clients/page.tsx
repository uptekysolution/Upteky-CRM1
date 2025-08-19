
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlusCircle, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ClientFilters, FilterState } from '@/components/client-hub/ClientFilters'
import { ClientForm, ClientFormValues } from '@/components/client-hub/ClientForm'
import { ClientRecord, createClient, deleteClient, listClients, updateClient } from '@/lib/client-service'

export default function ClientsDashboardPage() {
  const { toast } = useToast()
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filters, setFilters] = useState<FilterState>({ search: '', status: '', industry: '', from: '' })
  const [modalMode, setModalMode] = useState<null | 'create' | 'edit' | 'view'>(null)
  const [selected, setSelected] = useState<ClientRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listClients(filters)
      setClients(data as ClientRecord[])
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error loading clients', description: e.message })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  useEffect(() => {
    void load()
  }, [load])

  const getStatusVariant = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'default'
      case 'prospect':
        return 'secondary'
      case 'inactive':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const handleCreate = async (values: ClientFormValues) => {
    setSubmitting(true)
    try {
      const created = await createClient(values)
      setClients((prev) => [created, ...prev])
      setModalMode(null)
      toast({ title: 'Client created' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Create failed', description: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (values: ClientFormValues) => {
    if (!selected) return
    setSubmitting(true)
    try {
      const updated = await updateClient(selected.id, values)
      setClients((prev) => prev.map((c) => (c.id === updated.id ? (updated as ClientRecord) : c)))
      setModalMode(null)
      setSelected(null)
      toast({ title: 'Client updated' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (row: ClientRecord) => {
    try {
      await deleteClient(row.id)
      setClients((prev) => prev.filter((c) => c.id !== row.id))
      toast({ title: 'Client deleted' })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: e.message })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Client Management</CardTitle>
            <CardDescription>Manage clients, contacts, and communication history.</CardDescription>
          </div>
          <Dialog open={modalMode === 'create'} onOpenChange={(o) => setModalMode(o ? 'create' : null)}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Add Client</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Client</DialogTitle>
              </DialogHeader>
              <ClientForm onSubmit={handleCreate} onCancel={() => setModalMode(null)} submitting={submitting} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-4">
          <ClientFilters value={filters} onChange={setFilters} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">No clients found</TableCell>
              </TableRow>
            ) : (
              clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.logoUrl || ''} alt={c.name} />
                        <AvatarFallback>{(c.firstName || c.name || '?').substring(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div>{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.website}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{c.email || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">{c.phone || ''}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(c.status)}>{c.status || 'Prospect'}</Badge>
                  </TableCell>
                  <TableCell>{c.industry || 'N/A'}</TableCell>
                  <TableCell>{c.projectsCount ?? 0}</TableCell>
                  <TableCell>
                    {c.lastContactAt ? new Date(String((c as any).lastContactAt.seconds ? (c as any).lastContactAt.toDate() : c.lastContactAt)).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => { setSelected(c); setModalMode('view') }}>View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelected(c); setModalMode('edit') }}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void handleDelete(c)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* View Modal */}
      <Dialog open={modalMode === 'view'} onOpenChange={(o) => { if (!o) { setModalMode(null); setSelected(null) } }}>
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{selected.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-medium">{selected.status}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div>{selected.email || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div>{selected.phone || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Industry</div>
                <div>{selected.industry || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Website</div>
                <div>{selected.website || '—'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-muted-foreground">Description</div>
                <div>{selected.description || '—'}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={modalMode === 'edit'} onOpenChange={(o) => { if (!o) { setModalMode(null); setSelected(null) } }}>
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          {selected && (
            <ClientForm
              initial={{
                firstName: selected.firstName,
                lastName: selected.lastName,
                email: selected.email,
                phone: selected.phone,
                position: selected.position,
                industry: selected.industry,
                website: selected.website,
                status: selected.status,
                description: selected.description,
                logoUrl: selected.logoUrl,
              }}
              onSubmit={handleUpdate}
              onCancel={() => { setModalMode(null); setSelected(null) }}
              submitting={submitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
