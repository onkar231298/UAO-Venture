import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Phone,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

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
    console.log('Frejun dialer event:', eventData.eventName);

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

      case 'incoming-call':
        setIsVisible(true);
        toast({
          title: "Incoming Call",
          description: "You have an incoming call",
        });
        break;

      case 'close':
        setIsVisible(false);
        onCallEnd?.();
        break;

      case 'height-change':
        if (eventData.detail) {
          setIframeHeight(parseInt(eventData.detail, 10));
        }
        break;

      case 'call-ended':
        onCallEnd?.();
        toast({
          title: "Call Ended",
          description: "The call has been completed",
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
        if (!eventData.eventName?.startsWith('unauthorized')) {
          setIsAuthorized(true);
        }
    }
  }, [dialerConfig, toast, onCallEnd]);

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

  return (
    <div className="space-y-4">
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

      <div 
        className={`rounded-lg border overflow-hidden transition-all duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-50'
        }`}
        style={{ height: iframeHeight }}
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
