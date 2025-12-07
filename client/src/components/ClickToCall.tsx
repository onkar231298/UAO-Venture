import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, PhoneOff, Loader2, Clock, AlertTriangle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ClickToCallProps {
  phoneNumber: string;
  recipientName?: string;
  leadId?: number;
  companyId?: number;
  contactId?: number;
  variant?: "default" | "icon" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

interface CallState {
  isActive: boolean;
  callUuid?: string;
  callLogId?: number;
  status: string;
  startTime?: Date;
  duration: number;
}

export default function ClickToCall({
  phoneNumber,
  recipientName,
  leadId,
  companyId,
  contactId,
  variant = "default",
  size = "sm",
  className = "",
}: ClickToCallProps) {
  const { toast } = useToast();
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    status: "idle",
    duration: 0,
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: plivoStatus } = useQuery({
    queryKey: ['/api/plivo/status'],
    staleTime: 60000,
  });

  const initiateCallMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/plivo/call', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber,
          recipientName,
          leadId,
          companyId,
          contactId,
        }),
      });
      return response;
    },
    onSuccess: (data) => {
      setCallState({
        isActive: true,
        callUuid: data.callUuid,
        callLogId: data.callLogId,
        status: "ringing",
        startTime: new Date(),
        duration: 0,
      });
      toast({
        title: "Call Initiated",
        description: `Calling ${recipientName || phoneNumber}...`,
      });
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Call Failed",
        description: error.message || "Failed to initiate call",
        variant: "destructive",
      });
      setCallState({
        isActive: false,
        status: "idle",
        duration: 0,
      });
    },
  });

  const endCallMutation = useMutation({
    mutationFn: async () => {
      if (!callState.callUuid) throw new Error("No active call");
      await apiRequest('/api/plivo/hangup-call', {
        method: 'POST',
        body: JSON.stringify({ callUuid: callState.callUuid }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Call Ended",
        description: `Call with ${recipientName || phoneNumber} ended`,
      });
      setCallState({
        isActive: false,
        status: "ended",
        duration: callState.duration,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to end call",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState.isActive && callState.startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - callState.startTime!.getTime()) / 1000);
        setCallState((prev) => ({ ...prev, duration: diff }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState.isActive, callState.startTime]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCallClick = () => {
    if (!plivoStatus?.configured) {
      toast({
        title: "Calling Not Available",
        description: "Voice calling is not configured. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmCall = () => {
    initiateCallMutation.mutate();
  };

  const handleEndCall = () => {
    endCallMutation.mutate();
  };

  const isLoading = initiateCallMutation.isPending;

  if (callState.isActive) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg border border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">{formatDuration(callState.duration)}</span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleEndCall}
          disabled={endCallMutation.isPending}
          data-testid="button-end-call"
        >
          {endCallMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PhoneOff className="h-4 w-4" />
          )}
          <span className="ml-1">End Call</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCallClick}
          disabled={isLoading || !phoneNumber}
          className={className}
          data-testid="button-call-icon"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Phone className="h-4 w-4 text-green-600" />
          )}
        </Button>
      ) : (
        <Button
          variant={variant === "outline" ? "outline" : "default"}
          size={size}
          onClick={handleCallClick}
          disabled={isLoading || !phoneNumber}
          className={`${variant !== "outline" ? "bg-green-600 hover:bg-green-700" : "border-green-600 text-green-600 hover:bg-green-50"} ${className}`}
          data-testid="button-call"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Phone className="h-4 w-4 mr-1" />
          )}
          Call
        </Button>
      )}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Confirm Call
            </DialogTitle>
            <DialogDescription>
              You are about to call {recipientName || "this contact"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">{recipientName || "Unknown"}</p>
                <p className="text-sm text-gray-500">{phoneNumber}</p>
              </div>
            </div>
            {!plivoStatus?.configured && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm">Voice calling is not currently configured.</p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              This call will be recorded for quality and training purposes. The recording will be available in the activity history.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              data-testid="button-cancel-call"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCall}
              disabled={initiateCallMutation.isPending || !plivoStatus?.configured}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-call"
            >
              {initiateCallMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Calling...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Start Call
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
