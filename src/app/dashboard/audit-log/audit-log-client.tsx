'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { runAccessAudit } from './actions'
import type { AccessAuditToolOutput } from '@/ai/flows/access-audit-tool'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Terminal, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const auditSchema = z.object({
  userRole: z.string().min(1, 'User role is required.'),
  moduleAccessed: z.string().min(1, 'Module is required.'),
  actionType: z.string().min(1, 'Action type is required.'),
  dataAccessed: z.string().min(1, 'Data accessed description is required.'),
})

type AuditFormValues = z.infer<typeof auditSchema>

export default function AuditLogClient() {
  const [result, setResult] = useState<AccessAuditToolOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AuditFormValues>({
    resolver: zodResolver(auditSchema),
    defaultValues: {
      userRole: 'Employee',
      moduleAccessed: 'Payroll',
      actionType: 'read',
      dataAccessed: 'Viewing own salary slip',
    },
  })

  const onSubmit = async (data: AuditFormValues) => {
    setIsLoading(true)
    setResult(null)
    setError(null)
    const response = await runAccessAudit({
        ...data,
        timestamp: new Date().toISOString()
    });

    if ('error' in response) {
      setError(response.error);
    } else {
      setResult(response);
    }
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Access Audit Tool</CardTitle>
        <CardDescription>
          Simulate a data access event to test the AI for unusual patterns.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 md:grid-cols-2">
       <TooltipProvider>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="userRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
              <FormField
                control={form.control}
                name="moduleAccessed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Accessed</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a module" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Attendance">Attendance</SelectItem>
                            <SelectItem value="Payroll">Payroll</SelectItem>
                            <SelectItem value="CRM">CRM</SelectItem>
                            <SelectItem value="Tasks">Tasks</SelectItem>
                            <SelectItem value="User Management">User Management</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
                control={form.control}
                name="actionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action Type</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an action" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="read">Read</SelectItem>
                            <SelectItem value="write">Write</SelectItem>
                            <SelectItem value="delete">Delete</SelectItem>
                            <SelectItem value="update">Update</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="dataAccessed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Description of Data Accessed
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Describe the action in plain English. <br/> Example: "Admin deleting another user's account."</p>
                        </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Viewing salary of another user" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="transition-all active:scale-95">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Access Pattern
            </Button>
          </form>
        </Form>
        </TooltipProvider>
        <div className="flex items-center justify-center rounded-lg border border-dashed p-4">
            {isLoading && (
                 <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>AI is analyzing the access pattern...</p>
                 </div>
            )}
            {!isLoading && result && (
                <Alert variant={result.isUnusual ? 'destructive' : 'default'}>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle className="flex items-center gap-2">
                        Analysis Complete
                        {result.isUnusual && <Badge variant="destructive">{result.severity}</Badge>}
                    </AlertTitle>
                    <AlertDescription className="mt-2 space-y-2">
                       <p><strong>Alert:</strong> {result.alertMessage}</p>
                       <p><strong>Recommendation:</strong> {result.recommendation}</p>
                    </AlertDescription>
                </Alert>
            )}
            {!isLoading && error && (
                 <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                 </Alert>
            )}
            {!isLoading && !result && !error && (
                <div className="text-center text-muted-foreground">
                    <p>AI analysis results will appear here.</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  )
}
