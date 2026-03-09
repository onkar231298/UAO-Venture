import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format, addDays } from "date-fns";
import { Phone, Users, Mail, MessageCircle, Building2, Calendar, Clock } from "lucide-react";

const FOLLOW_UP_TYPES = [
  { value: "call", label: "Call", icon: Phone },
  { value: "meeting", label: "Meeting", icon: Users },
  { value: "email", label: "Email", icon: Mail },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "site_visit", label: "Site Visit", icon: Building2 },
];

const PRIORITY_OPTIONS = [
  { value: "high", label: "High", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "medium", label: "Normal", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "low", label: "Low", color: "bg-blue-100 text-blue-700 border-blue-200" },
];

const schema = z.object({
  taskType: z.string().min(1, "Please select a type"),
  title: z.string().min(1, "Title is required"),
  dueDate: z.string().min(1, "Please select a date"),
  dueTime: z.string().optional(),
  priority: z.string().default("medium"),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface FollowUpSchedulerProps {
  companyId: number;
  companyName: string;
  defaultType?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduled?: (task: any) => void;
  inline?: boolean;
  onInlineScheduled?: (values: FormValues) => void;
}

export function FollowUpScheduler({
  companyId,
  companyName,
  defaultType = "call",
  open,
  onOpenChange,
  onScheduled,
  inline = false,
  onInlineScheduled,
}: FollowUpSchedulerProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: staffList = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/employees"],
    enabled: !inline || open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      taskType: defaultType,
      title: getDefaultTitle(defaultType, companyName),
      dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      dueTime: "",
      priority: "medium",
      description: "",
      assignedTo: user?.id || "",
    },
  });

  function getDefaultTitle(type: string, company: string) {
    const typeMap: Record<string, string> = {
      call: `Follow-up call with ${company}`,
      meeting: `Meeting with ${company}`,
      email: `Follow-up email to ${company}`,
      whatsapp: `WhatsApp follow-up with ${company}`,
      site_visit: `Site visit to ${company}`,
    };
    return typeMap[type] || `Follow-up with ${company}`;
  }

  const createTaskMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const dueDate = values.dueDate
        ? values.dueTime
          ? new Date(`${values.dueDate}T${values.dueTime}:00`)
          : new Date(`${values.dueDate}T09:00:00`)
        : null;

      return apiRequest(`/api/crm/companies/${companyId}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          taskType: values.taskType,
          title: values.title,
          description: values.description || null,
          dueDate: dueDate?.toISOString(),
          priority: values.priority,
          assignedTo: values.assignedTo || user?.id,
          status: "pending",
        }),
      });
    },
    onSuccess: (task) => {
      toast({ title: `Follow-up scheduled for ${format(new Date(form.getValues("dueDate")), "MMM d, yyyy")}` });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/crm/companies/${companyId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/follow-ups/today"] });
      onScheduled?.(task);
      onOpenChange(false);
      form.reset({
        taskType: defaultType,
        title: getDefaultTitle(defaultType, companyName),
        dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        dueTime: "",
        priority: "medium",
        description: "",
        assignedTo: user?.id || "",
      });
    },
    onError: () => {
      toast({ title: "Failed to schedule follow-up", variant: "destructive" });
    },
  });

  const handleQuickDate = (days: number) => {
    form.setValue("dueDate", format(addDays(new Date(), days), "yyyy-MM-dd"));
  };

  const handleTypeChange = (type: string) => {
    form.setValue("taskType", type);
    form.setValue("title", getDefaultTitle(type, companyName));
  };

  const onSubmit = (values: FormValues) => {
    if (inline && onInlineScheduled) {
      onInlineScheduled(values);
    } else {
      createTaskMutation.mutate(values);
    }
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="taskType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Follow-up Type</FormLabel>
              <div className="flex flex-wrap gap-2">
                {FOLLOW_UP_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleTypeChange(type.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                        field.value === type.value
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="What's this follow-up about?" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Date</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {[
              { label: "Tomorrow", days: 1 },
              { label: "In 3 Days", days: 3 },
              { label: "Next Week", days: 7 },
              { label: "In 2 Weeks", days: 14 },
            ].map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() => handleQuickDate(opt.days)}
                className="px-3 py-1 text-sm border rounded-md hover:bg-green-50 hover:border-green-400 transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input type="date" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueTime"
              render={({ field }) => (
                <FormItem className="w-36">
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input type="time" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => form.setValue("priority", opt.value)}
                    className={`px-3 py-1.5 text-sm rounded-md border font-medium transition-colors ${
                      field.value === opt.value ? opt.color + " border-current" : "border-gray-300 text-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes / Agenda <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="What do you want to discuss? Any agenda points..."
                  rows={3}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {staffList.length > 0 && (
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign To</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {staffList.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-2 justify-end pt-2">
          {!inline && (
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={createTaskMutation.isPending}>
            {createTaskMutation.isPending ? "Scheduling..." : "Schedule Follow-up"}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (inline) {
    return <div className="pt-2">{formContent}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-600" />
            Schedule Next Follow-up
            <span className="text-gray-500 font-normal text-base">with {companyName}</span>
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
