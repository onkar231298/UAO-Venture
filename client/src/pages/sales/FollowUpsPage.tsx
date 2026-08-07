import { useState } from "react";
import type { ComponentType } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SalesLayout } from "@/components/layouts/SalesLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CompleteFollowUpDialog } from "@/components/crm/CompleteFollowUpDialog";
import { format, differenceInDays } from "date-fns";
import {
  Phone,
  Users,
  Mail,
  MessageCircle,
  Building2,
  AlarmClock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  CalendarDays,
  PartyPopper,
} from "lucide-react";

const TYPE_ICONS: Record<string, ComponentType<any>> = {
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
  taskType: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string | null;
  status: string;
}

interface CompletedTask {
  id: number;
  companyName: string | null;
  taskType: string;
  title: string;
  completedAt: string | null;
}

interface FollowUpsData {
  overdue: FollowUpTask[];
  today: FollowUpTask[];
  upcoming: FollowUpTask[];
  later?: FollowUpTask[];
  completedToday: CompletedTask[];
  overdueCount: number;
  todayCount: number;
  upcomingCount: number;
  laterCount?: number;
  completedTodayCount: number;
}

type SectionKey = "overdue" | "today" | "week" | "later";

export default function FollowUpsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [completeTask, setCompleteTask] = useState<FollowUpTask | null>(null);

  const { data, isLoading, refetch } = useQuery<FollowUpsData>({
    queryKey: ["/api/crm/follow-ups/today"],
    refetchInterval: 5 * 60 * 1000,
  });

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

  const openCompany = (task: FollowUpTask) => {
    if (!task.companyId) return;
    setLocation(`/sales/my-companies?openCompany=${task.companyId}&tab=followups`);
  };

  const dueLabel = (task: FollowUpTask, section: SectionKey) => {
    if (!task.dueDate) return <span className="text-xs text-gray-400">No due date</span>;
    const due = new Date(task.dueDate);
    if (section === "overdue") {
      const days = differenceInDays(new Date(), due);
      return (
        <>
          {days > 0 && (
            <Badge className="bg-red-100 text-red-700 text-xs py-0">{days}d overdue</Badge>
          )}
          <span className="text-xs text-gray-400">{format(due, "MMM d")}</span>
        </>
      );
    }
    if (section === "today") {
      return (
        <span className="text-xs text-gray-500">
          {format(due, "h:mm a") !== "9:00 AM" ? format(due, "h:mm a") : "Today"}
        </span>
      );
    }
    if (section === "week") {
      return <span className="text-xs text-gray-500">{format(due, "EEE, MMM d")}</span>;
    }
    return <span className="text-xs text-gray-500">{format(due, "MMM d, yyyy")}</span>;
  };

  const sections: Array<{
    key: SectionKey;
    label: string;
    icon: ComponentType<any>;
    headerClass: string;
    rowClass: string;
    iconClass: string;
    tasks: FollowUpTask[];
  }> = [
    {
      key: "overdue",
      label: "Overdue",
      icon: AlertTriangle,
      headerClass: "text-red-600",
      rowClass: "bg-red-50 hover:bg-red-100",
      iconClass: "text-red-500",
      tasks: data?.overdue || [],
    },
    {
      key: "today",
      label: "Due Today",
      icon: AlarmClock,
      headerClass: "text-amber-600",
      rowClass: "bg-amber-50/60 hover:bg-amber-100/70",
      iconClass: "text-amber-600",
      tasks: data?.today || [],
    },
    {
      key: "week",
      label: "This Week",
      icon: CalendarDays,
      headerClass: "text-blue-600",
      rowClass: "bg-blue-50/50 hover:bg-blue-100/60",
      iconClass: "text-blue-500",
      tasks: data?.upcoming || [],
    },
    {
      key: "later",
      label: "Later",
      icon: CalendarDays,
      headerClass: "text-gray-500",
      rowClass: "bg-gray-50 hover:bg-gray-100",
      iconClass: "text-gray-400",
      tasks: data?.later || [],
    },
  ];

  const totalPending = sections.reduce((sum, s) => sum + s.tasks.length, 0);

  return (
    <SalesLayout title="Follow-ups" subtitle="Everything scheduled — tap a follow-up to open the company">
      <div className="max-w-3xl">
        {isLoading && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                Loading follow-ups...
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && totalPending === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              {(data?.completedTodayCount || 0) > 0 ? (
                <div className="flex flex-col items-center gap-2 text-green-700">
                  <PartyPopper className="w-8 h-8" />
                  <p className="font-medium">All follow-ups done. Great work!</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <AlarmClock className="w-8 h-8 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    No follow-ups scheduled yet. Open a company and use "+ Follow-up" to schedule one after your next call.
                  </p>
                  <Link href="/sales/my-companies">
                    <Button variant="outline" size="sm" data-testid="button-go-companies">
                      <Building2 className="w-4 h-4 mr-2" />
                      Go to My Companies
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!isLoading &&
          sections.map((section) => {
            if (section.tasks.length === 0) return null;
            const SectionIcon = section.icon;
            return (
              <div key={section.key} className="mb-5">
                <div className={`flex items-center gap-1.5 text-xs font-semibold mb-2 ${section.headerClass}`}>
                  <SectionIcon className="w-3.5 h-3.5" />
                  {section.label.toUpperCase()} ({section.tasks.length})
                </div>
                <div className="space-y-1.5">
                  {section.tasks.map((task) => {
                    const Icon = TYPE_ICONS[task.taskType] || Phone;
                    return (
                      <div
                        key={task.id}
                        onClick={() => openCompany(task)}
                        data-testid={`row-followup-${task.id}`}
                        className={`flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${section.rowClass}`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${section.iconClass}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-semibold text-sm text-gray-900">
                              {task.companyName || "Unknown company"}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          </div>
                          <div className="text-sm text-gray-700 mt-0.5">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {task.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {dueLabel(task, section.key)}
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
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                                data-testid={`button-snooze-${task.id}`}
                              >
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
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setCompleteTask(task)}
                            data-testid={`button-done-${task.id}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Done
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        {!isLoading && (data?.completedToday?.length || 0) > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold mb-2 text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              COMPLETED TODAY ({data!.completedToday.length})
            </div>
            <div className="space-y-1.5">
              {data!.completedToday.map((task) => {
                const Icon = TYPE_ICONS[task.taskType] || Phone;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-green-50/60"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 text-green-500" />
                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-600 font-medium">
                        {task.companyName || "Unknown company"}
                      </span>
                      <span className="text-xs text-gray-400 truncate">{task.title}</span>
                    </div>
                    {task.completedAt && (
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {format(new Date(task.completedAt), "h:mm a")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {completeTask && (
        <CompleteFollowUpDialog
          open={!!completeTask}
          onOpenChange={(open) => {
            if (!open) setCompleteTask(null);
          }}
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
    </SalesLayout>
  );
}
