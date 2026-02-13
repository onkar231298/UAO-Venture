import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Wifi, WifiOff, Clock, Trophy, TrendingUp, AlertTriangle, XCircle, Users, Timer } from "lucide-react";

interface TeamMemberActivity {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string | null;
  department: string | null;
  profileImageUrl: string | null;
  liveStatus: string;
  minutesAgo: number;
  totalActiveMinutes: number;
  totalIdleMinutes: number;
  heartbeatCount: number;
  firstActivity: string | null;
  lastActivity: string | null;
  tier: string;
}

const tierConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Trophy }> = {
  champion: { label: "Champion", color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200", icon: Trophy },
  steady: { label: "Steady", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200", icon: TrendingUp },
  drifting: { label: "Drifting", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200", icon: AlertTriangle },
  disconnected: { label: "Disconnected", color: "text-red-700", bgColor: "bg-red-50 border-red-200", icon: XCircle },
};

const statusConfig: Record<string, { label: string; dotColor: string; textColor: string }> = {
  online: { label: "Online", dotColor: "bg-green-500", textColor: "text-green-700" },
  away: { label: "Away", dotColor: "bg-yellow-500", textColor: "text-yellow-700" },
  offline: { label: "Offline", dotColor: "bg-red-500", textColor: "text-red-700" },
};

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function TeamActivityMonitor() {
  const { data: teamData, isLoading, error } = useQuery<TeamMemberActivity[]>({
    queryKey: ["/api/hr/admin/activity-status"],
    refetchInterval: 30000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-8 w-8 animate-pulse mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Loading team activity...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <XCircle className="h-8 w-8 mx-auto mb-3 text-red-400" />
          <p className="text-muted-foreground">Unable to load team activity. Please ensure you have admin access.</p>
        </CardContent>
      </Card>
    );
  }

  const team = teamData || [];
  const onlineCount = team.filter(m => m.liveStatus === "online").length;
  const awayCount = team.filter(m => m.liveStatus === "away").length;
  const offlineCount = team.filter(m => m.liveStatus === "offline").length;
  const championCount = team.filter(m => m.tier === "champion").length;
  const disconnectedCount = team.filter(m => m.tier === "disconnected").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-700">Online</span>
            </div>
            <p className="text-2xl font-bold text-green-800">{onlineCount}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-sm font-medium text-yellow-700">Away</span>
            </div>
            <p className="text-2xl font-bold text-yellow-800">{awayCount}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-red-700">Offline</span>
            </div>
            <p className="text-2xl font-bold text-red-800">{offlineCount}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Champions</span>
            </div>
            <p className="text-2xl font-bold text-emerald-800">{championCount}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Total Staff</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{team.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Live Team Activity
          </CardTitle>
          <CardDescription>Real-time monitoring of CRM activity — auto-refreshes every 30 seconds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[200px]">Team Member</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[130px]">Performance</TableHead>
                  <TableHead className="w-[100px]">Active Time</TableHead>
                  <TableHead className="w-[100px]">Idle Time</TableHead>
                  <TableHead className="w-[100px]">First Seen</TableHead>
                  <TableHead className="w-[100px]">Last Seen</TableHead>
                  <TableHead className="w-[80px]">Heartbeats</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No staff members found
                    </TableCell>
                  </TableRow>
                ) : (
                  team.map((member) => {
                    const status = statusConfig[member.liveStatus] || statusConfig.offline;
                    const tier = tierConfig[member.tier] || tierConfig.disconnected;
                    const TierIcon = tier.icon;

                    return (
                      <TableRow key={member.id} className={member.liveStatus === "offline" && member.tier === "disconnected" ? "opacity-60" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                {(member.firstName?.[0] || "").toUpperCase()}{(member.lastName?.[0] || "").toUpperCase()}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${status.dotColor}`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{member.firstName} {member.lastName}</p>
                              <p className="text-xs text-muted-foreground capitalize">{member.role?.replace(/_/g, " ")} · {member.department}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${status.dotColor} ${member.liveStatus === "online" ? "animate-pulse" : ""}`} />
                            <span className={`text-xs font-medium ${status.textColor}`}>{status.label}</span>
                          </div>
                          {member.minutesAgo >= 0 && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {member.minutesAgo === 0 ? "Just now" : `${member.minutesAgo}m ago`}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${tier.bgColor} ${tier.color}`}>
                            <TierIcon className="w-3 h-3" />
                            {tier.label}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{formatMinutes(member.totalActiveMinutes)}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm ${member.totalIdleMinutes > 60 ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            {formatMinutes(member.totalIdleMinutes)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatTime(member.firstActivity)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatTime(member.lastActivity)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground text-center">{member.heartbeatCount}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
