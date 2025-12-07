import Twilio from 'twilio';
import { storage } from './storage';
import type { InsertCallLog } from '@shared/schema';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: Twilio.Twilio | null = null;

function getClient(): Twilio.Twilio {
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  if (!twilioClient) {
    twilioClient = Twilio(accountSid, authToken);
  }
  return twilioClient;
}

export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && twilioPhoneNumber);
}

export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!authToken) return false;
  return Twilio.validateRequest(authToken, signature, url, params);
}

interface InitiateCallParams {
  recipientPhone: string;
  recipientName?: string;
  leadId?: number;
  companyId?: number;
  contactId?: number;
  callerUserId: string;
  callerPhone?: string;
  baseUrl: string;
}

export async function initiateCall(params: InitiateCallParams): Promise<{
  success: boolean;
  callLog?: any;
  callSid?: string;
  error?: string;
}> {
  try {
    const client = getClient();
    
    if (!twilioPhoneNumber) {
      throw new Error('Twilio phone number not configured');
    }

    const callLogData: InsertCallLog = {
      leadId: params.leadId || null,
      companyId: params.companyId || null,
      contactId: params.contactId || null,
      callerUserId: params.callerUserId,
      callerPhone: params.callerPhone || twilioPhoneNumber,
      recipientPhone: params.recipientPhone,
      recipientName: params.recipientName || null,
      direction: 'outgoing',
      status: 'initiated',
      initiatedAt: new Date(),
    };

    const callLog = await storage.createCallLog(callLogData);

    const statusCallbackUrl = `${params.baseUrl}/api/voice/webhook/status`;
    const recordingCallbackUrl = `${params.baseUrl}/api/voice/webhook/recording`;
    const twimlUrl = `${params.baseUrl}/api/voice/twiml/${callLog.id}`;

    const call = await client.calls.create({
      to: params.recipientPhone,
      from: twilioPhoneNumber,
      url: twimlUrl,
      statusCallback: statusCallbackUrl,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      record: true,
      recordingStatusCallback: recordingCallbackUrl,
      recordingStatusCallbackMethod: 'POST',
      recordingStatusCallbackEvent: ['completed'],
    });

    await storage.updateCallLog(callLog.id, {
      plivoCallUuid: call.sid,
      status: 'initiated',
    });

    return {
      success: true,
      callLog: { ...callLog, plivoCallUuid: call.sid },
      callSid: call.sid,
    };
  } catch (error: any) {
    console.error('Error initiating Twilio call:', error);
    return {
      success: false,
      error: error.message || 'Failed to initiate call',
    };
  }
}

export function generateTwiML(callId: number, recipientPhone: string, baseUrl: string): string {
  const twiml = new Twilio.twiml.VoiceResponse();
  
  twiml.say({ voice: 'alice' }, 'Connecting your call. Please wait.');
  
  const dial = twiml.dial({
    callerId: twilioPhoneNumber!,
    record: 'record-from-answer-dual',
    timeout: 30,
    action: `${baseUrl}/api/voice/webhook/dial-status`,
  });
  
  dial.number(recipientPhone);

  return twiml.toString();
}

export async function handleStatusWebhook(params: Record<string, string>): Promise<void> {
  const callSid = params.CallSid;
  const callStatus = params.CallStatus;
  const duration = params.CallDuration ? parseInt(params.CallDuration) : 0;
  
  if (!callSid) {
    console.error('No CallSid in status webhook');
    return;
  }

  const callLog = await storage.getCallLogByCallUuid(callSid);
  if (!callLog) {
    console.error('Call log not found for SID:', callSid);
    return;
  }

  const statusMap: Record<string, string> = {
    'queued': 'initiated',
    'initiated': 'initiated',
    'ringing': 'ringing',
    'in-progress': 'in-progress',
    'completed': 'completed',
    'busy': 'busy',
    'failed': 'failed',
    'no-answer': 'no-answer',
    'canceled': 'failed',
  };

  const updates: any = {
    status: statusMap[callStatus] || callStatus,
    rawPayload: params,
  };

  if (callStatus === 'in-progress') {
    updates.answeredAt = new Date();
  }

  if (['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(callStatus)) {
    updates.endedAt = new Date();
    updates.durationSeconds = duration;
  }

  await storage.updateCallLog(callLog.id, updates);
  console.log(`Call ${callSid} status updated to ${callStatus}`);
}

export async function handleRecordingWebhook(params: Record<string, string>): Promise<void> {
  const callSid = params.CallSid;
  const recordingUrl = params.RecordingUrl;
  const recordingDuration = params.RecordingDuration ? parseInt(params.RecordingDuration) : 0;
  const recordingStatus = params.RecordingStatus;

  if (!callSid) {
    console.error('No CallSid in recording webhook');
    return;
  }

  const callLog = await storage.getCallLogByCallUuid(callSid);
  if (!callLog) {
    console.error('Call log not found for SID:', callSid);
    return;
  }

  const updates: any = {
    recordingUrl: recordingUrl ? `${recordingUrl}.mp3` : null,
    recordingDuration: recordingDuration,
    recordingStatus: recordingStatus,
  };

  await storage.updateCallLog(callLog.id, updates);
  console.log(`Recording for call ${callSid} saved:`, recordingUrl);
}

export async function getRecordingUrl(callLogId: number, userId: string): Promise<string | null> {
  const callLog = await storage.getCallLog(callLogId);
  if (!callLog) {
    return null;
  }

  if (!callLog.recordingUrl) {
    return null;
  }

  return callLog.recordingUrl;
}
