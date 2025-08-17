
'use client'

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PlusCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Client {
  id: string;
  name: string;
  status: string;
  createdAt: {
    toDate: () => Date;
  } | Date;
}

export default function ClientsDashboardPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New state for modals/actions
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalType, setModalType] = useState<'details'|'contacts'|'ticket'|null>(null);
  const [details, setDetails] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '' });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  // State for the new client form
  const [companyName, setCompanyName] = useState('');
  const [status, setStatus] = useState('Active');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/internal/crm/clients', {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'Admin'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error fetching clients',
        description: 'Could not load client data from the database.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);
  
  const resetForm = () => {
      setCompanyName('');
      setStatus('Active');
      setWebsite('');
      setAddress('');
  }

  const handleCreateClient = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, email, status, website, address })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create client');
      }
      
      const result = await response.json();
      setClients((prev) => {
        const next = prev.slice();
        const idx = next.findIndex(c => c.id === result.clientId);
        const newEntry = { id: result.clientId, name: companyName, status, createdAt: new Date() as any } as Client;
        if (idx >= 0) {
          next[idx] = { ...next[idx], ...newEntry };
          return next;
        }
        next.push(newEntry);
        return next;
      });
      toast({ title: "Client Created", description: result.message });
      setIsDialogOpen(false);
      resetForm();

    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not create the new client.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for actions
  const handleViewDetails = useCallback(async (client: Client) => {
    setSelectedClient(client);
    setModalType('details');
    setDetails(null);
    try {
      const res = await fetch(`/api/internal/crm/clients/${client.id}`, {
        headers: { 'X-User-Role': 'Admin' }
      });
      if (!res.ok) throw new Error('Failed to fetch client details');
      setDetails(await res.json());
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }, [toast]);

  const handleManageContacts = useCallback(async (client: Client) => {
    setSelectedClient(client);
    setModalType('contacts');
    setContacts([]);
    try {
      const res = await fetch(`/api/internal/crm/clients/${client.id}/contacts`, {
        headers: { 'X-User-Role': 'Admin' }
      });
      if (!res.ok) throw new Error('Failed to fetch contacts');
      setContacts(await res.json());
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  }, [toast]);

  const handleCreateTicket = useCallback((client: Client) => {
    setSelectedClient(client);
    setModalType('ticket');
    setTicketForm({ subject: '', description: '' });
  }, []);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setTicketSubmitting(true);
    try {
      const res = await fetch('/api/internal/crm/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Role': 'Admin' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          subject: ticketForm.subject,
          description: ticketForm.description,
        })
      });
      if (!res.ok) throw new Error('Failed to create ticket');
      toast({ title: 'Ticket Created', description: 'A new ticket has been created.' });
      setModalType(null);
      setSelectedClient(null);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setTicketSubmitting(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'prospect':
        return 'secondary';
      case 'former':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Client Management</CardTitle>
            <CardDescription>View and manage all client accounts.</CardDescription>
          </div>
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Add New Client</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Client Profile</DialogTitle>
                <DialogDescription>
                  Fill in the details below to add a new client to the system.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company-name" className="text-right">
                    Company Name
                  </Label>
                  <Input 
                    id="company-name" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="col-span-3" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="col-span-3" 
                    placeholder="client@company.com"
                  />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                   <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prospect">Prospect</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Former">Former Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="website" className="text-right">
                    Website
                  </Label>
                  <Input 
                    id="website" 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="col-span-3" 
                    placeholder="https://example.com"
                  />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address
                  </Label>
                  <Textarea 
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="col-span-3"
                    placeholder="123 Main St, Anytown, USA"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" onClick={handleCreateClient} disabled={!companyName || !email || isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Client
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-16" />
                  </TableCell>
                </TableRow>
              ))
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No clients found. Try adding one.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(client.status)}>{client.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      if (client.createdAt && typeof client.createdAt === 'object' && 'toDate' in client.createdAt) {
                        const d = new Date(client.createdAt.toDate());
                        return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
                      }
                      if (client.createdAt) {
                        const d = new Date(client.createdAt as any);
                        return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
                      }
                      return '';
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleViewDetails(client)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageContacts(client)}>Manage Contacts</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateTicket(client)}>Create Ticket</DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      {/* Modals for actions */}
      {/* View Details Modal */}
      {modalType === 'details' && selectedClient && (
        <Dialog open onOpenChange={() => { setModalType(null); setSelectedClient(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Client Details</DialogTitle>
            </DialogHeader>
            {details ? (
              <div className="space-y-2">
                <div><b>Name:</b> {details.name}</div>
                <div><b>Status:</b> {details.status}</div>
                <div><b>Website:</b> {details.website}</div>
                <div><b>Address:</b> {details.address?.fullAddress}</div>
                <div><b>Created At:</b> {details.createdAt ? new Date(details.createdAt).toLocaleString() : ''}</div>
              </div>
            ) : <Loader2 className="animate-spin" />}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setModalType(null); setSelectedClient(null); }}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Manage Contacts Modal */}
      {modalType === 'contacts' && selectedClient && (
        <Dialog open onOpenChange={() => { setModalType(null); setSelectedClient(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Contacts</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {contacts.length === 0 ? (
                <div>No contacts found for this client.</div>
              ) : contacts.map((contact, idx) => (
                <div key={idx} className="border rounded p-2">
                  <div><b>Name:</b> {contact.name}</div>
                  <div><b>Email:</b> {contact.email}</div>
                  <div><b>Phone:</b> {contact.phone}</div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setModalType(null); setSelectedClient(null); }}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Create Ticket Modal */}
      {modalType === 'ticket' && selectedClient && (
        <Dialog open onOpenChange={() => { setModalType(null); setSelectedClient(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Ticket for {selectedClient.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitTicket} className="space-y-3">
              <Input placeholder="Subject" value={ticketForm.subject} onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))} required />
              <Textarea placeholder="Description" value={ticketForm.description} onChange={e => setTicketForm(f => ({ ...f, description: e.target.value }))} required />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => { setModalType(null); setSelectedClient(null); }}>Cancel</Button>
                <Button type="submit" disabled={ticketSubmitting}>{ticketSubmitting ? <Loader2 className="animate-spin" /> : 'Create Ticket'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
