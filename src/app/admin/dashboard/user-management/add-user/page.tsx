
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { collection, doc, setDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"

import { Button } from "@/components/ui/button"
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
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { db, auth } from "@/lib/firebase"
import { Loader2 } from "lucide-react"

const addUserSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }).refine(email => email.endsWith('@upteky.com'), { message: 'Only @upteky.com emails are allowed.'}),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  role: z.string({ required_error: "Please assign a role."}),
})

type AddUserFormValues = z.infer<typeof addUserSchema>

export default function AddUserPage() {
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<AddUserFormValues>({
        resolver: zodResolver(addUserSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
        }
    })

    async function onSubmit(data: AddUserFormValues) {
        try {
            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const authUser = userCredential.user;

            // Create user document in Firestore
            const newUserRef = doc(db, 'users', authUser.uid);
            await setDoc(newUserRef, {
                id: authUser.uid,
                name: `${data.firstName} ${data.lastName}`,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                role: data.role,
                status: 'Active',
            });
            
            toast({
                title: "User Created",
                description: `${data.firstName} ${data.lastName} has been added.`,
            })
            router.push("/admin/dashboard/user-management");

        } catch (error: any) {
             console.error("Error creating user: ", error);
             let description = "Failed to create user. Please try again.";
             if (error.code === 'auth/email-already-in-use') {
                description = "This email address is already in use by another account."
             }
             toast({
                variant: "destructive",
                title: "Error",
                description: description,
            })
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add New User</CardTitle>
                <CardDescription>Fill out the form below to create a new user account. The user will be sent an email to verify their account.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John" {...field} />
                                        </FormControl>
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
                                        <FormControl>
                                            <Input placeholder="Doe" {...field} />
                                        </FormControl>
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
                                        <FormControl>
                                            <Input placeholder="john.doe@upteky.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Temporary Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
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
                        <div className="flex items-center gap-4">
                           <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create User
                            </Button>
                           <Button variant="outline" asChild>
                              <Link href="/admin/dashboard/user-management">Cancel</Link>
                           </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
