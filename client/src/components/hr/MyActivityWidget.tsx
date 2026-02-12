import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Trophy, TrendingUp, AlertTriangle, XCircle, Clock } from "lucide-react";

interface MyActivityData {
  liveStatus: string;
  minutesAgo: number;
  totalActiveMinutes: number;
  totalIdleMinutes: number;
  tier: string;
  firstActivity: string | null;
  lastActivity: string | null;
  heartbeatCount: number;
  timeline: { hour: number; active: boolean }[];
  weekHistory: { date: string; activeMinutes: number; tier: string }[];
}

const tierConfig: Record<string, { label: string; color: string; bgClass: string; borderClass: string; icon: typeof Trophy }> = {
  champion: { label: "Champion", color: "text-emerald-700", bgClass: "bg-emerald-50", borderClass: "border-emerald-200", icon: Trophy },
  steady: { label: "Steady", color: "text-blue-700", bgClass: "bg-blue-50", borderClass: "border-blue-200", icon: TrendingUp },
  drifting: { label: "Drifting", color: "text-amber-700", bgClass: "bg-amber-50", borderClass: "border-amber-200", icon: AlertTriangle },
  disconnected: { label: "Disconnected", color: "text-red-700", bgClass: "bg-red-50", borderClass: "border-red-200", icon: XCircle },
};

const statusDot: Record<string, string> = {
  online: "bg-green-500 animate-pulse",
  away: "bg-yellow-500",
  offline: "bg-red-500",
};

const statusLabel: Record<string, string> = {
  online: "Online",
  away: "Away",
  offline: "Offline",
};

function formatMins(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MyActivityWidget() {
  const { data, isLoading } = useQuery<MyActivityData>({
    queryKey: ["/api/hr/my-activity-status"],
    refetchInterval: 60000,
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 animate-pulse" />
            Loading activity...
          </div>
        </CardContent>
      </Card>
    );
  }

  const tier = tierConfig[data.tier] || tierConfig.disconnected;
  const TierIcon = tier.icon;
  const dot = statusDot[data.liveStatus] || statusDot.offline;

  return (
    <Card className={`${tier.borderClass} ${tier.bgClass}/30`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Activity className="h-5 w-5 text-primary" />
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${dot}`} />
            </div>
            <div>
              <p className="text-sm font-semibold">My Activity</p>
              <p className="text-xs text-muted-foreground">{statusLabel[data.liveStatus] || "Offline"}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${tier.bgClass} ${tier.borderClass} ${tier.color}`}>
            <TierIcon className="w-3.5 h-3.5" />
            {tier.label}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 rounded-lg bg-white/60 border">
            <p className="text-lg font-bold text-primary">{formatMins(data.totalActiveMinutes)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Today</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/60 border">
            <p className={`text-lg font-bold ${data.totalIdleMinutes > 60 ? "text-red-600" : "text-muted-foreground"}`}>{formatMins(data.totalIdleMinutes)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Idle Today</p>
          </div>
        </div>

        {data.timeline.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Today's Timeline (1PM–9PM IST)</p>
            <div className="flex gap-0.5">
              {data.timeline.map((slot) => {
                const displayHour = slot.hour > 12 ? slot.hour - 12 : slot.hour;
                const ampm = slot.hour >= 12 ? "PM" : "AM";
                return (
                  <div
                    key={slot.hour}
                    className={`flex-1 h-5 rounded-sm ${slot.active ? "bg-emerald-400" : "bg-gray-200"}`}
                    title={`${displayHour}:00 ${ampm} — ${slot.active ? "Active" : "No activity"}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
              <span>1PM</span>
              <span>5PM</span>
              <span>9PM</span>
            </div>
          </div>
        )}

        {data.weekHistory.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Last 7 Days</p>
            <div className="flex gap-1">
              {data.weekHistory.map((day) => {
                const dayTier = tierConfig[day.tier] || tierConfig.disconnected;
                const d = new Date(day.date + "T00:00:00");
                return (
                  <div key={day.date} className="flex-1 text-center">
                    <div
                      className={`h-6 rounded-sm flex items-center justify-center text-[9px] font-medium ${dayTier.bgClass} ${dayTier.color} border ${dayTier.borderClass}`}
                      title={`${day.date}: ${formatMins(day.activeMinutes)} active — ${dayTier.label}`}
                    >
                      {dayTier.label[0]}
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{dayNames[d.getDay()]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
