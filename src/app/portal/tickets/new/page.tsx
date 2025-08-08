
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const newTicketSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  category: z.string().min(1, 'Please select a category.'),
  description: z.string().min(10, 'Please provide a detailed description.'),
});

type NewTicketFormValues = z.infer<typeof newTicketSchema>;

export default function NewTicketPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<NewTicketFormValues>({
    resolver: zodResolver(newTicketSchema),
    defaultValues: {
      title: '',
      category: '',
      description: '',
    },
  });

  const onSubmit = async (data: NewTicketFormValues) => {
    try {
      const response = await fetch('/api/portal/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit ticket');
      }

      toast({
        title: 'Ticket Submitted',
        description: 'Our support team will get back to you shortly.',
      });
      router.push('/portal/dashboard');

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not submit your ticket. Please try again.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Submit a New Support Ticket</CardTitle>
            <CardDescription>
              Describe your issue below, and our team will assist you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Cannot log in to account" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Technical Support">Technical Support</SelectItem>
                      <SelectItem value="Billing Question">Billing Question</SelectItem>
                      <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide as much detail as possible..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardContent>
             <div className="flex items-center gap-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Ticket
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/portal/dashboard">Cancel</Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
