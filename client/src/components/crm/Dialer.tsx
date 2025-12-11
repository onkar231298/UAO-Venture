import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCallStateOptional, type CallEndInfo } from "@/contexts/CallStateContext";
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
  ExternalLink,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Keyboard,
  UserPlus,
  PauseCircle,
  User,
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
  const [playingRecording, setPlayingRecording] = useState<number | null>(null);
  const [showInCallKeypad, setShowInCallKeypad] = useState(false);
  // Local call state fallback - used when context is not available
  const [localIsInCall, setLocalIsInCall] = useState(false);
  const [localCallStatus, setLocalCallStatus] = useState<'idle' | 'dialing' | 'ringing' | 'connected' | 'ended'>('idle');
  const [localCallDuration, setLocalCallDuration] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use shared call state from context (updated by FrejunDialerWidget)
  const sharedCallState = useCallStateOptional();
  
  // Debug: Log shared call state availability
  console.log('📞 Dialer: sharedCallState available:', !!sharedCallState, 'isInCall:', sharedCallState?.isInCall, 'localIsInCall:', localIsInCall);
  
  // Listen for Frejun events to update local state
  // Per Frejun docs, only these events are sent: ready, close, incoming-call, unauthorized, height-change, end-call-error, call-ended
  // We DO NOT receive real-time call status events like "connected" or "ringing" - that's internal to the widget
  useEffect(() => {
    const handleFrejunMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://dialer.frejun.com') return;
      const eventData = event.data || {};
      const eventName = eventData.eventName || '';
      
      console.log('📞 Dialer - Frejun event received:', eventName, eventData);
      
      // Per documentation, only handle documented events
      if (eventName === 'call-ended') {
        // Call has ended - reset local state
        console.log('📞 Dialer - call-ended received, resetting local state');
        setLocalIsInCall(false);
        setLocalCallStatus('idle');
        setLocalCallDuration(0);
        // Invalidate call logs
        if (leadId) {
          queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", leadId, "call-logs"] });
        }
        if (companyId) {
          queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "call-logs"] });
        }
        onCallComplete?.();
      } else if (eventName === 'close') {
        // Widget closed - reset state
        console.log('📞 Dialer - close received, resetting local state');
        setLocalIsInCall(false);
        setLocalCallStatus('idle');
        setLocalCallDuration(0);
      } else if (eventName === 'incoming-call') {
        // Incoming call - show in-call UI
        console.log('📞 Dialer - incoming-call received');
        setLocalIsInCall(true);
        setLocalCallStatus('ringing');
        setLocalCallDuration(0);
      }
    };
    
    window.addEventListener('message', handleFrejunMessage);
    return () => window.removeEventListener('message', handleFrejunMessage);
  }, [leadId, companyId, queryClient, onCallComplete]);
  
  // Register callback to handle call end events (including remote hangups)
  useEffect(() => {
    if (!sharedCallState?.registerOnCallEnd) return;
    
    const handleCallEnd = (info: CallEndInfo) => {
      // Determine if this Dialer should handle this call end event
      // Using strict matching to prevent cross-triggering between multiple Dialer instances
      
      // Lead-specific dialer: only match exact lead
      const isLeadDialer = !!leadId;
      const exactLeadMatch = isLeadDialer && info.leadId === leadId;
      
      // Company-specific dialer (without lead): only match exact company
      // Important: This should NOT match if this is a lead-scoped dialer
      const isCompanyOnlyDialer = !leadId && !!companyId;
      const exactCompanyMatch = isCompanyOnlyDialer && info.companyId === companyId;
      
      // Generic dialer (no specific context) handles calls without metadata
      const isGenericDialer = !leadId && !companyId;
      const callHasNoContext = !info.leadId && !info.companyId;
      const genericMatch = isGenericDialer && callHasNoContext;
      
      // This Dialer has context but call metadata is missing - 
      // only match if this Dialer is for the call's context (checked via shared state)
      const contextualFallback = (leadId || companyId) && callHasNoContext && 
        ((isLeadDialer && sharedCallState?.leadId === leadId) || 
         (isCompanyOnlyDialer && sharedCallState?.companyId === companyId));
      
      // Only react if this Dialer is relevant to the call
      if (!exactLeadMatch && !exactCompanyMatch && !genericMatch && !contextualFallback) {
        // This call end belongs to a different Dialer instance
        return;
      }
      
      // Invalidate call logs for matching lead/company
      // Only invalidate for the specific match type that succeeded
      if (exactLeadMatch || (contextualFallback && isLeadDialer)) {
        if (leadId) {
          queryClient.invalidateQueries({ queryKey: ["/api/crm/leads", leadId, "call-logs"] });
        }
      }
      if (exactCompanyMatch || (contextualFallback && isCompanyOnlyDialer)) {
        if (companyId) {
          queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", companyId, "call-logs"] });
        }
      }
      // Generic dialer doesn't invalidate any specific queries - it has no context
      
      // Call the onCallComplete callback if provided
      onCallComplete?.();
      
      // Show toast for remote hangups
      if (info.wasRemoteHangup && info.duration > 0) {
        toast({
          title: "Call Ended",
          description: `Call duration: ${Math.floor(info.duration / 60)}:${(info.duration % 60).toString().padStart(2, '0')}`,
        });
      }
    };
    
    const unsubscribe = sharedCallState.registerOnCallEnd(handleCallEnd);
    return () => unsubscribe();
  }, [sharedCallState, leadId, companyId, queryClient, onCallComplete, toast]);
  
  // Get call state - prioritize local state for immediate UI response
  // Per Frejun docs, we don't receive real-time status updates, so we use optimistic UI
  const isInCall = localIsInCall || (sharedCallState?.isInCall ?? false);
  const callStatus = localCallStatus !== 'idle' ? localCallStatus : (sharedCallState?.callStatus ?? 'idle');
  const callDuration = localCallDuration > 0 ? localCallDuration : (sharedCallState?.callDuration ?? 0);
  const currentCallId = sharedCallState?.currentCallId ?? null;
  const callingNumber = sharedCallState?.callingNumber ?? "";
  const isMuted = sharedCallState?.isMuted ?? false;
  const isSpeaker = sharedCallState?.isSpeaker ?? false;
  const isOnHold = sharedCallState?.isOnHold ?? false;
  
  // Duration timer for local state - starts immediately when call is initiated
  // Since Frejun doesn't send "connected" events, we start timing from when user clicks call
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (localIsInCall) {
      // Start timer immediately when call is initiated (optimistic UI)
      // After 3 seconds, assume connected and start counting
      const startDelay = setTimeout(() => {
        setLocalCallStatus('connected');
      }, 3000);
      
      timer = setInterval(() => {
        if (localCallStatus === 'connected') {
          setLocalCallDuration(d => d + 1);
        }
      }, 1000);
      
      return () => {
        clearTimeout(startDelay);
        clearInterval(timer);
      };
    }
    return () => clearInterval(timer);
  }, [localIsInCall, localCallStatus]);
  
  // Functions to update shared state
  const setIsMuted = sharedCallState?.setMuted ?? (() => {});
  const setIsSpeaker = sharedCallState?.setSpeaker ?? (() => {});
  const setIsOnHold = sharedCallState?.setOnHold ?? (() => {});

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

  const initiateCallMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; leadId?: number; companyId?: number; contactName?: string }) => {
      return apiRequest("/api/voice/call", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data: any) => {
      if (data.success) {
        console.log('📞 initiateCallMutation onSuccess - setting call state');
        // Start call in shared context - Frejun events will update the actual call status
        sharedCallState?.startCall({
          phoneNumber: phoneNumber,
          callId: data.callId,
          contactName: contactName,
          leadId: leadId,
          companyId: companyId,
        });
        // Also set local state as fallback
        setLocalIsInCall(true);
        setLocalCallStatus('dialing');
        setLocalCallDuration(0);
        setShowInCallKeypad(false);
        toast({
          title: "Call Initiated",
          description: "Connecting your call...",
        });
      }
    },
    onError: (error: any) => {
      console.log('📞 initiateCallMutation onError - resetting local state');
      // Reset local state on error
      setLocalIsInCall(false);
      setLocalCallStatus('idle');
      setLocalCallDuration(0);
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
      sharedCallState?.endCall(true);
      // Also reset local state
      setLocalIsInCall(false);
      setLocalCallStatus('idle');
      setLocalCallDuration(0);
      setShowInCallKeypad(false);
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
    // Prevent calling while already in a call or while mutation is pending
    if (isInCall || callStatus !== 'idle' || initiateCallMutation.isPending) {
      console.log('📞 handleCall blocked - isInCall:', isInCall, 'callStatus:', callStatus, 'isPending:', initiateCallMutation.isPending);
      return;
    }
    
    if (!phoneNumber.trim()) {
      toast({
        title: "Invalid Number",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    console.log('📞 handleCall - initiating call to:', phoneNumber);
    
    // IMMEDIATELY set local state to show in-call UI (don't wait for API response)
    setLocalIsInCall(true);
    setLocalCallStatus('dialing');
    setLocalCallDuration(0);
    
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
      // No call ID - just end call via shared context and local state
      sharedCallState?.endCall(true);
      setLocalIsInCall(false);
      setLocalCallStatus('idle');
      setLocalCallDuration(0);
      setShowInCallKeypad(false);
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
  const isUserConnected = voiceStatus?.isUserConnected ?? false;
  const tokenExpired = voiceStatus?.tokenExpired ?? false;
  const oauthUrl = voiceStatus?.oauthUrl;
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectFrejun = () => {
    if (oauthUrl) {
      setIsConnecting(true);
      const popup = window.open(oauthUrl, 'frejun-auth', 'width=600,height=700');
      
      // Check if popup was closed
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          setIsConnecting(false);
          queryClient.invalidateQueries({ queryKey: ["/api/voice/status"] });
        }
      }, 500);
    }
  };

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
            {isConfigured && isUserConnected && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Connected
              </Badge>
            )}
            {isConfigured && !isUserConnected && tokenExpired && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Session Expired
              </Badge>
            )}
            {isConfigured && !isUserConnected && !tokenExpired && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
            {!isConfigured && (
              <Badge variant="outline" className="text-red-600 border-red-600">
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
              <div className="flex flex-col items-center bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl p-6 -mx-2 text-white min-h-[400px]">
                {/* Contact Avatar */}
                <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mb-4 ring-4 ring-slate-600">
                  {contactName ? (
                    <span className="text-3xl font-bold text-white">
                      {contactName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  ) : (
                    <User className="h-12 w-12 text-slate-400" />
                  )}
                </div>

                {/* Contact Name */}
                <h3 className="text-xl font-semibold text-white mb-1">
                  {contactName || "Unknown"}
                </h3>
                
                {/* Phone Number */}
                <p className="text-slate-400 text-sm mb-2">{callingNumber || phoneNumber}</p>

                {/* Call Status */}
                <div className="flex items-center gap-2 mb-4">
                  {callStatus === 'dialing' && (
                    <>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                      </div>
                      <span className="text-blue-400 text-sm">Dialing...</span>
                    </>
                  )}
                  {callStatus === 'ringing' && (
                    <>
                      <Phone className="h-4 w-4 text-yellow-400 animate-pulse" />
                      <span className="text-yellow-400 text-sm">Ringing...</span>
                    </>
                  )}
                  {callStatus === 'connected' && (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-sm">Connected</span>
                    </>
                  )}
                  {callStatus === 'ended' && (
                    <span className="text-red-400 text-sm">Call Ended</span>
                  )}
                </div>

                {/* Call Duration - Only show when connected */}
                {callStatus === 'connected' && (
                  <div className="text-4xl font-mono font-light text-white mb-6 tabular-nums">
                    {formatDuration(callDuration)}
                  </div>
                )}

                {/* On Hold Indicator */}
                {isOnHold && (
                  <div className="bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm mb-4 flex items-center gap-2">
                    <PauseCircle className="h-4 w-4" />
                    On Hold
                  </div>
                )}

                {/* In-Call Keypad */}
                {showInCallKeypad && (
                  <div className="grid grid-cols-3 gap-2 mb-4 w-full max-w-[240px]">
                    {dialPadButtons.map((btn) => (
                      <Button
                        key={btn.digit}
                        variant="ghost"
                        className="h-12 flex flex-col text-white hover:bg-slate-700"
                        onClick={() => handleDigitPress(btn.digit)}
                        data-testid={`incall-dialpad-${btn.digit}`}
                      >
                        <span className="text-lg font-semibold">{btn.digit}</span>
                        {btn.letters && (
                          <span className="text-[8px] text-slate-400">{btn.letters}</span>
                        )}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Control Buttons */}
                <div className="grid grid-cols-3 gap-4 w-full max-w-[280px] mb-6">
                  {/* Mute */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                      isMuted ? 'bg-white text-slate-900' : 'bg-slate-700/50 text-white hover:bg-slate-700'
                    }`}
                    data-testid="btn-mute"
                  >
                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    <span className="text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
                  </button>

                  {/* Keypad */}
                  <button
                    onClick={() => setShowInCallKeypad(!showInCallKeypad)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                      showInCallKeypad ? 'bg-white text-slate-900' : 'bg-slate-700/50 text-white hover:bg-slate-700'
                    }`}
                    data-testid="btn-keypad"
                  >
                    <Keyboard className="h-6 w-6" />
                    <span className="text-xs">Keypad</span>
                  </button>

                  {/* Speaker */}
                  <button
                    onClick={() => setIsSpeaker(!isSpeaker)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                      isSpeaker ? 'bg-white text-slate-900' : 'bg-slate-700/50 text-white hover:bg-slate-700'
                    }`}
                    data-testid="btn-speaker"
                  >
                    {isSpeaker ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                    <span className="text-xs">{isSpeaker ? 'Speaker' : 'Speaker'}</span>
                  </button>

                  {/* Add Call */}
                  <button
                    className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-700/50 text-white hover:bg-slate-700 transition-colors"
                    data-testid="btn-add-call"
                  >
                    <UserPlus className="h-6 w-6" />
                    <span className="text-xs">Add Call</span>
                  </button>

                  {/* Hold */}
                  <button
                    onClick={() => setIsOnHold(!isOnHold)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                      isOnHold ? 'bg-orange-500 text-white' : 'bg-slate-700/50 text-white hover:bg-slate-700'
                    }`}
                    data-testid="btn-hold"
                  >
                    <PauseCircle className="h-6 w-6" />
                    <span className="text-xs">{isOnHold ? 'Resume' : 'Hold'}</span>
                  </button>

                  {/* Placeholder for symmetry */}
                  <div className="p-3"></div>
                </div>

                {/* End Call Button */}
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600 shadow-lg"
                  onClick={handleEndCall}
                  data-testid="btn-end-call"
                >
                  <PhoneOff className="h-7 w-7" />
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
                    disabled={!phoneNumber.trim() || initiateCallMutation.isPending || !isConfigured || !isUserConnected}
                    data-testid="btn-call"
                  >
                    <Phone className="h-6 w-6" />
                  </Button>
                </div>

                {isConfigured && !isUserConnected && (
                  <div className="flex flex-col items-center gap-3 pt-4 border-t">
                    <p className="text-center text-sm text-muted-foreground">
                      {tokenExpired 
                        ? "Your Frejun session has expired. Please reconnect to continue calling." 
                        : "Connect your Frejun account to enable calling"}
                    </p>
                    <Button
                      onClick={handleConnectFrejun}
                      disabled={isConnecting}
                      className="gap-2"
                      data-testid="btn-connect-frejun"
                    >
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      {isConnecting ? "Connecting..." : tokenExpired ? "Reconnect Frejun" : "Connect Frejun"}
                    </Button>
                  </div>
                )}

                {!isConfigured && (
                  <p className="text-center text-sm text-muted-foreground">
                    Frejun is not configured. Please ask your administrator to set up the integration.
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
              disabled={!phoneNumber.trim() || !smsMessage.trim() || sendSmsMutation.isPending || !isConfigured || !isUserConnected}
              data-testid="btn-send-sms"
            >
              <Send className="h-4 w-4 mr-2" />
              Send SMS
            </Button>
            
            {isConfigured && !isUserConnected && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <p className="text-center text-sm text-muted-foreground">
                  Connect your Frejun account to send SMS
                </p>
                <Button
                  onClick={handleConnectFrejun}
                  disabled={isConnecting}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  data-testid="btn-connect-frejun-sms"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  Connect Frejun
                </Button>
              </div>
            )}

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
                      className="p-3 border rounded-lg hover:bg-muted/50 space-y-2"
                      data-testid={`call-log-${log.id}`}
                    >
                      <div className="flex items-center gap-3">
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
                      {log.recordingUrl && playingRecording === log.id && (
                        <div className="pl-7 pt-2">
                          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Play className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                Call Recording
                              </span>
                            </div>
                            <audio
                              controls
                              className="w-full h-8"
                              autoPlay
                              src={log.recordingUrl}
                              onEnded={() => setPlayingRecording(null)}
                              data-testid={`audio-player-${log.id}`}
                            >
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        </div>
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
        description: "Frejun integration is not set up",
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
