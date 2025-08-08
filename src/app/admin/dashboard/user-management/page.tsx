
'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, Upload } from "lucide-react"
import Link from "next/link"
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// This is the initial data that will be used to seed the database.
import {
    initialUsers,
    initialTeams,
    initialTeamMembers,
    initialRolePermissions,
    allPermissions,
    initialProjects,
    initialTools,
    initialClients,
    initialContacts,
    initialTickets,
    initialTicketReplies,
    initialTasks,
    projectAssignments,
    teamToolAccess,
    initialOfficeLocations,
} from '../_data/seed-data';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
}

export default function UserManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchUsers = async () => {
        setLoading(true);
        try {
            const usersCollection = collection(db, "users");
            const userSnapshot = await getDocs(usersCollection);
            const usersList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(usersList);
        } catch (error) {
            console.error("Error fetching users: ", error);
            toast({
                variant: 'destructive',
                title: "Error fetching users",
                description: "Could not load user data from the database.",
            })
        } finally {
            setLoading(false);
        }
    };

  useEffect(() => {
    fetchUsers();
  }, []);


  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
        const batch = writeBatch(db);

        // Seed Users
        initialUsers.forEach(user => {
            const userRef = doc(db, "users", user.id);
            batch.set(userRef, user);
        });

        // Seed Teams
        initialTeams.forEach(team => {
            const teamRef = doc(db, "teams", team.id);
            batch.set(teamRef, team);
        })
        
        // Seed Team Members
        initialTeamMembers.forEach(member => {
            const memberRef = doc(collection(db, "teamMembers"));
            batch.set(memberRef, member);
        })

        // Seed Projects
        initialProjects.forEach(project => {
            const projectRef = doc(db, "projects", project.id);
            batch.set(projectRef, project);
        })

        // Seed Project Assignments
        projectAssignments.forEach(assignment => {
            const assignmentRef = doc(collection(db, "projectAssignments"));
            batch.set(assignmentRef, assignment);
        })

        // Seed Tools
        initialTools.forEach(tool => {
            const toolRef = doc(db, "tools", tool.id);
            batch.set(toolRef, tool);
        })
        
        // Seed Team Tool Access
        teamToolAccess.forEach(access => {
            const accessRef = doc(collection(db, "teamToolAccess"));
            batch.set(accessRef, access);
        })
        
        // Seed Tasks
        initialTasks.forEach(task => {
            const taskRef = doc(db, "tasks", task.id);
            batch.set(taskRef, task);
        })

        // Seed Permissions
        Object.values(allPermissions).forEach(permission => {
            const permissionRef = doc(db, "permissions", permission.name);
            batch.set(permissionRef, permission);
        })

        // Seed Role Permissions
        Object.entries(initialRolePermissions).forEach(([role, permissions]) => {
            const roleRef = doc(db, "role_permissions", role);
            batch.set(roleRef, { permissions });
        });

        // Seed Clients
        initialClients.forEach(client => {
            const clientRef = doc(db, "clients", client.id);
            batch.set(clientRef, client);
        });

        // Seed Contacts
        initialContacts.forEach(contact => {
            const contactRef = doc(db, "contacts", contact.id);
            batch.set(contactRef, contact);
        });

        // Seed Tickets
        initialTickets.forEach(ticket => {
            const ticketRef = doc(db, "tickets", ticket.id);
            batch.set(ticketRef, ticket);
        });

        // Seed Ticket Replies
        initialTicketReplies.forEach(reply => {
            const replyRef = doc(db, "ticketReplies", reply.id);
            batch.set(replyRef, reply);
        });
        
        // Seed Office Locations
        initialOfficeLocations.forEach(location => {
            const locationRef = doc(db, "officeLocations", location.id);
            batch.set(locationRef, location);
        });

        await batch.commit();
        toast({
            title: "Database Seeded",
            description: "The initial data has been loaded into Firestore.",
        });
        
        // Refetch users after seeding
        fetchUsers();

    } catch (error) {
        console.error("Error seeding database: ", error);
        toast({
            variant: "destructive",
            title: "Seeding Failed",
            description: "There was an error while seeding the database.",
        });
    } finally {
        setIsSeeding(false);
    }
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all users in the Upteky Central system.</CardDescription>
            </div>
            <div className='flex items-center gap-2'>
                <Button size="sm" className="gap-1" onClick={handleSeedDatabase} disabled={isSeeding}>
                    <Upload className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        {isSeeding ? "Seeding..." : "Seed Database"}
                    </span>
                </Button>
                <Link href="/admin/dashboard/user-management/add-user">
                    <Button size="sm" className="gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add User
                        </span>
                    </Button>
                </Link>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                ))
            ) : users.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No users found. Try seeding the database.
                    </TableCell>
                </TableRow>
            ) : (
                users.map(user => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                            <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>{user.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <Link href={`/admin/dashboard/user-management/${user.id}/edit`}>
                             <Button variant="outline" size="sm">Edit</Button>
                           </Link>
                        </TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>1-{users.length}</strong> of <strong>{users.length}</strong> users
        </div>
      </CardFooter>
    </Card>
  )
}
