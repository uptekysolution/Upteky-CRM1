
'use client'
import { useState, useEffect } from "react";
import { PlusCircle, ThumbsUp, X, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const currentUser = { id: "user-tl-john", name: "John Doe", role: "Team Lead" };

interface TimesheetEntry {
  id: string;
  date: string;
  user: string;
  userId: string;
  task: string;
  hours: number;
  status: string;
}

const canApprove = (entry: TimesheetEntry) => {
  if (["Admin", "HR"].includes(currentUser.role)) return true;
  if (currentUser.role === "Team Lead") {
    return entry.userId !== currentUser.id;
  }
  return false;
};

const canDelete = (entry: TimesheetEntry) => ["Admin", "HR"].includes(currentUser.role);

const getStatusVariant = (status: string) => {
  switch (status) {
    case "Approved": return "default";
    case "Pending": return "secondary";
    case "Rejected": return "destructive";
    default: return "outline";
  }
};

const initialForm = { date: '', user: currentUser.name, userId: currentUser.id, task: '', hours: 0, status: 'Pending' };

export default function TimesheetPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'log'|'approve'|'reject'|null>(null);
  const [form, setForm] = useState<any>(initialForm);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry|null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string|null>(null);

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/internal/timesheets', {
        headers: {
          'X-User-Id': currentUser.id,
          'X-User-Role': currentUser.role
        }
      });
      if (!response.ok) throw new Error("Failed to fetch timesheet data.");
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load timesheet entries.'
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchTimesheets(); }, []);

  // Modal openers
  const openLog = () => { setForm({ ...initialForm, date: new Date().toISOString().slice(0,10) }); setModalType('log'); setShowModal(true); };
  const openApprove = (entry: TimesheetEntry) => { setForm({ ...entry, status: 'Approved' }); setEditingEntry(entry); setModalType('approve'); setShowModal(true); };
  const openReject = (entry: TimesheetEntry) => { setForm({ ...entry, status: 'Rejected' }); setEditingEntry(entry); setModalType('reject'); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setModalType(null); setForm(initialForm); setEditingEntry(null); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setForm((f: any) => ({ ...f, [e.target.name]: e.target.value })); };

  // CRUD actions
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalType === 'log') {
        const res = await fetch('/api/internal/timesheets', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error('Failed to log time');
      } else if ((modalType === 'approve' || modalType === 'reject') && editingEntry) {
        const res = await fetch(`/api/internal/timesheets/${editingEntry.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error('Failed to update entry');
      }
      await fetchTimesheets();
      closeModal();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e.message
      });
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (entry: TimesheetEntry) => {
    if (!window.confirm(`Delete timesheet entry for ${entry.user} on ${entry.date}?`)) return;
    setDeleting(entry.id);
    try {
      const res = await fetch(`/api/internal/timesheets/${entry.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete entry');
      await fetchTimesheets();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e.message
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Timesheet Logs</CardTitle>
            <CardDescription>Log and manage work hours against tasks. Your view is based on your role.</CardDescription>
          </div>
          <Button size="sm" className="gap-1" onClick={openLog}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Log Time</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Task</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : entries.map(entry => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.date}</TableCell>
                <TableCell>{entry.user}</TableCell>
                <TableCell className="text-muted-foreground">{entry.task}</TableCell>
                <TableCell className="text-right font-mono">{entry.hours.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={getStatusVariant(entry.status)}>{entry.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {entry.status === 'Pending' && canApprove(entry) ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openApprove(entry)}>
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          <span>Approve</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openReject(entry)}>
                          <X className="mr-2 h-4 w-4" />
                          <span>Reject</span>
                        </DropdownMenuItem>
                        {canDelete(entry) && (
                          <DropdownMenuItem onClick={() => handleDelete(entry)} disabled={deleting === entry.id}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>{deleting === entry.id ? 'Deleting...' : 'Delete'}</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button variant="outline" size="sm" disabled>View</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>1-{entries.length}</strong> of <strong>{entries.length}</strong> accessible entries
        </div>
      </CardFooter>
      {/* Modal for log/approve/reject */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <form onSubmit={handleSave} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="font-semibold mb-4">
              {modalType === 'log' && 'Log Time'}
              {modalType === 'approve' && 'Approve Timesheet'}
              {modalType === 'reject' && 'Reject Timesheet'}
            </h2>
            <div className="grid gap-3">
              <input name="date" value={form.date ?? ''} onChange={handleChange} type="date" className="border rounded px-2 py-1" required />
              <input name="user" value={form.user ?? ''} onChange={handleChange} placeholder="User" className="border rounded px-2 py-1" required />
              <input name="userId" value={form.userId ?? ''} onChange={handleChange} placeholder="User ID" className="border rounded px-2 py-1" required />
              <input name="task" value={form.task ?? ''} onChange={handleChange} placeholder="Task" className="border rounded px-2 py-1" required />
              <input name="hours" value={form.hours ?? 0} onChange={handleChange} type="number" min={0} step={0.25} className="border rounded px-2 py-1" required />
              <input name="status" value={form.status ?? 'Pending'} onChange={handleChange} className="border rounded px-2 py-1" readOnly={modalType !== 'log'} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}
