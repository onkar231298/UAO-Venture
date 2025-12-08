import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";
import {
  Phone,
  PhoneOff,
  MessageSquare,
  Voicemail,
  History,
  Delete,
  Send,
  Play,
  Pause,
  AlertCircle,
  Clock,
  PhoneCall,
  PhoneMissed,
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react";

interface DialerProps {
  leadId?: number;
  companyId?: number;
  contactName?: string;
  phoneNumber?: string;
  onCallComplete?: () => void;
}

interface CallLog {
  id: number;
  callUuid: string | null;
  callerUserId: string | null;
  callerPhone: string | null;
  recipientPhone: string;
  recipientName: string | null;
  direction: string;
  status: string;
  leadId: number | null;
  companyId: number | null;
  initiatedAt: string;
  ringingAt: string | null;
  answeredAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
  recordingUrl: string | null;
  notes: string | null;
  disposition: string | null;
}

interface SmsMessage {
  id: number;
  content: string;
  direction: string;
  status: string;
  recipientPhone: string;
  sentAt: string | null;
  createdAt: string;
}

interface Voicemail {
  id: number;
  callerPhone: string;
  callerName: string | null;
  recordingUrl: string | null;
  transcription: string | null;
  durationSeconds: number | null;
  isListened: boolean;
  receivedAt: string;
}

const dialPadButtons = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
];

export function Dialer({
  leadId,
  companyId,
  contactName,
  phoneNumber: initialPhoneNumber,
  onCallComplete,
}: DialerProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dialer");
  const [smsMessage, setSmsMessage] = useState("");
  const [isInCall, setIsInCall] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [playingRecording, setPlayingRecording] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: voiceStatus } = useQuery({
    queryKey: ["/api/voice/status"],
  });

  const { data: callLogs = [] } = useQuery<CallLog[]>({
    queryKey: ["/api/crm/leads", leadId, "call-logs"],
    enabled: !!leadId,
  });

  const { data: companyCallLogs = [] } = useQuery<CallLog[]>({
    queryKey: ["/api/crm/companies", companyId, "call-logs"],
    enabled: !!companyId && !leadId,
  });

  const { data: smsMessages = [] } = useQuery<SmsMessage[]>({
    queryKey: ["/api/crm/leads", leadId, "sms"],
    enabled: !!leadId,
  });

  const { data: voicemails } = useQuery<{ voicemails: Voicemail[]; total: number }>({
    queryKey: ["/api/voice/voicemails"],
  });

  const allCallLogs = leadId ? callLogs : companyCallLogs;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInCall]);

  const initiateCallMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; leadId?: number; companyId?: number; contactName?: string }) => {
      return apiRequest("/api/voice/call", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data: any) => {
      if (data.success) {
        setIsInCall(true);
        setCurrentCallId(data.callId);
        setCallDuration(0);
        toast({
          title: "Call Initiated",
          description: "Connecting your call...",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Call Failed",
        description: error.message || "Failed to initiate call",
        variant: "destructive",
      });
    },
  });

  const endCallMutation = useMutation({
    mutationFn: async (callId: string) => {
      return apiRequest(`/api/voice/call/${callId}/end`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      setIsInCall(false);
      setCurrentCallId(null);
      setCallDuration(0);
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", leadId, "call-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "call-logs"] });
      toast({
        title: "Call Ended",
        description: `Call duration: ${formatDuration(callDuration)}`,
      });
      onCallComplete?.();
    },
  });

  const sendSmsMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string; leadId?: number; companyId?: number; contactName?: string }) => {
      return apiRequest("/api/voice/sms", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setSmsMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", leadId, "sms"] });
      toast({
        title: "SMS Sent",
        description: "Your message has been sent.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "SMS Failed",
        description: error.message || "Failed to send SMS",
        variant: "destructive",
      });
    },
  });

  const markVoicemailListenedMutation = useMutation({
    mutationFn: async (voicemailId: number) => {
      return apiRequest(`/api/voice/voicemails/${voicemailId}/listened`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voice/voicemails"] });
    },
  });

  const handleDigitPress = useCallback((digit: string) => {
    setPhoneNumber((prev) => prev + digit);
  }, []);

  const handleBackspace = useCallback(() => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  }, []);

  const handleCall = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Invalid Number",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    initiateCallMutation.mutate({
      phoneNumber: phoneNumber.trim(),
      leadId,
      companyId,
      contactName,
    });
  };

  const handleEndCall = () => {
    if (currentCallId) {
      endCallMutation.mutate(currentCallId);
    } else {
      setIsInCall(false);
    }
  };

  const handleSendSms = () => {
    if (!phoneNumber.trim() || !smsMessage.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter both phone number and message",
        variant: "destructive",
      });
      return;
    }

    sendSmsMutation.mutate({
      phoneNumber: phoneNumber.trim(),
      message: smsMessage.trim(),
      leadId,
      companyId,
      contactName,
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCallStatusIcon = (status: string, direction: string) => {
    if (direction === "inbound") {
      return status === "missed" ? <PhoneMissed className="h-4 w-4 text-red-500" /> : <PhoneIncoming className="h-4 w-4 text-green-500" />;
    }
    return status === "completed" ? <PhoneOutgoing className="h-4 w-4 text-green-500" /> : <PhoneCall className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      answered: "bg-green-100 text-green-800",
      missed: "bg-red-100 text-red-800",
      failed: "bg-red-100 text-red-800",
      voicemail: "bg-purple-100 text-purple-800",
      ringing: "bg-yellow-100 text-yellow-800",
      initiating: "bg-blue-100 text-blue-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const isConfigured = voiceStatus?.configured ?? false;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="open-dialer-btn">
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">Dialer</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Dialer
            {!isConfigured && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dialer" data-testid="tab-dialer">
              <Phone className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="sms" data-testid="tab-sms">
              <MessageSquare className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="voicemail" data-testid="tab-voicemail">
              <Voicemail className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dialer" className="space-y-4">
            {isInCall ? (
              <div className="text-center space-y-4 py-8">
                <div className="animate-pulse">
                  <PhoneCall className="h-16 w-16 mx-auto text-green-500" />
                </div>
                <div className="text-2xl font-semibold">{formatDuration(callDuration)}</div>
                <div className="text-muted-foreground">
                  {contactName || phoneNumber}
                </div>
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full w-16 h-16"
                  onClick={handleEndCall}
                  data-testid="btn-end-call"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="text-center text-xl h-14 pr-10"
                    data-testid="input-phone-number"
                  />
                  {phoneNumber && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={handleBackspace}
                      data-testid="btn-backspace"
                    >
                      <Delete className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {dialPadButtons.map((btn) => (
                    <Button
                      key={btn.digit}
                      variant="outline"
                      className="h-14 flex flex-col"
                      onClick={() => handleDigitPress(btn.digit)}
                      data-testid={`dialpad-${btn.digit}`}
                    >
                      <span className="text-xl font-semibold">{btn.digit}</span>
                      {btn.letters && (
                        <span className="text-[10px] text-muted-foreground">{btn.letters}</span>
                      )}
                    </Button>
                  ))}
                </div>

                <div className="flex justify-center">
                  <Button
                    size="lg"
                    className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
                    onClick={handleCall}
                    disabled={!phoneNumber.trim() || initiateCallMutation.isPending || !isConfigured}
                    data-testid="btn-call"
                  >
                    <Phone className="h-6 w-6" />
                  </Button>
                </div>

                {!isConfigured && (
                  <p className="text-center text-sm text-muted-foreground">
                    net2phone is not configured. Please add API credentials to enable calling.
                  </p>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone number"
              data-testid="sms-phone-number"
            />
            <Textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              data-testid="sms-message"
            />
            <Button
              className="w-full"
              onClick={handleSendSms}
              disabled={!phoneNumber.trim() || !smsMessage.trim() || sendSmsMutation.isPending || !isConfigured}
              data-testid="btn-send-sms"
            >
              <Send className="h-4 w-4 mr-2" />
              Send SMS
            </Button>

            {smsMessages.length > 0 && (
              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-2">
                  {smsMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-2 rounded-lg ${
                        msg.direction === "outbound"
                          ? "bg-blue-100 ml-8"
                          : "bg-gray-100 mr-8"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {msg.sentAt
                          ? format(new Date(msg.sentAt), "MMM d, h:mm a")
                          : format(new Date(msg.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="history">
            <ScrollArea className="h-[300px]">
              {allCallLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No call history</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allCallLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                      data-testid={`call-log-${log.id}`}
                    >
                      {getCallStatusIcon(log.status, log.direction)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {log.recipientName || log.recipientPhone}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(log.initiatedAt), { addSuffix: true })}
                          {log.durationSeconds > 0 && (
                            <span>• {formatDuration(log.durationSeconds)}</span>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusBadge(log.status)}>
                        {log.status}
                      </Badge>
                      {log.recordingUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (playingRecording === log.id) {
                              setPlayingRecording(null);
                            } else {
                              setPlayingRecording(log.id);
                            }
                          }}
                          data-testid={`play-recording-${log.id}`}
                        >
                          {playingRecording === log.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="voicemail">
            <ScrollArea className="h-[300px]">
              {!voicemails?.voicemails?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Voicemail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No voicemails</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {voicemails.voicemails.map((vm) => (
                    <div
                      key={vm.id}
                      className={`p-3 border rounded-lg ${!vm.isListened ? "bg-blue-50" : ""}`}
                      data-testid={`voicemail-${vm.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Voicemail className="h-5 w-5 text-purple-500" />
                        <div className="flex-1">
                          <div className="font-medium">
                            {vm.callerName || vm.callerPhone}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(vm.receivedAt), { addSuffix: true })}
                            {vm.durationSeconds && ` • ${formatDuration(vm.durationSeconds)}`}
                          </div>
                        </div>
                        {!vm.isListened && (
                          <Badge variant="secondary">New</Badge>
                        )}
                        {vm.recordingUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              markVoicemailListenedMutation.mutate(vm.id);
                            }}
                            data-testid={`play-voicemail-${vm.id}`}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {vm.transcription && (
                        <p className="text-sm text-muted-foreground mt-2 pl-8">
                          {vm.transcription}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function ClickToCall({
  phoneNumber,
  contactName,
  leadId,
  companyId,
  onCallComplete,
}: {
  phoneNumber: string;
  contactName?: string;
  leadId?: number;
  companyId?: number;
  onCallComplete?: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: voiceStatus } = useQuery({
    queryKey: ["/api/voice/status"],
  });

  const initiateCallMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; leadId?: number; companyId?: number; contactName?: string }) => {
      return apiRequest("/api/voice/call", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({
          title: "Call Initiated",
          description: `Calling ${contactName || phoneNumber}...`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", leadId, "call-logs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "call-logs"] });
        onCallComplete?.();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Call Failed",
        description: error.message || "Failed to initiate call",
        variant: "destructive",
      });
    },
  });

  const isConfigured = voiceStatus?.configured ?? false;

  const handleClick = () => {
    if (!isConfigured) {
      toast({
        title: "Phone Not Configured",
        description: "net2phone integration is not set up",
        variant: "destructive",
      });
      return;
    }

    initiateCallMutation.mutate({
      phoneNumber,
      leadId,
      companyId,
      contactName,
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
      onClick={handleClick}
      disabled={initiateCallMutation.isPending}
      title={isConfigured ? `Call ${phoneNumber}` : "Phone not configured"}
      data-testid="click-to-call"
    >
      <Phone className="h-4 w-4" />
      {phoneNumber}
    </Button>
  );
}

export function SendSmsButton({
  phoneNumber,
  contactName,
  leadId,
  companyId,
}: {
  phoneNumber: string;
  contactName?: string;
  leadId?: number;
  companyId?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: voiceStatus } = useQuery({
    queryKey: ["/api/voice/status"],
  });

  const sendSmsMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string; leadId?: number; companyId?: number; contactName?: string }) => {
      return apiRequest("/api/voice/sms", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setMessage("");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", leadId, "sms"] });
      toast({
        title: "SMS Sent",
        description: `Message sent to ${contactName || phoneNumber}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "SMS Failed",
        description: error.message || "Failed to send SMS",
        variant: "destructive",
      });
    },
  });

  const isConfigured = voiceStatus?.configured ?? false;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          title={isConfigured ? `SMS ${phoneNumber}` : "SMS not configured"}
          data-testid="send-sms-btn"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send SMS to {contactName || phoneNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={4}
            data-testid="sms-dialog-message"
          />
          <Button
            className="w-full"
            onClick={() => {
              sendSmsMutation.mutate({
                phoneNumber,
                message,
                leadId,
                companyId,
                contactName,
              });
            }}
            disabled={!message.trim() || sendSmsMutation.isPending || !isConfigured}
            data-testid="sms-dialog-send"
          >
            <Send className="h-4 w-4 mr-2" />
            Send SMS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Dialer;
