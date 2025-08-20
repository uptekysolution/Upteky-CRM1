
'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, Upload, Search, Filter, Trash2, Edit, MoreHorizontal, UserCheck, UserX } from "lucide-react"
import Link from "next/link"
import { collection, getDocs, writeBatch, doc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { deleteUser } from "firebase/auth";

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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { db, auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { UserStatsDashboard } from './_components/user-stats-dashboard';

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

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    firstName?: string;
    lastName?: string;
}

export default function UserManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = async () => {
        setLoading(true);
        try {
            const usersCollection = collection(db, "users");
            const userSnapshot = await getDocs(usersCollection);
            const usersList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(usersList);
            setFilteredUsers(usersList);
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

  // Filter users based on search term and filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

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

  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, "users", userToDelete.id));
      
      // Delete from Firebase Auth (if possible)
      try {
        await deleteUser(auth.currentUser!);
      } catch (authError) {
        console.log("Could not delete from Auth (user may not be current user):", authError);
      }

      // Remove from local state
      setUsers(users.filter(u => u.id !== userToDelete.id));
      
      toast({
        title: "User Deleted",
        description: `${userToDelete.name} has been removed from the system.`,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete the user. Please try again.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const getRoleOptions = () => {
    const roles = [...new Set(users.map(user => user.role).filter(Boolean))];
    return roles.sort();
  };

  const getStatusOptions = () => {
    const statuses = [...new Set(users.map(user => user.status).filter(Boolean))];
    return statuses.sort();
  };

  return (
    <div className="space-y-6">
      {/* User Statistics Dashboard */}
      <UserStatsDashboard />
      
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
          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {getRoleOptions().map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {getStatusOptions().map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                             {loading ? (
                   Array.from({ length: 5 }).map((_, i) => (
                       <TableRow key={`loading-skeleton-${i}`}>
                           <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                           <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                           <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                           <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                           <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                       </TableRow>
                   ))
              ) : currentUsers.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                          {filteredUsers.length === 0 && users.length > 0 
                            ? "No users match your search criteria." 
                            : "No users found. Try seeding the database."}
                      </TableCell>
                  </TableRow>
              ) : (
                  currentUsers.map(user => (
                      <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>
                              <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                                {user.status === 'Active' ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
                                {user.status}
                              </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/dashboard/user-management/${user.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                      </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              Showing <strong>{indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)}</strong> of <strong>{filteredUsers.length}</strong> users
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              "{userToDelete?.name}" and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
