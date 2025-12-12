import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";

export type CallStatus = 'idle' | 'dialing' | 'ringing' | 'connected' | 'ended';

const FREJUN_TARGET_ORIGIN = 'https://dialer.frejun.com';

export interface CallEndInfo {
  callId: string | null;
  leadId: number | null;
  companyId: number | null;
  duration: number;
  wasRemoteHangup: boolean;
}

type CallEndCallback = (info: CallEndInfo) => void;

interface CallStateContextType {
  isInCall: boolean;
  callStatus: CallStatus;
  callDuration: number;
  currentCallId: string | null;
  callingNumber: string;
  contactName: string;
  leadId: number | null;
  companyId: number | null;
  isMuted: boolean;
  isSpeaker: boolean;
  isOnHold: boolean;
  isWidgetReady: boolean;
  startCall: (params: {
    phoneNumber: string;
    callId?: string;
    contactName?: string;
    leadId?: number;
    companyId?: number;
  }) => void;
  updateCallStatus: (status: CallStatus) => void;
  endCall: (showEndedState?: boolean) => void;
  setMuted: (muted: boolean) => void;
  setSpeaker: (speaker: boolean) => void;
  setOnHold: (hold: boolean) => void;
  setCallId: (id: string) => void;
  setWidgetReady: (ready: boolean) => void;
  registerOnCallEnd: (callback: CallEndCallback) => () => void;
}

const CallStateContext = createContext<CallStateContextType | undefined>(undefined);

export function CallStateProvider({ children }: { children: ReactNode }) {
  const [isInCall, setIsInCall] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [callingNumber, setCallingNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [leadId, setLeadId] = useState<number | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  
  // Track if call was started optimistically (to prevent metadata wipe)
  const callStartedRef = useRef(false);
  
  // Ref to track the timer interval for proper cleanup
  const callDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Callbacks for call end notifications
  const callEndCallbacksRef = useRef<Set<CallEndCallback>>(new Set());
  
  // Ref to track current call metadata for callbacks (avoids stale closure issues)
  const currentCallMetadataRef = useRef({
    callId: null as string | null,
    leadId: null as number | null,
    companyId: null as number | null,
    duration: 0,
  });

  // Call duration timer
  useEffect(() => {
    // Clear any existing timer first
    if (callDurationTimerRef.current) {
      clearInterval(callDurationTimerRef.current);
      callDurationTimerRef.current = null;
    }
    
    if (isInCall && callStatus === 'connected') {
      callDurationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => {
          const newDuration = prev + 1;
          // Keep metadata ref in sync for callbacks
          currentCallMetadataRef.current.duration = newDuration;
          return newDuration;
        });
      }, 1000);
    }
    
    return () => {
      if (callDurationTimerRef.current) {
        clearInterval(callDurationTimerRef.current);
        callDurationTimerRef.current = null;
      }
    };
  }, [isInCall, callStatus]);

  // Global Frejun event listener - works even when FrejunDialerWidget is not mounted
  // Per Frejun documentation, only these events are sent via postMessage:
  // ready, close, incoming-call, unauthorized, height-change, end-call-error, call-ended
  // We do NOT receive real-time call status events like "connected" or "ringing"
  useEffect(() => {
    const handleFrejunMessage = (event: MessageEvent) => {
      if (event.origin !== FREJUN_TARGET_ORIGIN || !event.data) return;

      const eventData = event.data;
      const eventName = eventData.eventName || '';
      
      console.log('📞 CallStateContext received Frejun event:', eventName, eventData);

      switch (eventName) {
        case 'incoming-call':
          // Incoming call - set up call state
          console.log('📞 Incoming call received');
          setIsInCall(true);
          setCallStatus('ringing');
          setCallDuration(0);
          callStartedRef.current = true;
          break;

        case 'call-ended':
          // Call has ended
          console.log('📞 Call ended - notifying callbacks and resetting state');
          setCallStatus('ended');
          // Notify all registered callbacks about call end
          callEndCallbacksRef.current.forEach(callback => {
            callback({
              callId: currentCallMetadataRef.current.callId,
              leadId: currentCallMetadataRef.current.leadId,
              companyId: currentCallMetadataRef.current.companyId,
              duration: currentCallMetadataRef.current.duration,
              wasRemoteHangup: true,
            });
          });
          // Reset state after a brief delay to show "ended" status
          setTimeout(() => {
            setIsInCall(false);
            setCallStatus('idle');
            setCurrentCallId(null);
            setCallDuration(0);
            setCallingNumber("");
            setContactName("");
            setLeadId(null);
            setCompanyId(null);
            setIsMuted(false);
            setIsSpeaker(false);
            setIsOnHold(false);
            callStartedRef.current = false;
            currentCallMetadataRef.current = { callId: null, leadId: null, companyId: null, duration: 0 };
          }, 2000);
          break;

        case 'close':
          // Widget closed - reset immediately
          console.log('📞 Widget closed - resetting state');
          callEndCallbacksRef.current.forEach(callback => {
            callback({
              callId: currentCallMetadataRef.current.callId,
              leadId: currentCallMetadataRef.current.leadId,
              companyId: currentCallMetadataRef.current.companyId,
              duration: currentCallMetadataRef.current.duration,
              wasRemoteHangup: false,
            });
          });
          setIsInCall(false);
          setCallStatus('idle');
          setCurrentCallId(null);
          setCallDuration(0);
          setCallingNumber("");
          setContactName("");
          setLeadId(null);
          setCompanyId(null);
          setIsMuted(false);
          setIsSpeaker(false);
          setIsOnHold(false);
          callStartedRef.current = false;
          currentCallMetadataRef.current = { callId: null, leadId: null, companyId: null, duration: 0 };
          break;

        case 'ready':
          console.log('📞 Frejun widget ready');
          break;
          
        case 'unauthorized':
          console.log('📞 Frejun authorization failed:', eventData.detail);
          break;

        default:
          // Log other events for debugging (height-change, end-call-error, etc.)
          if (eventName) {
            console.log('📞 Frejun event (not handled):', eventName);
          }
          break;
      }
    };

    window.addEventListener('message', handleFrejunMessage);
    return () => window.removeEventListener('message', handleFrejunMessage);
  }, []);

  const startCall = useCallback((params: {
    phoneNumber: string;
    callId?: string;
    contactName?: string;
    leadId?: number;
    companyId?: number;
  }) => {
    console.log('📞 CallStateContext.startCall called with:', params);
    setIsInCall(true);
    setCallStatus('dialing');
    setCallDuration(0);
    setCallingNumber(params.phoneNumber);
    setContactName(params.contactName || "");
    setLeadId(params.leadId || null);
    setCompanyId(params.companyId || null);
    setCurrentCallId(params.callId || null);
    setIsMuted(false);
    setIsSpeaker(false);
    setIsOnHold(false);
    callStartedRef.current = true; // Mark as started to prevent metadata wipe from Frejun events
    // Update metadata ref for callbacks
    currentCallMetadataRef.current = {
      callId: params.callId || null,
      leadId: params.leadId || null,
      companyId: params.companyId || null,
      duration: 0,
    };
    console.log('📞 CallStateContext.startCall - isInCall set to true');
  }, []);

  const updateCallStatus = useCallback((status: CallStatus) => {
    setCallStatus(status);
    if (status === 'connected') {
      setCallDuration(0);
    }
    if (status !== 'idle' && status !== 'ended') {
      setIsInCall(true);
    }
  }, []);

  const endCall = useCallback((showEndedState: boolean = true) => {
    if (showEndedState) {
      setCallStatus('ended');
      setTimeout(() => {
        setIsInCall(false);
        setCallStatus('idle');
        setCurrentCallId(null);
        setCallDuration(0);
        setCallingNumber("");
        setContactName("");
        setLeadId(null);
        setCompanyId(null);
        setIsMuted(false);
        setIsSpeaker(false);
        setIsOnHold(false);
        callStartedRef.current = false;
      }, 2000);
    } else {
      setIsInCall(false);
      setCallStatus('idle');
      setCurrentCallId(null);
      setCallDuration(0);
      setCallingNumber("");
      setContactName("");
      setLeadId(null);
      setCompanyId(null);
      setIsMuted(false);
      setIsSpeaker(false);
      setIsOnHold(false);
      callStartedRef.current = false;
    }
  }, []);

  const setCallId = useCallback((id: string) => {
    setCurrentCallId(id);
    // Also update metadata ref
    currentCallMetadataRef.current.callId = id;
  }, []);

  // Register a callback to be notified when a call ends
  const registerOnCallEnd = useCallback((callback: CallEndCallback) => {
    callEndCallbacksRef.current.add(callback);
    // Return unsubscribe function
    return () => {
      callEndCallbacksRef.current.delete(callback);
    };
  }, []);

  return (
    <CallStateContext.Provider
      value={{
        isInCall,
        callStatus,
        callDuration,
        currentCallId,
        callingNumber,
        contactName,
        leadId,
        companyId,
        isMuted,
        isSpeaker,
        isOnHold,
        isWidgetReady,
        startCall,
        updateCallStatus,
        endCall,
        setMuted: setIsMuted,
        setSpeaker: setIsSpeaker,
        setOnHold: setIsOnHold,
        setCallId,
        setWidgetReady: setIsWidgetReady,
        registerOnCallEnd,
      }}
    >
      {children}
    </CallStateContext.Provider>
  );
}

export function useCallState() {
  const context = useContext(CallStateContext);
  if (context === undefined) {
    throw new Error('useCallState must be used within a CallStateProvider');
  }
  return context;
}

export function useCallStateOptional() {
  return useContext(CallStateContext);
}
