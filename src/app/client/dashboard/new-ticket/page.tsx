"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { TicketService } from '@/lib/ticket-service';

export default function NewTicketPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!userProfile?.id) {
      toast({ variant: 'destructive', title: 'Not signed in', description: 'Please sign in to create a ticket.' });
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Title and description are required.' });
      return;
    }
    setSubmitting(true);
    try {
      const id = await TicketService.createTicket({
        clientId: userProfile.id,
        title,
        description,
        priority,
        category,
      });
      toast({ title: 'Ticket created' });
      router.push(`/client/dashboard/ticket/${id}`);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create ticket.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Create Support Ticket</CardTitle>
          <CardDescription>Describe your issue so our team can assist you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary of the issue" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide details that help us reproduce and resolve the issue" rows={6} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-[#F7931E] hover:bg-[#E6851A]">
              {submitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


