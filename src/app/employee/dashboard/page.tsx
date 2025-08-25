"use client";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck2, CheckSquare, Target } from "lucide-react";
import { TaskService } from "@/lib/task-service";
import { fetchAttendanceRecords, AttendanceRecord } from "@/lib/analytics";
import { format, parse } from "date-fns";
import dynamic from "next/dynamic";
import { EmployeeProjectService } from "@/lib/employee-project-service";

type MinimalTask = {
  id: string;
  title: string;
  status: string;
  deadline?: Date;
  updatedAt?: Date;
  priority?: string;
};

export default function Dashboard() {
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [teamId, setTeamId] = useState<string | undefined>(undefined);

  const [tasks, setTasks] = useState<MinimalTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(true);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserName("");
        setUserId("");
        setUserRole("");
        setTeamId(undefined);
        return;
      }

      let resolvedName: string | null = user.displayName || null;
      let resolvedRole: string | null = null;
      let resolvedTeamId: string | undefined = undefined;

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          resolvedName = data?.name || data?.fullName || resolvedName;
          resolvedRole = data?.role || null;
          resolvedTeamId = data?.teamId || undefined;
        }
      } catch {
        // ignore and fallback
      }

      if (!resolvedName) {
        const localPart = user.email?.split("@")[0] ?? "User";
        resolvedName = localPart
          .split(/[._-]+/)
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }

      setUserName(resolvedName);
      setUserId(user.uid);
      setUserRole(resolvedRole || "Employee");
      setTeamId(resolvedTeamId);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setTasksLoading(true);
      setTasksError(null);
      try {
        const res = await TaskService.getTasksByAssignee(userId);
        const mapped: MinimalTask[] = res.map((t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          deadline: t.deadline ? new Date(t.deadline) : (t.deadline as Date | undefined),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : (t.updatedAt as Date | undefined),
          priority: t.priority,
        }));
        setTasks(mapped);
      } catch (e: any) {
        setTasksError("Failed to load tasks");
      } finally {
        setTasksLoading(false);
      }
    };
    void load();
  }, [userId]);

  // Load employee projects
  useEffect(() => {
    const loadProjects = async () => {
      if (!userId || !userRole) return;
      setProjectsLoading(true);
      setProjectsError(null);
      try {
        const projectsData = await EmployeeProjectService.getEmployeeProjects(userId, userRole);
        setProjects(projectsData);
      } catch (e: any) {
        setProjectsError("Failed to load projects");
      } finally {
        setProjectsLoading(false);
      }
    };
    void loadProjects();
  }, [userId, userRole]);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!userId || !userRole) return;
      setAttendanceLoading(true);
      setAttendanceError(null);
      try {
        const records = await fetchAttendanceRecords(userRole, userId, teamId);
        setAttendance(records);
      } catch (e: any) {
        setAttendanceError("Failed to load attendance");
      } finally {
        setAttendanceLoading(false);
      }
    };
    void loadAttendance();
  }, [userId, userRole, teamId]);

  const now = new Date();
  const currentMonth = format(now, "yyyy-MM");

  const taskMetrics = useMemo(() => {
    const open = tasks.filter((t) => !["Completed", "Cancelled"].includes(String(t.status)));
    const overdue = open.filter((t) => t.deadline && t.deadline.getTime() < Date.now());
    const completedThisMonth = tasks.filter((t) => String(t.status) === "Completed" && t.updatedAt && format(t.updatedAt, "yyyy-MM") === currentMonth);
    const inMonth = tasks.filter((t) => (t.updatedAt && format(t.updatedAt, "yyyy-MM") === currentMonth) || (t.deadline && format(t.deadline, "yyyy-MM") === currentMonth));
    const completionRate = inMonth.length > 0 ? Math.round((completedThisMonth.length / inMonth.length) * 100) : 0;
    const onTime = completedThisMonth.filter((t) => t.deadline && t.updatedAt && t.updatedAt.getTime() <= t.deadline.getTime());
    const onTimeRate = completedThisMonth.length > 0 ? Math.round((onTime.length / completedThisMonth.length) * 100) : 0;
    return { openCount: open.length, overdueCount: overdue.length, completedThisMonth: completedThisMonth.length, completionRate, onTimeRate };
  }, [tasks, currentMonth]);

  const attendanceMetrics = useMemo(() => {
    if (!attendance || attendance.length === 0) {
      // If there are no attendance records at all, treat today as Absent for clarity
      return { rate30: 0, todayStatus: "Absent" } as { rate30: number; todayStatus: string };
    }
    const todayStr = format(now, "yyyy-MM-dd");
    const last30Cutoff = new Date(now);
    last30Cutoff.setDate(now.getDate() - 30);

    const recordsLast30 = attendance.filter((r) => {
      const d = parse(r.date, "yyyy-MM-dd", new Date());
      return d >= last30Cutoff && d <= now;
    });
    const presentOrRemote = recordsLast30.filter((r) => r.status === "Present" || r.status === "Remote");
    const rate30 = recordsLast30.length > 0 ? Math.round((presentOrRemote.length / recordsLast30.length) * 100) : 0;
    const today = attendance.find((r) => r.date === todayStr);
    const todayStatus = today ? today.status : "Absent";
    return { rate30, todayStatus };
  }, [attendance]);

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => (a.deadline?.getTime() || 0) - (b.deadline?.getTime() || 0))
      .slice(0, 5);
  }, [tasks]);

  return (
    <>
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Welcome back, {userName || "User"}!</h1>
        <p className="text-muted-foreground">Your personalized performance, tasks, and attendance summary.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Performance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="text-xs text-muted-foreground">Loading...</div>
            ) : tasksError ? (
              <div className="text-xs text-red-500">{tasksError}</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">{taskMetrics.completionRate}%</div>
                  <p className="text-xs text-muted-foreground">Completion rate (this month)</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{taskMetrics.onTimeRate}%</div>
                  <p className="text-xs text-muted-foreground">On-time delivery</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="text-xs text-muted-foreground">Loading...</div>
            ) : projectsError ? (
              <div className="text-xs text-red-500">{projectsError}</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">{projects.length}</div>
                  <p className="text-xs text-muted-foreground">Active projects</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {projects.filter(p => p.status === 'Active').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Currently active</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="text-xs text-muted-foreground">Loading...</div>
            ) : tasksError ? (
              <div className="text-xs text-red-500">{tasksError}</div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold">{taskMetrics.openCount}</div>
                  <p className="text-xs text-muted-foreground">Open</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{taskMetrics.overdueCount}</div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{taskMetrics.completedThisMonth}</div>
                  <p className="text-xs text-muted-foreground">Completed (this month)</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Summary</CardTitle>
            <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="text-xs text-muted-foreground">Loading...</div>
            ) : attendanceError ? (
              <div className="text-xs text-red-500">{attendanceError}</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">{attendanceMetrics.rate30}%</div>
                  <p className="text-xs text-muted-foreground">Attendance (last 30 days)</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{attendanceMetrics.todayStatus}</div>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mt-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>My Upcoming Tasks</CardTitle>
            <CardDescription>Next 5 tasks assigned to you by deadline.</CardDescription>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="text-sm text-muted-foreground">Loading tasks...</div>
            ) : tasksError ? (
              <div className="text-sm text-red-500">{tasksError}</div>
            ) : recentTasks.length === 0 ? (
              <div className="text-sm text-muted-foreground">No tasks found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Priority</TableHead>
                    <TableHead className="text-right">Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTasks.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="font-medium">{t.title}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className="text-xs" variant="outline">{t.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className="text-xs" variant="secondary">{t.priority || "-"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{t.deadline ? format(t.deadline, "dd MMM yyyy") : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
            <CardDescription>Projects assigned to your team.</CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="text-sm text-muted-foreground">Loading projects...</div>
            ) : projectsError ? (
              <div className="text-sm text-red-500">{projectsError}</div>
            ) : projects.length === 0 ? (
              <div className="text-sm text-muted-foreground">No projects assigned.</div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{project.name}</div>
                      <div className="text-xs text-muted-foreground">{project.status}</div>
                    </div>
                    <Badge className="text-xs" variant="outline">
                      {project.progress || 0}%
                    </Badge>
                  </div>
                ))}
                {projects.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{projects.length - 5} more projects
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
