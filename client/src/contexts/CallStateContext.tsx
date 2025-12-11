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
  // Frejun sends events in format: { type: 'CALL_CONNECTED', payload: {...} }
  // We normalize both formats to handle legacy and current Frejun event structures
  useEffect(() => {
    const handleFrejunMessage = (event: MessageEvent) => {
      if (event.origin !== FREJUN_TARGET_ORIGIN || !event.data) return;

      const eventData = event.data;
      
      // Normalize event name - Frejun uses 'type' field with UPPERCASE values
      // Also support legacy 'eventName' field for backwards compatibility
      const rawEventName = eventData.type || eventData.eventName || '';
      const eventName = rawEventName.toLowerCase().replace(/_/g, '-');
      
      // Normalize payload - Frejun uses 'payload', legacy uses 'data' or 'detail'
      const payload = eventData.payload || eventData.data || eventData.detail || {};
      
      console.log('📞 CallStateContext received Frejun event:', rawEventName, '-> normalized:', eventName, payload);

      switch (eventName) {
        case 'call-initiated':
        case 'call-dialing':
        case 'dialing':
          // Only set metadata if we haven't already started the call optimistically
          if (!callStartedRef.current) {
            console.log('📞 Setting isInCall=true (dialing)');
            setIsInCall(true);
            setCallStatus('dialing');
            setCallDuration(0);
            if (payload.phone_number || payload.phoneNumber) {
              setCallingNumber(payload.phone_number || payload.phoneNumber);
            }
            if (payload.call_id || payload.callId) {
              const newCallId = payload.call_id || payload.callId;
              setCurrentCallId(newCallId);
              currentCallMetadataRef.current.callId = newCallId;
            }
            callStartedRef.current = true;
          } else {
            // Just update status and callId (don't wipe metadata, but always sync callId)
            setCallStatus('dialing');
            if (payload.call_id || payload.callId) {
              const newCallId = payload.call_id || payload.callId;
              setCurrentCallId(newCallId);
              currentCallMetadataRef.current.callId = newCallId;
            }
          }
          break;

        case 'incoming-call':
        case 'call-ringing':
        case 'ringing':
          console.log('📞 Setting isInCall=true (ringing)');
          setIsInCall(true);
          setCallStatus('ringing');
          if (!callStartedRef.current) {
            setCallDuration(0);
            if (payload.phone_number || payload.phoneNumber) {
              setCallingNumber(payload.phone_number || payload.phoneNumber);
            }
            if (payload.call_id || payload.callId) {
              const newCallId = payload.call_id || payload.callId;
              setCurrentCallId(newCallId);
              currentCallMetadataRef.current.callId = newCallId;
            }
            callStartedRef.current = true;
          }
          break;

        case 'call-connected':
        case 'call-answered':
        case 'connected':
        case 'answered':
          console.log('📞 Setting isInCall=true, callStatus=connected');
          setIsInCall(true);
          setCallStatus('connected');
          // Only reset duration if just connecting (not already in call)
          if (!callStartedRef.current) {
            setCallDuration(0);
            callStartedRef.current = true;
          }
          break;

        case 'call-ended':
        case 'call-disconnected':
        case 'call-completed':
        case 'call-failed':
        case 'ended':
        case 'hangup':
          console.log('📞 Call ended - resetting state');
          setCallStatus('ended');
          // Notify all registered callbacks about call end (remote hangup)
          callEndCallbacksRef.current.forEach(callback => {
            callback({
              callId: currentCallMetadataRef.current.callId,
              leadId: currentCallMetadataRef.current.leadId,
              companyId: currentCallMetadataRef.current.companyId,
              duration: currentCallMetadataRef.current.duration,
              wasRemoteHangup: true,
            });
          });
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

        default:
          // Log unknown events for debugging
          if (eventName && eventName !== 'undefined') {
            console.log('📞 Unknown Frejun event:', eventName);
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
        startCall,
        updateCallStatus,
        endCall,
        setMuted: setIsMuted,
        setSpeaker: setIsSpeaker,
        setOnHold: setIsOnHold,
        setCallId,
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
