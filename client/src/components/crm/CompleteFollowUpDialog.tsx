import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ChevronRight, Phone } from "lucide-react";
import { FollowUpScheduler } from "./FollowUpScheduler";
import { format, addDays } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const OUTCOME_OPTIONS = [
  { value: "spoke_to_customer", label: "Spoke to customer" },
  { value: "left_voicemail", label: "Left voicemail" },
  { value: "no_answer", label: "No answer" },
  { value: "meeting_held", label: "Meeting held" },
  { value: "email_replied", label: "Email replied" },
  { value: "reschedule_requested", label: "Reschedule requested" },
  { value: "other", label: "Other" },
];

interface CompleteFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: number;
    title: string;
    taskType: string;
    companyId: number;
    companyName: string;
  };
  onCompleted?: () => void;
}

export function CompleteFollowUpDialog({
  open,
  onOpenChange,
  task,
  onCompleted,
}: CompleteFollowUpDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [outcomeType, setOutcomeType] = useState("");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [scheduleNext, setScheduleNext] = useState<boolean | null>(null);
  const [nextTaskValues, setNextTaskValues] = useState<any>(null);

  const completeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/crm/company-tasks/${task.id}/complete-with-notes`, {
        method: "PATCH",
        body: JSON.stringify({
          outcomeType,
          outcomeNotes,
          callDuration: callDuration ? parseInt(callDuration) : undefined,
          scheduleNext: scheduleNext === true && !!nextTaskValues,
          nextTask: nextTaskValues
            ? {
                taskType: nextTaskValues.taskType,
                title: nextTaskValues.title,
                dueDate: nextTaskValues.dueDate
                  ? nextTaskValues.dueTime
                    ? new Date(`${nextTaskValues.dueDate}T${nextTaskValues.dueTime}:00`).toISOString()
                    : new Date(`${nextTaskValues.dueDate}T09:00:00`).toISOString()
                  : null,
                priority: nextTaskValues.priority || "medium",
                description: nextTaskValues.description || null,
                assignedTo: nextTaskValues.assignedTo || user?.id,
              }
            : undefined,
        }),
      });
    },
    onSuccess: (data: any) => {
      const nextMsg = data?.nextTask
        ? ` Next follow-up scheduled for ${format(new Date(data.nextTask.dueDate), "MMM d")}.`
        : "";
      toast({ title: `Follow-up completed.${nextMsg}` });
      queryClient.invalidateQueries({ queryKey: [`/api/crm/companies/${task.companyId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/follow-ups/today"] });
      onCompleted?.();
      onOpenChange(false);
      resetState();
    },
    onError: () => {
      toast({ title: "Failed to complete follow-up", variant: "destructive" });
    },
  });

  const resetState = () => {
    setStep(1);
    setOutcomeType("");
    setOutcomeNotes("");
    setCallDuration("");
    setScheduleNext(null);
    setNextTaskValues(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  const handleStep1Next = () => {
    if (!outcomeType) {
      toast({ title: "Please select an outcome", variant: "destructive" });
      return;
    }
    if (!outcomeNotes.trim()) {
      toast({ title: "Please add outcome notes", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleFinish = () => {
    if (scheduleNext === true && !nextTaskValues) {
      toast({ title: "Please fill in the follow-up details", variant: "destructive" });
      return;
    }
    completeMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Complete Follow-up
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex items-center gap-1 text-sm font-medium ${step === 1 ? "text-green-600" : "text-gray-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${step === 1 ? "border-green-600 bg-green-50 text-green-600" : "border-gray-300 bg-gray-100 text-gray-400"}`}>1</span>
            Outcome
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <div className={`flex items-center gap-1 text-sm font-medium ${step === 2 ? "text-green-600" : "text-gray-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${step === 2 ? "border-green-600 bg-green-50 text-green-600" : "border-gray-300 bg-gray-100 text-gray-400"}`}>2</span>
            Next Steps
          </div>
        </div>

        <div className="text-sm text-gray-600 bg-gray-50 rounded-md px-3 py-2 mb-4">
          <span className="font-medium">{task.title}</span>
          <span className="text-gray-400 ml-1">— {task.companyName}</span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>What happened?</Label>
              <Select value={outcomeType} onValueChange={setOutcomeType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome..." />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(task.taskType === "call" || task.taskType === "meeting") && (
              <div className="space-y-1.5">
                <Label>Duration <span className="text-gray-400 font-normal">(minutes, optional)</span></Label>
                <Input
                  type="number"
                  placeholder="e.g. 15"
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                  className="w-32"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Notes <span className="text-red-400">*</span></Label>
              <Textarea
                placeholder="What was discussed? Any key points, decisions, or commitments..."
                rows={4}
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleStep1Next} className="bg-green-600 hover:bg-green-700">
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-900 mb-3">
                Schedule next follow-up with <span className="text-green-700">{task.companyName}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setScheduleNext(true)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                    scheduleNext === true
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600 hover:border-green-300"
                  }`}
                >
                  📞 Yes, Schedule Now
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleNext(false)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                    scheduleNext === false
                      ? "border-gray-600 bg-gray-50 text-gray-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  No, Done for Now
                </button>
              </div>
            </div>

            {scheduleNext === true && (
              <div className="border rounded-lg p-3 bg-green-50/50">
                <FollowUpScheduler
                  companyId={task.companyId}
                  companyName={task.companyName}
                  defaultType={task.taskType}
                  open={true}
                  onOpenChange={() => {}}
                  inline={true}
                  onInlineScheduled={(values) => setNextTaskValues(values)}
                />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              {scheduleNext !== null && (
                <Button
                  onClick={handleFinish}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? "Saving..." : "Complete Follow-up"}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
