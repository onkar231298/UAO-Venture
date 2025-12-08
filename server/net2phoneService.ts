import axios from 'axios';

const NET2PHONE_API_URL = process.env.NET2PHONE_API_URL || 'https://api.net2phone.com';
const NET2PHONE_API_KEY = process.env.NET2PHONE_API_KEY;
const NET2PHONE_API_SECRET = process.env.NET2PHONE_API_SECRET;
const NET2PHONE_ACCOUNT_ID = process.env.NET2PHONE_ACCOUNT_ID;

interface CallInitiateParams {
  to: string;
  from?: string;
  callerId?: string;
  recordCall?: boolean;
  webhookUrl?: string;
}

interface CallResponse {
  success: boolean;
  callId?: string;
  status?: string;
  error?: string;
}

interface SmsParams {
  to: string;
  from?: string;
  message: string;
}

interface SmsResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

interface CallRecording {
  id: string;
  callId: string;
  url: string;
  duration: number;
  createdAt: string;
}

interface VoicemailData {
  id: string;
  callerPhone: string;
  callerName?: string;
  recordingUrl: string;
  transcription?: string;
  duration: number;
  receivedAt: string;
}

class Net2PhoneService {
  private apiClient: ReturnType<typeof axios.create>;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!(NET2PHONE_API_KEY && NET2PHONE_API_SECRET);
    
    this.apiClient = axios.create({
      baseURL: NET2PHONE_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NET2PHONE_API_KEY}`,
        'X-Account-ID': NET2PHONE_ACCOUNT_ID || '',
      },
    });
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  getConfigStatus(): { configured: boolean; message: string } {
    if (!this.isConfigured) {
      return {
        configured: false,
        message: 'net2phone is not configured. Please set NET2PHONE_API_KEY, NET2PHONE_API_SECRET, and NET2PHONE_ACCOUNT_ID environment variables.',
      };
    }
    return {
      configured: true,
      message: 'net2phone is configured and ready.',
    };
  }

  async initiateCall(params: CallInitiateParams): Promise<CallResponse> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'net2phone is not configured',
      };
    }

    try {
      const response = await this.apiClient.post('/v2/calls', {
        to: params.to,
        from: params.from,
        caller_id: params.callerId,
        record: params.recordCall ?? true,
        webhook_url: params.webhookUrl,
      });

      return {
        success: true,
        callId: response.data.call_id || response.data.id,
        status: response.data.status || 'initiated',
      };
    } catch (error: any) {
      console.error('net2phone call initiation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to initiate call',
      };
    }
  }

  async getCallStatus(callId: string): Promise<CallResponse> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'net2phone is not configured',
      };
    }

    try {
      const response = await this.apiClient.get(`/v2/calls/${callId}`);
      return {
        success: true,
        callId: response.data.call_id || response.data.id,
        status: response.data.status,
      };
    } catch (error: any) {
      console.error('net2phone get call status error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get call status',
      };
    }
  }

  async endCall(callId: string): Promise<CallResponse> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'net2phone is not configured',
      };
    }

    try {
      const response = await this.apiClient.post(`/v2/calls/${callId}/hangup`);
      return {
        success: true,
        callId,
        status: 'ended',
      };
    } catch (error: any) {
      console.error('net2phone end call error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to end call',
      };
    }
  }

  async getCallRecording(callId: string): Promise<{ success: boolean; recording?: CallRecording; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'net2phone is not configured',
      };
    }

    try {
      const response = await this.apiClient.get(`/v2/calls/${callId}/recording`);
      return {
        success: true,
        recording: {
          id: response.data.id,
          callId: response.data.call_id,
          url: response.data.url,
          duration: response.data.duration,
          createdAt: response.data.created_at,
        },
      };
    } catch (error: any) {
      console.error('net2phone get recording error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get recording',
      };
    }
  }

  async getCallHistory(params: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; calls?: any[]; total?: number; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'net2phone is not configured',
      };
    }

    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('start_date', params.startDate.toISOString());
      if (params.endDate) queryParams.append('end_date', params.endDate.toISOString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());

      const response = await this.apiClient.get(`/v2/calls?${queryParams.toString()}`);
      return {
        success: true,
        calls: response.data.calls || response.data.data || [],
        total: response.data.total || response.data.count || 0,
      };
    } catch (error: any) {
      console.error('net2phone get call history error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get call history',
      };
    }
  }

  async sendSms(params: SmsParams): Promise<SmsResponse> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'net2phone is not configured',
      };
    }

    try {
      const response = await this.apiClient.post('/v2/sms', {
        to: params.to,
        from: params.from,
        message: params.message,
      });

      return {
        success: true,
        messageId: response.data.message_id || response.data.id,
        status: response.data.status || 'sent',
      };
    } catch (error: any) {
      console.error('net2phone SMS send error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send SMS',
      };
    }
  }

  async getVoicemails(params: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<{ success: boolean; voicemails?: VoicemailData[]; total?: number; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'net2phone is not configured',
      };
    }

    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      if (params.unreadOnly) queryParams.append('unread', 'true');

      const response = await this.apiClient.get(`/v2/voicemails?${queryParams.toString()}`);
      
      const voicemails = (response.data.voicemails || response.data.data || []).map((vm: any) => ({
        id: vm.id,
        callerPhone: vm.caller_phone || vm.from,
        callerName: vm.caller_name || vm.caller_id_name,
        recordingUrl: vm.recording_url || vm.url,
        transcription: vm.transcription,
        duration: vm.duration,
        receivedAt: vm.received_at || vm.created_at,
      }));

      return {
        success: true,
        voicemails,
        total: response.data.total || response.data.count || voicemails.length,
      };
    } catch (error: any) {
      console.error('net2phone get voicemails error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get voicemails',
      };
    }
  }

  async markVoicemailAsListened(voicemailId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'net2phone is not configured',
      };
    }

    try {
      await this.apiClient.patch(`/v2/voicemails/${voicemailId}`, {
        is_listened: true,
      });
      return { success: true };
    } catch (error: any) {
      console.error('net2phone mark voicemail error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to mark voicemail as listened',
      };
    }
  }

  processWebhook(body: any, signature?: string): {
    type: 'call_ringing' | 'call_answered' | 'call_completed' | 'call_missed' | 'voicemail' | 'sms_received' | 'sms_delivered' | 'unknown';
    data: any;
  } {
    const eventType = body.event || body.type || 'unknown';
    
    const typeMap: Record<string, any> = {
      'call.ringing': 'call_ringing',
      'call.answered': 'call_answered',
      'call.completed': 'call_completed',
      'call.ended': 'call_completed',
      'call.missed': 'call_missed',
      'call.unanswered': 'call_missed',
      'voicemail.received': 'voicemail',
      'voicemail.new': 'voicemail',
      'sms.received': 'sms_received',
      'sms.delivered': 'sms_delivered',
      'sms.sent': 'sms_delivered',
    };

    return {
      type: typeMap[eventType] || 'unknown',
      data: body.data || body,
    };
  }
}

export const net2phoneService = new Net2PhoneService();
export default net2phoneService;
