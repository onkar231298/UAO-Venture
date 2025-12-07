import Plivo from "plivo";

const plivoAuthId = process.env.PLIVO_AUTH_ID;
const plivoAuthToken = process.env.PLIVO_AUTH_TOKEN;
const plivoPhoneNumber = process.env.PLIVO_PHONE_NUMBER;
const callbackBaseUrl = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : process.env.PUBLIC_URL || "";

interface PlivoCallParams {
  to: string;
  callerId?: string;
  record?: boolean;
  recordingCallbackUrl?: string;
  answerUrl?: string;
  hangupUrl?: string;
  machineDetection?: string;
}

interface PlivoCallResponse {
  requestUuid: string;
  apiId: string;
  message: string;
  error?: string;
}

export const isPlivoConfigured = (): boolean => {
  return Boolean(plivoAuthId && plivoAuthToken && plivoPhoneNumber);
};

export const getPlivoClient = () => {
  if (!plivoAuthId || !plivoAuthToken) {
    throw new Error("Plivo credentials not configured");
  }
  return new Plivo.Client(plivoAuthId, plivoAuthToken);
};

export const initiateCall = async (params: PlivoCallParams): Promise<PlivoCallResponse> => {
  if (!isPlivoConfigured()) {
    throw new Error("Plivo is not configured. Please set PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN, and PLIVO_PHONE_NUMBER.");
  }

  const client = getPlivoClient();
  
  const answerXmlUrl = params.answerUrl || `${callbackBaseUrl}/api/plivo/answer`;
  const hangupCallbackUrl = params.hangupUrl || `${callbackBaseUrl}/api/plivo/hangup`;
  const recordingCallbackUrl = params.recordingCallbackUrl || `${callbackBaseUrl}/api/plivo/recording-callback`;

  try {
    const response = await client.calls.create(
      plivoPhoneNumber!, // From number
      params.to, // To number
      answerXmlUrl, // Answer URL that returns PHLO XML
      {
        answerMethod: "GET",
        hangupUrl: hangupCallbackUrl,
        hangupMethod: "POST",
        ring_timeout: 60,
        machine_detection: params.machineDetection || "false",
      }
    );

    return {
      requestUuid: response.requestUuid,
      apiId: response.apiId,
      message: response.message || "Call initiated",
    };
  } catch (error: any) {
    console.error("Plivo call initiation failed:", error);
    return {
      requestUuid: "",
      apiId: "",
      message: "",
      error: error.message || "Failed to initiate call",
    };
  }
};

export const getCallDetails = async (callUuid: string) => {
  if (!isPlivoConfigured()) {
    throw new Error("Plivo is not configured");
  }

  const client = getPlivoClient();
  
  try {
    const details = await client.calls.get(callUuid);
    return details;
  } catch (error: any) {
    console.error("Failed to get call details:", error);
    throw error;
  }
};

export const hangupCall = async (callUuid: string) => {
  if (!isPlivoConfigured()) {
    throw new Error("Plivo is not configured");
  }

  const client = getPlivoClient();
  
  try {
    await client.calls.hangup(callUuid);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to hangup call:", error);
    throw error;
  }
};

export const generateAnswerXml = (options?: { record?: boolean; callbackUrl?: string }): string => {
  const recordingCallbackUrl = options?.callbackUrl || `${callbackBaseUrl}/api/plivo/recording-callback`;
  
  if (options?.record) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak>Hello, connecting your call now.</Speak>
  <Record action="${recordingCallbackUrl}" method="POST" recordSession="true" redirect="false" maxLength="3600" />
  <Dial>
    <Number>${plivoPhoneNumber}</Number>
  </Dial>
</Response>`;
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak>Hello, connecting your call now.</Speak>
  <Dial callerId="${plivoPhoneNumber}">
  </Dial>
</Response>`;
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[^0-9+]/g, "");
  
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }
  
  return `+${cleaned}`;
};

export const getPlivoPhoneNumber = (): string | undefined => {
  return plivoPhoneNumber;
};
