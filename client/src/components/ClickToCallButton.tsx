import { useState } from "react";
import { Phone, PhoneOff, Loader2, X, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ClickToCallButtonProps {
  recipientPhone: string;
  recipientName?: string;
  leadId?: number;
  companyId?: number;
  contactId?: number;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

type CallStatus = "idle" | "initiating" | "ringing" | "in-progress" | "completed" | "failed" | "busy" | "no-answer";

const CALL_OUTCOMES = [
  { value: "connected", label: "Connected - Spoke with contact" },
  { value: "voicemail", label: "Left Voicemail" },
  { value: "no-answer", label: "No Answer" },
  { value: "busy", label: "Busy / Line Engaged" },
  { value: "wrong-number", label: "Wrong Number" },
  { value: "follow-up-needed", label: "Follow-up Needed" },
  { value: "not-interested", label: "Not Interested" },
  { value: "callback-requested", label: "Callback Requested" },
];

export default function ClickToCallButton({
  recipientPhone,
  recipientName,
  leadId,
  companyId,
  contactId,
  variant = "outline",
  size = "sm",
  className = "",
  showLabel = true,
}: ClickToCallButtonProps) {
  const [showCallModal, setShowCallModal] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [currentCallLog, setCurrentCallLog] = useState<any>(null);
  const [callNotes, setCallNotes] = useState("");
  const [callOutcome, setCallOutcome] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: voiceStatus } = useQuery<{ configured: boolean; phoneNumber: string | null }>({
    queryKey: ['/api/voice/status'],
  });

  const initiateCallMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/voice/initiate', {
        method: 'POST',
        body: JSON.stringify({
          recipientPhone,
          recipientName,
          leadId,
          companyId,
          contactId,
        }),
      });
    },
    onSuccess: (data: any) => {
      setCurrentCallLog(data.callLog);
      setCallStatus("ringing");
      toast({
        title: "Call Initiated",
        description: `Calling ${recipientName || recipientPhone}...`,
      });
      startPollingCallStatus(data.callLog.id);
    },
    onError: (error: any) => {
      setCallStatus("failed");
      toast({
        title: "Call Failed",
        description: error.message || "Failed to initiate call",
        variant: "destructive",
      });
    },
  });

  const updateCallLogMutation = useMutation({
    mutationFn: async (data: { notes?: string; outcome?: string }) => {
      if (!currentCallLog?.id) return;
      return apiRequest(`/api/voice/${currentCallLog.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: ['/api/leads', leadId, 'calls'] });
        queryClient.invalidateQueries({ queryKey: ['/api/crm/leads', leadId, 'activities'] });
      }
      if (companyId) {
        queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'call-logs'] });
        queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'activities'] });
      }
      toast({
        title: "Call Notes Saved",
        description: "Your call notes and outcome have been recorded.",
      });
    },
  });

  const startPollingCallStatus = (callLogId: number) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/voice/${callLogId}`);
        if (response.ok) {
          const callLog = await response.json();
          setCurrentCallLog(callLog);
          
          if (callLog.status === "in-progress") {
            setCallStatus("in-progress");
          } else if (["completed", "failed", "busy", "no-answer"].includes(callLog.status)) {
            setCallStatus(callLog.status as CallStatus);
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error("Error polling call status:", error);
      }
    }, 2000);

    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  const handleStartCall = () => {
    if (!voiceStatus?.configured) {
      toast({
        title: "Calling Not Configured",
        description: "Twilio calling is not set up. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }
    
    setShowCallModal(true);
    setCallStatus("initiating");
    setCallNotes("");
    setCallOutcome("");
    initiateCallMutation.mutate();
  };

  const handleCloseModal = () => {
    if (callNotes || callOutcome) {
      updateCallLogMutation.mutate({ notes: callNotes, outcome: callOutcome });
    }
    setShowCallModal(false);
    setCallStatus("idle");
    setCurrentCallLog(null);
    if (audioRef) {
      audioRef.pause();
      setIsPlaying(false);
    }
  };

  const handleSaveNotes = () => {
    updateCallLogMutation.mutate({ notes: callNotes, outcome: callOutcome });
  };

  const togglePlayRecording = () => {
    if (!currentCallLog?.recordingUrl) return;
    
    if (audioRef) {
      if (isPlaying) {
        audioRef.pause();
        setIsPlaying(false);
      } else {
        audioRef.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(currentCallLog.recordingUrl);
      audio.onended = () => setIsPlaying(false);
      setAudioRef(audio);
      audio.play();
      setIsPlaying(true);
    }
  };

  const getStatusDisplay = () => {
    switch (callStatus) {
      case "initiating":
        return { icon: <Loader2 className="h-8 w-8 animate-spin text-blue-500" />, text: "Initiating call..." };
      case "ringing":
        return { icon: <Phone className="h-8 w-8 text-yellow-500 animate-pulse" />, text: "Ringing..." };
      case "in-progress":
        return { icon: <Phone className="h-8 w-8 text-green-500" />, text: "Call in progress" };
      case "completed":
        return { icon: <PhoneOff className="h-8 w-8 text-gray-500" />, text: "Call completed" };
      case "failed":
        return { icon: <PhoneOff className="h-8 w-8 text-red-500" />, text: "Call failed" };
      case "busy":
        return { icon: <PhoneOff className="h-8 w-8 text-orange-500" />, text: "Line busy" };
      case "no-answer":
        return { icon: <PhoneOff className="h-8 w-8 text-gray-500" />, text: "No answer" };
      default:
        return { icon: <Phone className="h-8 w-8" />, text: "Ready to call" };
    }
  };

  const statusDisplay = getStatusDisplay();
  const isCallEnded = ["completed", "failed", "busy", "no-answer"].includes(callStatus);

  if (!recipientPhone) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleStartCall}
        disabled={initiateCallMutation.isPending}
        data-testid="button-click-to-call"
      >
        <Phone className="h-4 w-4" />
        {showLabel && <span className="ml-1">Call</span>}
      </Button>

      <Dialog open={showCallModal} onOpenChange={setShowCallModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              {isCallEnded ? "Call Ended" : "Calling..."}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                {statusDisplay.icon}
              </div>
              <p className="text-lg font-medium">{recipientName || "Unknown"}</p>
              <p className="text-sm text-gray-500">{recipientPhone}</p>
              <p className="text-sm mt-2">{statusDisplay.text}</p>
              
              {currentCallLog?.durationSeconds > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Duration: {Math.floor(currentCallLog.durationSeconds / 60)}:{String(currentCallLog.durationSeconds % 60).padStart(2, '0')}
                </p>
              )}
            </div>

            {isCallEnded && currentCallLog?.recordingUrl && (
              <div className="border rounded-lg p-3">
                <Label className="text-sm font-medium mb-2 block">Recording</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePlayRecording}
                    data-testid="button-play-recording"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isPlaying ? "Pause" : "Play Recording"}
                  </Button>
                  {currentCallLog?.recordingDuration && (
                    <span className="text-sm text-gray-500">
                      {Math.floor(currentCallLog.recordingDuration / 60)}:{String(currentCallLog.recordingDuration % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {isCallEnded && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="callOutcome">Call Outcome</Label>
                  <Select value={callOutcome} onValueChange={setCallOutcome}>
                    <SelectTrigger data-testid="select-call-outcome">
                      <SelectValue placeholder="Select outcome..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CALL_OUTCOMES.map((outcome) => (
                        <SelectItem key={outcome.value} value={outcome.value}>
                          {outcome.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="callNotes">Call Notes</Label>
                  <Textarea
                    id="callNotes"
                    placeholder="Add notes about this call..."
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    rows={3}
                    data-testid="input-call-notes"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              {isCallEnded && (callNotes || callOutcome) && (
                <Button
                  variant="outline"
                  onClick={handleSaveNotes}
                  disabled={updateCallLogMutation.isPending}
                  data-testid="button-save-call-notes"
                >
                  {updateCallLogMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Save Notes
                </Button>
              )}
              <Button onClick={handleCloseModal} data-testid="button-close-call-modal">
                {isCallEnded ? "Close" : "End Call"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
