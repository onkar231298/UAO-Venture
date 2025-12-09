import axios from 'axios';

const FREJUN_API_URL = process.env.FREJUN_API_URL || 'https://api.frejun.com';
const FREJUN_PRODUCT_URL = 'https://product.frejun.com';
const FREJUN_CLIENT_ID = process.env.FREJUN_CLIENT_ID;
const FREJUN_CLIENT_SECRET = process.env.FREJUN_CLIENT_SECRET;
const FREJUN_CALLBACK_URL = process.env.FREJUN_CALLBACK_URL;

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  userEmail: string;
}

interface CallInitiateParams {
  userEmail: string;
  candidateNumber: string;
  candidateName?: string;
  virtualNumber?: string;
  transactionId?: string;
  jobId?: string;
  candidateId?: string;
}

interface VoipCallParams {
  agentId: string;
  destinationNumber: string;
  candidateName?: string;
  transactionId?: string;
  jobId?: string;
}

interface CallResponse {
  success: boolean;
  callId?: string;
  status?: string;
  error?: string;
  eventId?: number;
}

interface CallLogEntry {
  id: string;
  callId: string;
  direction: string;
  status: string;
  duration: number;
  callerNumber: string;
  calleeNumber: string;
  recordingUrl?: string;
  transcription?: string;
  timestamp: string;
  candidateName?: string;
  agentEmail?: string;
}

interface CallLogsResponse {
  success: boolean;
  data?: {
    count: number;
    results: CallLogEntry[];
    next?: string;
    previous?: string;
  };
  error?: string;
}

interface TokenResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

interface WebhookEvent {
  type: 'call_started' | 'call_answered' | 'call_ended' | 'call_missed' | 'voicemail' | 'unknown';
  callId: string;
  status?: string;
  duration?: number;
  recordingUrl?: string;
  transcription?: string;
  timestamp: string;
  callerNumber?: string;
  calleeNumber?: string;
  candidateName?: string;
  agentEmail?: string;
}

class FrejunService {
  private apiClient: ReturnType<typeof axios.create>;
  private isConfigured: boolean;
  private tokenStore: Map<string, TokenData> = new Map();

  constructor() {
    this.isConfigured = !!(FREJUN_CLIENT_ID && FREJUN_CLIENT_SECRET);
    
    this.apiClient = axios.create({
      baseURL: FREJUN_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  getConfigStatus(): { configured: boolean; message: string; oauthUrl?: string } {
    if (!this.isConfigured) {
      return {
        configured: false,
        message: 'Frejun is not configured. Please set FREJUN_CLIENT_ID, FREJUN_CLIENT_SECRET, and FREJUN_CALLBACK_URL environment variables.',
      };
    }
    return {
      configured: true,
      message: 'Frejun is configured and ready.',
      oauthUrl: this.getAuthorizationUrl(),
    };
  }

  getAuthorizationUrl(state?: string, redirectUri?: string): string {
    const params = new URLSearchParams({
      client_id: FREJUN_CLIENT_ID!,
    });
    
    // Don't send redirect_uri - let Frejun use the configured one
    // This avoids URL encoding/matching issues
    
    if (state) {
      params.append('state', state);
    }
    
    console.log('Frejun authorization URL params:', params.toString());
    
    return `${FREJUN_PRODUCT_URL}/oauth/authorize/?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Frejun is not configured',
      };
    }

    // Try multiple token endpoint variations
    const tokenEndpoints = [
      `${FREJUN_PRODUCT_URL}/oauth/token`,
      `${FREJUN_PRODUCT_URL}/api/v1/integrations/oauth/token`,
      `https://api.frejun.com/oauth/token`,
    ];

    for (const tokenUrl of tokenEndpoints) {
      try {
        console.log('Frejun token exchange trying:', tokenUrl);
        
        // Try with credentials in body (standard OAuth)
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', FREJUN_CLIENT_ID!);
        params.append('client_secret', FREJUN_CLIENT_SECRET!);
        params.append('code', code);
        params.append('redirect_uri', FREJUN_CALLBACK_URL!);
        
        const response = await axios.post(tokenUrl, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          maxRedirects: 5,
          validateStatus: (status) => status < 500,
        });

        console.log('Frejun token exchange response from', tokenUrl, ':', response.status, response.data);

        if (response.status === 200 && response.data?.access_token) {
          return {
            success: true,
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in,
          };
        }

        // If 404 or 405, try next endpoint
        if (response.status === 404 || response.status === 405) {
          console.log('Endpoint', tokenUrl, 'returned', response.status, '- trying next');
          continue;
        }

        // For other errors, return the error
        if (response.status >= 400) {
          return {
            success: false,
            error: response.data?.error_description || response.data?.error || response.data?.message || `HTTP ${response.status}`,
          };
        }
      } catch (error: any) {
        console.error('Frejun token exchange error for', tokenUrl, ':', error.message);
        // Continue to next endpoint
        continue;
      }
    }

    return {
      success: false,
      error: 'All token endpoints failed - please contact Frejun support for correct API endpoint',
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Frejun is not configured',
      };
    }

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refreshToken);

      const basicAuth = Buffer.from(`${FREJUN_CLIENT_ID}:${FREJUN_CLIENT_SECRET}`).toString('base64');
      const tokenUrl = `${FREJUN_PRODUCT_URL}/api/v1/oauth/token`;

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`,
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 500,
      });

      return {
        success: true,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error: any) {
      console.error('Frejun token refresh error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error_description || error.message || 'Failed to refresh token',
      };
    }
  }

  storeUserToken(userId: string, tokenData: TokenData): void {
    this.tokenStore.set(userId, tokenData);
  }

  getUserToken(userId: string): TokenData | undefined {
    return this.tokenStore.get(userId);
  }

  removeUserToken(userId: string): void {
    this.tokenStore.delete(userId);
  }

  private async getValidToken(userId: string): Promise<string | null> {
    const tokenData = this.tokenStore.get(userId);
    if (!tokenData) {
      return null;
    }

    if (new Date() >= tokenData.expiresAt) {
      const refreshResult = await this.refreshAccessToken(tokenData.refreshToken);
      if (refreshResult.success && refreshResult.accessToken) {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (refreshResult.expiresIn || 3600));
        
        this.tokenStore.set(userId, {
          ...tokenData,
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken || tokenData.refreshToken,
          expiresAt,
        });
        
        return refreshResult.accessToken;
      }
      return null;
    }

    return tokenData.accessToken;
  }

  async initiateNetworkCall(userId: string, params: CallInitiateParams): Promise<CallResponse> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Frejun is not configured',
      };
    }

    const accessToken = await this.getValidToken(userId);
    if (!accessToken) {
      return {
        success: false,
        error: 'User not authenticated with Frejun. Please authorize your account first.',
      };
    }

    try {
      const response = await this.apiClient.post('/api/v1/integrations/create-call/', {
        user_email: params.userEmail,
        candidate_number: params.candidateNumber,
        candidate_name: params.candidateName,
        virtual_number: params.virtualNumber,
        transaction_id: params.transactionId,
        job_id: params.jobId,
        candidate_id: params.candidateId,
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        return {
          success: true,
          callId: response.data.data?.call_id?.toString(),
          status: response.data.data?.info || 'initiated',
          eventId: response.data.data?.event_id,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to initiate call',
        };
      }
    } catch (error: any) {
      console.error('Frejun call initiation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to initiate call',
      };
    }
  }

  async initiateVoipCall(userId: string, params: VoipCallParams): Promise<CallResponse> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Frejun is not configured',
      };
    }

    const accessToken = await this.getValidToken(userId);
    if (!accessToken) {
      return {
        success: false,
        error: 'User not authenticated with Frejun. Please authorize your account first.',
      };
    }

    try {
      const response = await this.apiClient.post('/api/v1/integrations/call-to-voip/', {
        agent_id: params.agentId,
        dstn_number: params.destinationNumber,
        candidate_name: params.candidateName,
        transaction_id: params.transactionId,
        job_id: params.jobId,
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        return {
          success: true,
          callId: response.data.data,
          status: 'initiated',
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to initiate VoIP call',
        };
      }
    } catch (error: any) {
      console.error('Frejun VoIP call error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to initiate VoIP call',
      };
    }
  }

  async getCallLogs(userId: string, params?: { 
    limit?: number; 
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<CallLogsResponse> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Frejun is not configured',
      };
    }

    const accessToken = await this.getValidToken(userId);
    if (!accessToken) {
      return {
        success: false,
        error: 'User not authenticated with Frejun',
      };
    }

    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.startDate) queryParams.append('start_date', params.startDate.toISOString());
      if (params?.endDate) queryParams.append('end_date', params.endDate.toISOString());

      const url = `/integrations/calls/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await this.apiClient.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        const results = (response.data.data?.results || []).map((call: any) => ({
          id: call.id?.toString(),
          callId: call.call_id?.toString() || call.id?.toString(),
          direction: call.direction || 'outbound',
          status: call.status || 'completed',
          duration: call.duration || 0,
          callerNumber: call.caller_number || call.from,
          calleeNumber: call.callee_number || call.to,
          recordingUrl: call.recording_url,
          transcription: call.transcription,
          timestamp: call.created_at || call.timestamp,
          candidateName: call.candidate_name,
          agentEmail: call.agent_email || call.user_email,
        }));

        return {
          success: true,
          data: {
            count: response.data.data?.count || results.length,
            results,
            next: response.data.data?.next,
            previous: response.data.data?.previous,
          },
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to retrieve call logs',
        };
      }
    } catch (error: any) {
      console.error('Frejun get call logs error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to retrieve call logs',
      };
    }
  }

  async getUserInfo(accessToken: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const response = await this.apiClient.get('/api/v1/integrations/user/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return {
        success: true,
        user: response.data.data || response.data,
      };
    } catch (error: any) {
      console.error('Frejun get user info error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get user info',
      };
    }
  }

  processWebhook(body: any, signature?: string): WebhookEvent {
    const eventType = body.event_type || body.event || body.type || 'unknown';
    const data = body.data || body;
    
    const typeMap: Record<string, WebhookEvent['type']> = {
      'call.started': 'call_started',
      'call.ringing': 'call_started',
      'call.answered': 'call_answered',
      'call.connected': 'call_answered',
      'call.ended': 'call_ended',
      'call.completed': 'call_ended',
      'call.missed': 'call_missed',
      'call.unanswered': 'call_missed',
      'voicemail': 'voicemail',
      'voicemail.received': 'voicemail',
    };

    return {
      type: typeMap[eventType] || 'unknown',
      callId: data.call_id?.toString() || data.id?.toString() || '',
      status: data.status || data.info,
      duration: data.duration,
      recordingUrl: data.recording_url,
      transcription: data.transcription,
      timestamp: data.timestamp || data.created_at || new Date().toISOString(),
      callerNumber: data.caller_number || data.from,
      calleeNumber: data.callee_number || data.to || data.candidate_number,
      candidateName: data.candidate_name,
      agentEmail: data.agent_email || data.user_email,
    };
  }

  getDialerWidgetUrl(): string {
    return 'https://dialer.frejun.com/';
  }

  getDialerWidgetConfig(userEmail: string, accessToken: string) {
    return {
      iframeSrc: this.getDialerWidgetUrl(),
      authorizeMessage: {
        eventName: 'authorize',
        data: {
          access_token: accessToken,
          user_email: userEmail,
        },
      },
    };
  }

  createInitiateCallMessage(params: {
    userEmail: string;
    candidateNumber: string;
    candidateName?: string;
    virtualNumber?: string;
    accessToken: string;
    transactionId?: string;
    jobId?: string;
    candidateId?: string;
  }) {
    return {
      eventName: 'initiate-call',
      data: {
        user_email: params.userEmail,
        candidate_number: params.candidateNumber,
        candidate_name: params.candidateName,
        virtual_number: params.virtualNumber,
        access_token: params.accessToken,
        transaction_id: params.transactionId,
        job_id: params.jobId,
        candidate_id: params.candidateId,
      },
    };
  }
}

export const frejunService = new FrejunService();
export default frejunService;
