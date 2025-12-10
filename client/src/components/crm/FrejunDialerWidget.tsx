import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  User,
  Clock,
} from "lucide-react";

type CallState = 'idle' | 'dialing' | 'ringing' | 'connected' | 'ended';

interface FrejunDialerWidgetProps {
  phoneNumber?: string;
  contactName?: string;
  leadId?: number;
  companyId?: number;
  onCallStart?: (callId: string) => void;
  onCallEnd?: () => void;
  autoInitiate?: boolean;
}

interface DialerConfig {
  iframeSrc: string;
  authorizeMessage: {
    eventName: string;
    data: {
      access_token: string;
      user_email: string;
    };
  };
  userEmail: string;
}

const FREJUN_TARGET_ORIGIN = 'https://dialer.frejun.com';

export function FrejunDialerWidget({
  phoneNumber,
  contactName,
  leadId,
  companyId,
  onCallStart,
  onCallEnd,
  autoInitiate = false,
}: FrejunDialerWidgetProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(600);
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (callState === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      if (callState === 'idle') {
        setCallDuration(0);
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const { data: dialerConfig, isLoading, error } = useQuery<DialerConfig>({
    queryKey: ["/api/voice/frejun/dialer-config"],
    retry: false,
  });

  const { data: voiceStatus } = useQuery({
    queryKey: ["/api/voice/status"],
  });

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== FREJUN_TARGET_ORIGIN || !event.data) return;

    const eventData = event.data;
    console.log('Frejun dialer event:', eventData.eventName, eventData);

    switch (eventData.eventName) {
      case 'ready':
        setIsLoaded(true);
        if (dialerConfig && iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage(
            dialerConfig.authorizeMessage,
            FREJUN_TARGET_ORIGIN
          );
        }
        break;

      case 'unauthorized':
        setIsAuthorized(false);
        toast({
          title: "Authorization Failed",
          description: eventData.detail || "Please reconnect your Frejun account",
          variant: "destructive",
        });
        break;

      case 'authorized':
      case 'auth-success':
      case 'authentication-success':
      case 'authorization-success':
        setIsAuthorized(true);
        console.log('Frejun dialer authorized successfully');
        break;

      case 'incoming-call':
        setIsVisible(true);
        setCallState('ringing');
        toast({
          title: "Incoming Call",
          description: "You have an incoming call",
        });
        break;

      case 'call-initiated':
      case 'call-dialing':
      case 'dialing':
        setCallState('dialing');
        setIsVisible(true);
        if (eventData.data?.call_id || eventData.detail?.call_id) {
          setCurrentCallId(eventData.data?.call_id || eventData.detail?.call_id);
        }
        break;

      case 'call-ringing':
      case 'ringing':
        setCallState('ringing');
        setIsVisible(true);
        break;

      case 'call-connected':
      case 'call-answered':
      case 'connected':
      case 'answered':
        setCallState('connected');
        setCallDuration(0);
        setIsVisible(true);
        toast({
          title: "Call Connected",
          description: `Connected with ${contactName || phoneNumber}`,
        });
        break;

      case 'close':
        setIsVisible(false);
        setCallState('idle');
        setCurrentCallId(null);
        onCallEnd?.();
        break;

      case 'height-change':
        if (eventData.detail) {
          setIframeHeight(parseInt(eventData.detail, 10));
        }
        break;

      case 'call-ended':
      case 'call-disconnected':
      case 'ended':
      case 'hangup':
        setCallState('ended');
        setTimeout(() => {
          setCallState('idle');
          setCurrentCallId(null);
        }, 2000);
        onCallEnd?.();
        toast({
          title: "Call Ended",
          description: callDuration > 0 ? `Duration: ${formatDuration(callDuration)}` : "The call has been completed",
        });
        break;

      case 'end-call-error':
        toast({
          title: "Error",
          description: eventData.detail || "Failed to end call",
          variant: "destructive",
        });
        break;

      default:
        console.log('Frejun: unhandled event', eventData.eventName);
    }
  }, [dialerConfig, toast, onCallEnd, contactName, phoneNumber, callDuration]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  useEffect(() => {
    if (autoInitiate && phoneNumber && isAuthorized && dialerConfig && iframeRef.current) {
      initiateCall();
    }
  }, [autoInitiate, phoneNumber, isAuthorized, dialerConfig]);

  const initiateCall = useCallback(() => {
    if (!dialerConfig || !iframeRef.current || !phoneNumber) return;

    const message = {
      eventName: 'initiate-call',
      data: {
        user_email: dialerConfig.userEmail,
        candidate_number: phoneNumber,
        candidate_name: contactName,
        access_token: dialerConfig.authorizeMessage.data.access_token,
        transaction_id: leadId?.toString() || companyId?.toString(),
      },
    };

    iframeRef.current.contentWindow?.postMessage(message, FREJUN_TARGET_ORIGIN);

    setIsVisible(true);
    setCallState('dialing');
    setCallDuration(0);
    onCallStart?.('pending');
  }, [dialerConfig, phoneNumber, contactName, leadId, companyId, onCallStart]);

  const endCall = useCallback(() => {
    if (!iframeRef.current) return;

    iframeRef.current.contentWindow?.postMessage(
      { eventName: 'end-call' },
      FREJUN_TARGET_ORIGIN
    );
  }, []);

  const needsAuth = (error as any)?.needsAuth || !(voiceStatus as any)?.isUserConnected;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500" />
        <div>
          <h3 className="font-semibold">Connect Frejun Account</h3>
          <p className="text-sm text-muted-foreground mt-1">
            To use the dialer, please connect your Frejun account first.
          </p>
        </div>
        <Button
          onClick={() => {
            if ((error as any)?.authUrl) {
              window.open((error as any).authUrl, '_blank', 'width=600,height=700');
            } else if ((voiceStatus as any)?.oauthUrl) {
              window.open((voiceStatus as any).oauthUrl, '_blank', 'width=600,height=700');
            }
          }}
          className="gap-2"
          data-testid="btn-connect-frejun"
        >
          <ExternalLink className="h-4 w-4" />
          Connect Frejun
        </Button>
      </div>
    );
  }

  if (!(voiceStatus as any)?.configured) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <AlertCircle className="h-12 w-12 text-orange-500" />
        <div>
          <h3 className="font-semibold">Frejun Not Configured</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Please configure Frejun API credentials in the environment settings.
          </p>
        </div>
      </div>
    );
  }

  const isCallActive = callState !== 'idle';

  return (
    <div className="space-y-4">
      {isCallActive ? (
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl p-6 text-white" data-testid="live-call-ui">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className={`w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mx-auto ${
                callState === 'connected' ? 'ring-4 ring-green-500 ring-opacity-50' : 
                callState === 'ringing' ? 'ring-4 ring-yellow-500 ring-opacity-50 animate-pulse' :
                'ring-4 ring-blue-500 ring-opacity-50 animate-pulse'
              }`}>
                {callState === 'connected' ? (
                  <PhoneCall className="h-10 w-10 text-green-400" />
                ) : (
                  <User className="h-10 w-10 text-slate-400" />
                )}
              </div>
              {callState === 'connected' && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-xl font-semibold">
                {contactName || phoneNumber || 'Unknown'}
              </h3>
              <p className="text-slate-400 text-sm">
                {phoneNumber}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              {callState === 'dialing' && (
                <Badge className="bg-blue-600 text-white">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Dialing...
                </Badge>
              )}
              {callState === 'ringing' && (
                <Badge className="bg-yellow-600 text-white animate-pulse">
                  <Phone className="h-3 w-3 mr-1" />
                  Ringing...
                </Badge>
              )}
              {callState === 'connected' && (
                <Badge className="bg-green-600 text-white">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(callDuration)}
                </Badge>
              )}
              {callState === 'ended' && (
                <Badge className="bg-slate-600 text-white">
                  Call Ended
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="destructive"
                size="lg"
                onClick={endCall}
                className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700"
                data-testid="btn-end-frejun-call"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
            
            <p className="text-xs text-slate-500">
              {callState === 'connected' ? 'Tap to end call' : 'Tap to cancel'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              <span className="font-medium">Frejun Dialer</span>
              {isAuthorized ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : isLoaded ? (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Connecting...
                </Badge>
              ) : null}
            </div>
            {phoneNumber && isAuthorized && (
              <Button
                size="sm"
                onClick={initiateCall}
                className="gap-2"
                data-testid="btn-initiate-frejun-call"
              >
                <Phone className="h-4 w-4" />
                Call {contactName || phoneNumber}
              </Button>
            )}
          </div>
        </>
      )}

      <div 
        className={`rounded-lg border overflow-hidden transition-all duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-50'
        }`}
        style={{ height: isCallActive ? 100 : iframeHeight }}
      >
        {dialerConfig && (
          <iframe
            ref={iframeRef}
            src={dialerConfig.iframeSrc}
            allow="microphone"
            className="w-full h-full border-0"
            title="Frejun Dialer"
            data-testid="frejun-dialer-iframe"
          />
        )}
      </div>
    </div>
  );
}

export function QuickCallButton({
  phoneNumber,
  contactName,
  leadId,
  companyId,
  variant = "outline",
  size = "sm",
}: {
  phoneNumber: string;
  contactName?: string;
  leadId?: number;
  companyId?: number;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg" | "icon";
}) {
  const [showDialer, setShowDialer] = useState(false);
  const { data: voiceStatus } = useQuery({
    queryKey: ["/api/voice/status"],
  });

  const isConfigured = (voiceStatus as any)?.configured && (voiceStatus as any)?.isUserConnected;

  if (!isConfigured) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className="gap-2 opacity-50"
        title="Frejun not connected"
        data-testid={`quick-call-btn-disabled-${phoneNumber}`}
      >
        <Phone className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowDialer(true)}
        className="gap-2"
        data-testid={`quick-call-btn-${phoneNumber}`}
      >
        <Phone className="h-4 w-4" />
      </Button>

      {showDialer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4">
            <FrejunDialerWidget
              phoneNumber={phoneNumber}
              contactName={contactName}
              leadId={leadId}
              companyId={companyId}
              autoInitiate
              onCallEnd={() => setShowDialer(false)}
            />
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setShowDialer(false)}
              data-testid="btn-close-dialer"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default FrejunDialerWidget;
