
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useEffect } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
});

type ProfileFormValues = z.infer<typeof profileSchema>

export function UserProfileForm({ user, onFormChange }: { user: any, onFormChange: (data: any) => void }) {

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || '',
    }
  })

  // Watch for form changes and notify the parent
  useEffect(() => {
    const subscription = form.watch((value) => {
      onFormChange(value);
    });
    return () => subscription.unsubscribe();
  }, [form, onFormChange]);


  return (
    <Card>
        <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Manage the user's basic information and base role.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl><Input readOnly disabled {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Base Role</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Business Development">Business Development</SelectItem>
                                    <SelectItem value="Employee">Employee</SelectItem>
                                    <SelectItem value="Team Lead">Team Lead</SelectItem>
                                    <SelectItem value="HR">HR</SelectItem>
                                    <SelectItem value="Sub-Admin">Sub-Admin</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                </form>
            </Form>
        </CardContent>
    </Card>
  )
}
