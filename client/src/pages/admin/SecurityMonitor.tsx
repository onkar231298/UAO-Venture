import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Shield,
  LogIn,
  Activity,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle,
  Building2,
  Users,
  RefreshCcw,
  Moon,
  Globe,
  Zap,
  ExternalLink,
  CalendarRange,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { Link } from "wouter";

type LoginLog = {
  id: number;
  userId: string;
  timestamp: string;
  ipAddress: string | null;
  city: string | null;
  country: string | null;
  userAgent: string | null;
  isOffHours: boolean | null;
  isNewLocation: boolean | null;
  user: { firstName: string | null; lastName: string | null; email: string | null; role: string | null };
};

type AccessLog = {
  id: number;
  userId: string;
  timestamp: string;
  entityType: string;
  entityId: number | null;
  entityName: string | null;
  ipAddress: string | null;
  page: string | null;
  user: { firstName: string | null; lastName: string | null; email: string | null; role: string | null };
};

type SecurityAlert = {
  id: number;
  userId: string;
  alertType: string;
  severity: string;
  description: string | null;
  createdAt: string;
  isResolved: boolean | null;
  user: { firstName: string | null; lastName: string | null; email: string | null; role: string | null };
};

type UserSummary = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string | null;
  lastLoginAt: string | null;
  lastLoginCity: string | null;
  lastLoginCountry: string | null;
  loginCountThisMonth: number;
  unresolvedAlerts: number;
};

function userName(u: { firstName: string | null; lastName: string | null; email: string | null } | null | undefined): string {
  if (!u) return "Unknown";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return name || u.email || "Unknown";
}

function userInitials(u: { firstName: string | null; lastName: string | null; email: string | null } | null | undefined): string {
  if (!u) return "?";
  if (u.firstName && u.lastName) return u.firstName[0] + u.lastName[0];
  if (u.firstName) return u.firstName[0];
  if (u.email) return u.email[0].toUpperCase();
  return "?";
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return ua.slice(0, 40);
}

function entityLink(log: AccessLog): string {
  const id = log.entityId;
  if (log.entityType === "company") return id ? `/admin/dashboard/crm/companies?highlight=${id}` : `/admin/dashboard/crm/companies`;
  if (log.entityType === "lead") return id ? `/admin/dashboard/crm/leads?highlight=${id}` : `/admin/dashboard/crm/leads`;
  if (log.entityType === "contact") return id ? `/admin/dashboard/crm/companies?contactId=${id}` : `/admin/dashboard/crm/companies`;
  return "#";
}

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: "Low", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  high: { label: "High", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  off_hours_login: "Off-Hours Login",
  new_location_login: "New Location Login",
  rapid_company_access: "Rapid Data Access",
  concurrent_login: "Multi-Device Login",
};

const ENTITY_ICONS: Record<string, any> = {
  company: Building2,
  lead: Users,
  contact: Users,
};

export default function SecurityMonitor() {
  const { toast } = useToast();

  // Filter state — login
  const [loginFilters, setLoginFilters] = useState({
    userId: "",
    flaggedOnly: "all",
    dateFrom: "",
    dateTo: "",
  });

  // Filter state — activity
  const [activityFilters, setActivityFilters] = useState({
    userId: "",
    entityType: "all",
    dateFrom: "",
    dateTo: "",
  });

  // Filter state — alerts
  const [alertFilters, setAlertFilters] = useState({
    userId: "",
    severity: "all",
    isResolved: "false",
  });

  // Queries
  const staffQuery = useQuery<UserSummary[]>({
    queryKey: ["/api/admin/security/user-summary"],
    staleTime: 30000,
  });

  const loginQuery = useQuery<{ logs: LoginLog[]; total: number }>({
    queryKey: ["/api/admin/security/login-logs", loginFilters],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100", offset: "0" });
      if (loginFilters.userId) params.set("userId", loginFilters.userId);
      if (loginFilters.flaggedOnly === "true") params.set("flaggedOnly", "true");
      if (loginFilters.dateFrom) params.set("dateFrom", loginFilters.dateFrom);
      if (loginFilters.dateTo) params.set("dateTo", loginFilters.dateTo);
      const res = await fetch(`/api/admin/security/login-logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 15000,
  });

  const activityQuery = useQuery<{ logs: AccessLog[]; total: number }>({
    queryKey: ["/api/admin/security/activity-logs", activityFilters],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100", offset: "0" });
      if (activityFilters.userId) params.set("userId", activityFilters.userId);
      if (activityFilters.entityType !== "all") params.set("entityType", activityFilters.entityType);
      if (activityFilters.dateFrom) params.set("dateFrom", activityFilters.dateFrom);
      if (activityFilters.dateTo) params.set("dateTo", activityFilters.dateTo);
      const res = await fetch(`/api/admin/security/activity-logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 15000,
  });

  const alertsQuery = useQuery<{ alerts: SecurityAlert[]; total: number }>({
    queryKey: ["/api/admin/security/alerts", alertFilters],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100", offset: "0" });
      if (alertFilters.userId) params.set("userId", alertFilters.userId);
      if (alertFilters.severity !== "all") params.set("severity", alertFilters.severity);
      if (alertFilters.isResolved !== "all") params.set("isResolved", alertFilters.isResolved);
      const res = await fetch(`/api/admin/security/alerts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 10000,
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/security/alerts/${id}/resolve`, { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/user-summary"] });
      toast({ title: "Alert resolved", description: "Security alert has been marked as resolved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to resolve alert", variant: "destructive" });
    },
  });

  const unresolvedCount = alertsQuery.data?.alerts.filter(a => !a.isResolved).length ?? 0;
  const staffList = staffQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2 mb-1">
            <LogIn className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Logins</span>
          </div>
          <div className="text-2xl font-bold">{loginQuery.data?.total ?? "—"}</div>
          <p className="text-xs text-muted-foreground">All recorded sessions</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2 mb-1">
            <Moon className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Off-Hours Logins</span>
          </div>
          <div className="text-2xl font-bold">
            {loginQuery.data?.logs.filter(l => l.isOffHours).length ?? "—"}
          </div>
          <p className="text-xs text-muted-foreground">Before 7 AM or after 9 PM</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-purple-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Access Events</span>
          </div>
          <div className="text-2xl font-bold">{activityQuery.data?.total ?? "—"}</div>
          <p className="text-xs text-muted-foreground">Company / lead / contact opens</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Unresolved Alerts</span>
          </div>
          <div className="text-2xl font-bold">{unresolvedCount}</div>
          <p className="text-xs text-muted-foreground">Require attention</p>
        </Card>
      </div>

      {/* Staff at a glance */}
      {staffList.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Staff Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {staffList.map(s => (
              <Card key={s.userId} className={`p-3 ${s.unresolvedAlerts > 0 ? 'border-red-200' : ''}`}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                      {[s.firstName?.[0], s.lastName?.[0]].filter(Boolean).join("") || s.email?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{[s.firstName, s.lastName].filter(Boolean).join(" ") || s.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.role?.replace(/_/g, " ")}</p>
                  </div>
                  {s.unresolvedAlerts > 0 && (
                    <Badge variant="destructive" className="shrink-0 text-xs">{s.unresolvedAlerts}</Badge>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <LogIn className="h-3 w-3" />
                    <span>{s.loginCountThisMonth} logins this month</span>
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {[s.lastLoginCity, s.lastLoginCountry].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                  {s.lastLoginAt && (
                    <div className="col-span-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Last: {formatDistanceToNow(new Date(s.lastLoginAt), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="login-history">
        <TabsList>
          <TabsTrigger value="login-history" className="gap-2">
            <LogIn className="h-4 w-4" />
            Login History
            {loginQuery.data && loginQuery.data.logs.filter(l => l.isOffHours || l.isNewLocation).length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {loginQuery.data.logs.filter(l => l.isOffHours || l.isNewLocation).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity-feed" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity Feed
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Security Alerts
            {unresolvedCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{unresolvedCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Login History ── */}
        <TabsContent value="login-history" className="mt-4 space-y-3">
          {/* Filters row */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Staff member</Label>
              <Select
                value={loginFilters.userId || "all"}
                onValueChange={v => setLoginFilters(f => ({ ...f, userId: v === "all" ? "" : v }))}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffList.map(s => (
                    <SelectItem key={s.userId} value={s.userId}>
                      {[s.firstName, s.lastName].filter(Boolean).join(" ") || s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Flag filter</Label>
              <Select
                value={loginFilters.flaggedOnly}
                onValueChange={v => setLoginFilters(f => ({ ...f, flaggedOnly: v }))}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Logins</SelectItem>
                  <SelectItem value="true">Flagged Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><CalendarRange className="h-3 w-3" />From date</Label>
              <Input
                type="date"
                className="h-8 w-[140px] text-sm"
                value={loginFilters.dateFrom}
                onChange={e => setLoginFilters(f => ({ ...f, dateFrom: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><CalendarRange className="h-3 w-3" />To date</Label>
              <Input
                type="date"
                className="h-8 w-[140px] text-sm"
                value={loginFilters.dateTo}
                onChange={e => setLoginFilters(f => ({ ...f, dateTo: e.target.value }))}
              />
            </div>
            {(loginFilters.dateFrom || loginFilters.dateTo) && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setLoginFilters(f => ({ ...f, dateFrom: "", dateTo: "" }))}>
                Clear dates
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-8 ml-auto" onClick={() => loginQuery.refetch()} disabled={loginQuery.isFetching}>
              <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${loginQuery.isFetching ? "animate-spin" : ""}`} />
              {loginQuery.isFetching ? "Refreshing…" : "Refresh"}
            </Button>
            <span className="text-xs text-muted-foreground self-end">{loginQuery.data?.total ?? 0} records</span>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginQuery.isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : (loginQuery.data?.logs || []).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No login records for the selected filters</TableCell></TableRow>
                ) : (loginQuery.data?.logs || []).map(log => (
                  <TableRow key={log.id} className={log.isOffHours || log.isNewLocation ? "bg-amber-50/40" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs bg-slate-200">{userInitials(log.user)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{userName(log.user)}</p>
                          <p className="text-xs text-muted-foreground">{log.user?.role?.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm cursor-default">
                              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {format(new Date(log.timestamp), "dd MMM yyyy, h:mm a")}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <p className="text-xs text-muted-foreground">{format(new Date(log.timestamp), "dd MMM yyyy")}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {[log.city, log.country].filter(Boolean).join(", ") || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{log.ipAddress || "—"}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {parseUserAgent(log.userAgent)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {log.isOffHours && (
                          <Badge className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100">
                            <Moon className="h-3 w-3 mr-1" />
                            Off-Hours
                          </Badge>
                        )}
                        {log.isNewLocation && (
                          <Badge className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-100">
                            <Globe className="h-3 w-3 mr-1" />
                            New Location
                          </Badge>
                        )}
                        {!log.isOffHours && !log.isNewLocation && (
                          <span className="text-xs text-muted-foreground">Normal</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Activity Feed ── */}
        <TabsContent value="activity-feed" className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Staff member</Label>
              <Select
                value={activityFilters.userId || "all"}
                onValueChange={v => setActivityFilters(f => ({ ...f, userId: v === "all" ? "" : v }))}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffList.map(s => (
                    <SelectItem key={s.userId} value={s.userId}>
                      {[s.firstName, s.lastName].filter(Boolean).join(" ") || s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Entity type</Label>
              <Select
                value={activityFilters.entityType}
                onValueChange={v => setActivityFilters(f => ({ ...f, entityType: v }))}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="company">Companies</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="contact">Contacts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><CalendarRange className="h-3 w-3" />From date</Label>
              <Input
                type="date"
                className="h-8 w-[140px] text-sm"
                value={activityFilters.dateFrom}
                onChange={e => setActivityFilters(f => ({ ...f, dateFrom: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><CalendarRange className="h-3 w-3" />To date</Label>
              <Input
                type="date"
                className="h-8 w-[140px] text-sm"
                value={activityFilters.dateTo}
                onChange={e => setActivityFilters(f => ({ ...f, dateTo: e.target.value }))}
              />
            </div>
            {(activityFilters.dateFrom || activityFilters.dateTo) && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setActivityFilters(f => ({ ...f, dateFrom: "", dateTo: "" }))}>
                Clear dates
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-8 ml-auto" onClick={() => activityQuery.refetch()} disabled={activityQuery.isFetching}>
              <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${activityQuery.isFetching ? "animate-spin" : ""}`} />
              {activityQuery.isFetching ? "Refreshing…" : "Refresh"}
            </Button>
            <span className="text-xs text-muted-foreground self-end">{activityQuery.data?.total ?? 0} records</span>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityQuery.isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : (activityQuery.data?.logs || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground font-medium">No activity records yet</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        This feed records when staff members open company, lead, or contact detail pages in the CRM. Activity will appear here as the team uses the system.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (activityQuery.data?.logs || []).map(log => {
                  const Icon = ENTITY_ICONS[log.entityType] || Activity;
                  const link = entityLink(log);
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs bg-slate-200">{userInitials(log.user)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{userName(log.user)}</p>
                            <p className="text-xs text-muted-foreground">{log.user?.role?.replace(/_/g, " ")}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Icon className="h-3 w-3" />
                          Viewed {log.entityType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={link} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                          {log.entityName || `#${log.entityId}`}
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm cursor-default">
                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {format(new Date(log.timestamp), "dd MMM yyyy, h:mm:ss a")}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <p className="text-xs text-muted-foreground">{format(new Date(log.timestamp), "dd MMM yyyy")}</p>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{log.ipAddress || "—"}</code>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Security Alerts ── */}
        <TabsContent value="alerts" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              value={alertFilters.userId || "all"}
              onValueChange={v => setAlertFilters(f => ({ ...f, userId: v === "all" ? "" : v }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staffList.map(s => (
                  <SelectItem key={s.userId} value={s.userId}>
                    {[s.firstName, s.lastName].filter(Boolean).join(" ") || s.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={alertFilters.severity}
              onValueChange={v => setAlertFilters(f => ({ ...f, severity: v }))}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={alertFilters.isResolved}
              onValueChange={v => setAlertFilters(f => ({ ...f, isResolved: v }))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="false">Unresolved</SelectItem>
                <SelectItem value="true">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => alertsQuery.refetch()} disabled={alertsQuery.isFetching}>
              <RefreshCcw className={`h-3.5 w-3.5 mr-1 ${alertsQuery.isFetching ? "animate-spin" : ""}`} />
              {alertsQuery.isFetching ? "Refreshing…" : "Refresh"}
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">
              {alertsQuery.data?.total ?? 0} alerts
            </span>
          </div>

          {alertsQuery.isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading alerts…</div>
          ) : (alertsQuery.data?.alerts || []).length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-muted-foreground">No alerts found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(alertsQuery.data?.alerts || []).map(alert => {
                const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
                return (
                  <div
                    key={alert.id}
                    className={`rounded-lg border p-4 ${cfg.bg} ${alert.isResolved ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${cfg.color}`}>
                        {alert.severity === "high" ? <Zap className="h-5 w-5" /> : alert.severity === "medium" ? <AlertTriangle className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={`text-xs ${cfg.color} bg-white border border-current`}>
                            {cfg.label}
                          </Badge>
                          <span className="text-sm font-semibold">
                            {ALERT_TYPE_LABELS[alert.alertType] || alert.alertType}
                          </span>
                          {alert.isResolved && (
                            <Badge variant="secondary" className="text-xs gap-1 text-green-700 bg-green-100">
                              <CheckCircle className="h-3 w-3" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{alert.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Avatar className="h-4 w-4 inline">
                              <AvatarFallback className="text-[9px] bg-slate-300">{userInitials(alert.user)}</AvatarFallback>
                            </Avatar>
                            {userName(alert.user)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(alert.createdAt), "dd MMM yyyy, h:mm a")}
                          </span>
                        </div>
                      </div>
                      {!alert.isResolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 text-xs"
                          onClick={() => resolveMutation.mutate(alert.id)}
                          disabled={resolveMutation.isPending}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
