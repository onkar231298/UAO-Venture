import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CompleteFollowUpDialog } from "./CompleteFollowUpDialog";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import {
  Phone,
  Users,
  Mail,
  MessageCircle,
  Building2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlarmClock,
  CheckCircle2,
  PartyPopper,
  AlertTriangle,
} from "lucide-react";
import { Link, useLocation } from "wouter";

const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  call: Phone,
  meeting: Users,
  email: Mail,
  whatsapp: MessageCircle,
  site_visit: Building2,
  follow_up: Phone,
  reminder: AlarmClock,
};

const PRIORITY_CLASSES: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-700",
};

interface FollowUpTask {
  id: number;
  companyId: number;
  companyName: string | null;
  primaryPhone: string | null;
  taskType: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string | null;
  status: string;
  assignedTo: string | null;
}

interface TodayFollowUpsData {
  overdue: FollowUpTask[];
  today: FollowUpTask[];
  upcoming: FollowUpTask[];
  completedToday: any[];
  overdueCount: number;
  todayCount: number;
  upcomingCount: number;
  completedTodayCount: number;
}

export function TodayFollowUpsWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [completeTask, setCompleteTask] = useState<FollowUpTask | null>(null);
  const isAdmin = ["super_admin", "admin", "sales_manager"].includes(user?.role || "");

  const { data, isLoading, refetch } = useQuery<TodayFollowUpsData>({
    queryKey: ["/api/crm/follow-ups/today"],
    refetchInterval: 5 * 60 * 1000,
  });

  // Send daily notifications once per day
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const lastNotified = localStorage.getItem("followup-notified-date");
    if (lastNotified !== today) {
      apiRequest("/api/crm/follow-ups/notify-due", { method: "POST" })
        .then(() => localStorage.setItem("followup-notified-date", today))
        .catch(() => {});
    }
  }, []);

  const snoozeMutation = useMutation({
    mutationFn: async ({ taskId, days }: { taskId: number; days: number }) => {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + days);
      newDate.setHours(9, 0, 0, 0);
      return apiRequest(`/api/crm/company-tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ dueDate: newDate.toISOString() }),
      });
    },
    onSuccess: () => {
      toast({ title: "Follow-up snoozed" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/follow-ups/today"] });
    },
  });

  const hasAnyTasks =
    (data?.overdueCount || 0) + (data?.todayCount || 0) > 0;
  const allDone =
    !isLoading && !hasAnyTasks && (data?.completedTodayCount || 0) > 0;
  const totalPending = (data?.overdueCount || 0) + (data?.todayCount || 0);

  // Open the company details dialog (on its Follow-ups tab) for this task
  const openCompany = (task: FollowUpTask) => {
    if (!task.companyId) return;
    setLocation(`/sales/my-companies?openCompany=${task.companyId}&tab=followups`);
  };

  function renderTaskRow(task: FollowUpTask, isOverdue: boolean) {
    const Icon = TYPE_ICONS[task.taskType] || Phone;
    const daysOverdue = task.dueDate
      ? differenceInDays(new Date(), new Date(task.dueDate))
      : 0;

    return (
      <div
        key={task.id}
        onClick={() => openCompany(task)}
        data-testid={`row-followup-${task.id}`}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
          isOverdue ? "bg-red-50 hover:bg-red-100" : "bg-amber-50/60 hover:bg-amber-100/70"
        }`}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${isOverdue ? "text-red-500" : "text-amber-600"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-medium text-sm text-gray-900 truncate max-w-[140px]"
              title={task.companyName || undefined}
            >
              {task.companyName || "Unknown"}
            </span>
            <span className="text-xs text-gray-500 truncate max-w-[160px]" title={task.title}>
              {task.title}
            </span>
          </div>
          {task.description && (
            <div className="text-xs text-gray-500 truncate mt-0.5" title={task.description}>
              {task.description}
            </div>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            {isOverdue && daysOverdue > 0 && (
              <Badge className="bg-red-100 text-red-700 text-xs py-0">{daysOverdue}d overdue</Badge>
            )}
            {!isOverdue && task.dueDate && (
              <span className="text-xs text-gray-400">
                {format(new Date(task.dueDate), "h:mm a") !== "9:00 AM"
                  ? format(new Date(task.dueDate), "h:mm a")
                  : "Today"}
              </span>
            )}
            {task.priority && task.priority !== "medium" && (
              <Badge className={`text-xs py-0 ${PRIORITY_CLASSES[task.priority] || ""}`}>
                {task.priority}
              </Badge>
            )}
          </div>
        </div>
        <div
          className="flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Snooze */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600">
                <AlarmClock className="w-3.5 h-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1">
              <div className="text-xs font-medium text-gray-500 px-2 py-1">Snooze until</div>
              {[
                { label: "Tomorrow", days: 1 },
                { label: "In 3 days", days: 3 },
                { label: "Next week", days: 7 },
              ].map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => snoozeMutation.mutate({ taskId: task.id, days: opt.days })}
                  className="w-full text-left text-sm px-2 py-1.5 hover:bg-gray-100 rounded"
                >
                  {opt.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          {/* Done */}
          <Button
            size="sm"
            className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setCompleteTask(task)}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Done
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className="mb-4 border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
            Loading follow-ups...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`mb-4 border-l-4 ${
        (data?.overdueCount || 0) > 0
          ? "border-l-red-500"
          : (data?.todayCount || 0) > 0
          ? "border-l-amber-500"
          : "border-l-green-500"
      }`}>
        <CardHeader className="p-3 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  Your Follow-ups — {format(new Date(), "EEEE, MMM d")}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {(data?.overdueCount || 0) > 0 && (
                    <Badge className="bg-red-100 text-red-700 text-xs">
                      🔴 {data?.overdueCount} Overdue
                    </Badge>
                  )}
                  {(data?.todayCount || 0) > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 text-xs">
                      🟡 {data?.todayCount} Today
                    </Badge>
                  )}
                  {(data?.upcomingCount || 0) > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      🔵 {data?.upcomingCount} This Week
                    </Badge>
                  )}
                  {(data?.completedTodayCount || 0) > 0 && (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      ✅ {data?.completedTodayCount} done today
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/sales/follow-ups">
                <Button variant="ghost" size="sm" className="text-xs h-7" data-testid="link-view-all-followups">
                  View All
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {!collapsed && (
          <CardContent className="p-3 pt-2">
            {allDone && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700 text-sm">
                <PartyPopper className="w-4 h-4" />
                All follow-ups done for today! Great work.
              </div>
            )}

            {!hasAnyTasks && !allDone && (
              <div className="text-sm text-gray-500 py-2">
                No follow-ups scheduled for today.{" "}
                <Link href="/sales/my-companies">
                  <span className="text-green-600 hover:underline cursor-pointer">Go to Companies</span>
                </Link>{" "}
                to schedule one after your next call.
              </div>
            )}

            {/* Overdue */}
            {(data?.overdue?.length || 0) > 0 && (
              <div className="space-y-1 mb-2">
                <div className="flex items-center gap-1 text-xs font-semibold text-red-600 mb-1">
                  <AlertTriangle className="w-3 h-3" />
                  OVERDUE
                </div>
                {data!.overdue.map((t) => renderTaskRow(t, true))}
              </div>
            )}

            {/* Today */}
            {(data?.today?.length || 0) > 0 && (
              <div className="space-y-1 mb-2">
                <div className="text-xs font-semibold text-amber-600 mb-1">TODAY</div>
                {data!.today.map((t) => renderTaskRow(t, false))}
              </div>
            )}

            {/* Upcoming */}
            {(data?.upcomingCount || 0) > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowUpcoming(!showUpcoming)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  {showUpcoming ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {data?.upcomingCount} upcoming this week
                </button>
                {showUpcoming && (
                  <div className="mt-2 space-y-1">
                    {data?.upcoming.slice(0, 5).map((t) => {
                      const Icon = TYPE_ICONS[t.taskType] || Phone;
                      return (
                        <div
                          key={t.id}
                          onClick={() => openCompany(t)}
                          data-testid={`row-upcoming-${t.id}`}
                          className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded text-xs cursor-pointer transition-colors"
                        >
                          <Icon className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-600 font-medium">{t.dueDate ? format(new Date(t.dueDate), "EEE, MMM d") : ""}</span>
                          <span className="text-gray-500 truncate">{t.companyName}</span>
                          <span className="text-gray-400 truncate">— {t.title}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {completeTask && (
        <CompleteFollowUpDialog
          open={!!completeTask}
          onOpenChange={(open) => { if (!open) setCompleteTask(null); }}
          task={{
            id: completeTask.id,
            title: completeTask.title,
            taskType: completeTask.taskType,
            companyId: completeTask.companyId,
            companyName: completeTask.companyName || "Company",
          }}
          onCompleted={() => {
            setCompleteTask(null);
            refetch();
          }}
        />
      )}
    </>
  );
}
