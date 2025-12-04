import { google, gmail_v1 } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];

// Email signature configuration
export interface SignatureConfig {
  name: string;
  position: string;
  email: string;
  phone?: string;
  mobile?: string;
}

// Generate professional HTML email signature with certification logos
export function generateEmailSignature(config: SignatureConfig): string {
  const { name, position, email, phone, mobile } = config;
  
  // Base URL for the production site (for hosting logo images)
  const baseUrl = 'https://bright-organic.com';
  
  return `
<div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #2e7d32; font-family: Arial, Helvetica, sans-serif;">
  <!-- Signature Header -->
  <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif;">
    <tr>
      <td style="padding-right: 20px; border-right: 2px solid #2e7d32;">
        <img src="${baseUrl}/attached_assets/bfi-logo.png" alt="Bright Fame Organic" width="100" style="display: block;" />
      </td>
      <td style="padding-left: 20px;">
        <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold; color: #1a5f1a;">${name}</p>
        <p style="margin: 0 0 5px 0; font-size: 14px; color: #333;">${position}</p>
        <p style="margin: 0 0 3px 0; font-size: 13px; color: #555;">
          <strong style="color: #2e7d32;">Bright Fame Organic Pvt. Ltd.</strong>
        </p>
        <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">
          <a href="mailto:${email}" style="color: #2e7d32; text-decoration: none;">${email}</a>
        </p>
        ${phone ? `<p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">Phone: ${phone}</p>` : ''}
        ${mobile ? `<p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">Mobile: ${mobile}</p>` : ''}
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">
          <a href="https://bright-organic.com" style="color: #2e7d32; text-decoration: none;">www.bright-organic.com</a>
        </p>
      </td>
    </tr>
  </table>

  <!-- Certification Logos -->
  <div style="margin-top: 15px; padding: 10px 0;">
    <p style="margin: 0 0 8px 0; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Our Certifications</p>
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <!-- NPOP Logo -->
        <td style="padding: 5px 8px;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/India_Organic_Logo.svg/100px-India_Organic_Logo.svg.png" alt="NPOP Organic India" width="40" height="40" style="display: block;" title="NPOP - National Programme for Organic Production" />
        </td>
        <!-- USDA NOP Logo -->
        <td style="padding: 5px 8px;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/USDA_organic_seal.svg/100px-USDA_organic_seal.svg.png" alt="USDA Organic" width="40" height="40" style="display: block;" title="USDA NOP - National Organic Program" />
        </td>
        <!-- EU Organic Logo -->
        <td style="padding: 5px 8px;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/EU_organic_farming_logo.svg/100px-EU_organic_farming_logo.svg.png" alt="EU Organic" width="40" height="40" style="display: block;" title="EU Organic Certification" />
        </td>
        <!-- BRC Logo (placeholder - using text) -->
        <td style="padding: 5px 8px; background: #f5f5f5; border-radius: 4px;">
          <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #003366; text-align: center;">BRC</div>
        </td>
        <!-- USFDA Logo -->
        <td style="padding: 5px 8px;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/FDA-Logo.svg/100px-FDA-Logo.svg.png" alt="US FDA" width="40" height="40" style="display: block;" title="US FDA Registered" />
        </td>
        <!-- Kosher Logo (placeholder - using text) -->
        <td style="padding: 5px 8px; background: #f5f5f5; border-radius: 4px;">
          <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; color: #333; text-align: center;">KOSHER</div>
        </td>
        <!-- Halal Logo -->
        <td style="padding: 5px 8px; background: #f5f5f5; border-radius: 4px;">
          <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #006400; text-align: center;">HALAL</div>
        </td>
        <!-- Spice Board Logo (placeholder - using text) -->
        <td style="padding: 5px 8px; background: #f5f5f5; border-radius: 4px;">
          <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: bold; color: #8B4513; text-align: center;">SPICE<br/>BOARD</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Disclaimer -->
  <div style="margin-top: 15px; padding: 12px; background-color: #f9f9f9; border-left: 3px solid #2e7d32; font-size: 10px; color: #777; line-height: 1.4;">
    <p style="margin: 0 0 8px 0; font-weight: bold; color: #555;">CONFIDENTIALITY NOTICE & DISCLAIMER</p>
    <p style="margin: 0;">
      This email and any attachments are confidential and intended solely for the addressee(s). If you are not the intended recipient, please notify the sender immediately and delete this email. Any unauthorized review, use, disclosure, or distribution is prohibited. The information contained herein does not constitute an offer or acceptance unless explicitly stated. Bright Fame Organic Pvt. Ltd. does not accept responsibility for any loss or damage arising from viruses or other malware that may affect your computer systems. Views expressed in this email are those of the sender and may not represent the official policy of the company.
    </p>
  </div>
</div>`;
}

// OAuth2 client configuration
function getOAuth2Client() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  
  // Use production domain for OAuth redirect URI
  const redirectUri = 'https://bright-organic.com/api/auth/gmail/callback';
  
  console.log('Gmail OAuth redirect URI:', redirectUri);

  if (!clientId || !clientSecret) {
    throw new Error('Gmail OAuth credentials not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Generate OAuth URL for user authorization
export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Create Gmail client with access token
export function getGmailClient(accessToken: string): gmail_v1.Gmail {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Send email using Gmail API
export async function sendEmail(
  accessToken: string,
  options: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    fromName?: string;
    fromEmail?: string;
  }
): Promise<{ messageId: string; threadId: string }> {
  const gmail = getGmailClient(accessToken);

  // Build email MIME message
  const toHeader = options.to.join(', ');
  const ccHeader = options.cc?.join(', ') || '';
  const bccHeader = options.bcc?.join(', ') || '';
  
  const boundary = 'boundary_' + Date.now();
  
  let emailLines = [
    `To: ${toHeader}`,
  ];
  
  if (ccHeader) emailLines.push(`Cc: ${ccHeader}`);
  if (bccHeader) emailLines.push(`Bcc: ${bccHeader}`);
  if (options.fromName && options.fromEmail) {
    emailLines.push(`From: ${options.fromName} <${options.fromEmail}>`);
  }
  
  emailLines.push(
    `Subject: ${options.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    options.bodyText || options.bodyHtml.replace(/<[^>]*>/g, ''),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    options.bodyHtml,
    '',
    `--${boundary}--`
  );
  
  const rawEmail = emailLines.join('\r\n');
  const encodedEmail = Buffer.from(rawEmail).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
    },
  });

  return {
    messageId: response.data.id || '',
    threadId: response.data.threadId || '',
  };
}

// Reply to an existing email thread
export async function replyToEmail(
  accessToken: string,
  threadId: string,
  options: {
    to: string[];
    cc?: string[];
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    fromName?: string;
    fromEmail?: string;
    inReplyTo?: string;
    references?: string;
  }
): Promise<{ messageId: string; threadId: string }> {
  const gmail = getGmailClient(accessToken);

  const toHeader = options.to.join(', ');
  const ccHeader = options.cc?.join(', ') || '';
  
  const boundary = 'boundary_' + Date.now();
  
  let emailLines = [
    `To: ${toHeader}`,
  ];
  
  if (ccHeader) emailLines.push(`Cc: ${ccHeader}`);
  if (options.fromName && options.fromEmail) {
    emailLines.push(`From: ${options.fromName} <${options.fromEmail}>`);
  }
  if (options.inReplyTo) {
    emailLines.push(`In-Reply-To: ${options.inReplyTo}`);
    emailLines.push(`References: ${options.references || options.inReplyTo}`);
  }
  
  emailLines.push(
    `Subject: ${options.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    options.bodyText || options.bodyHtml.replace(/<[^>]*>/g, ''),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    options.bodyHtml,
    '',
    `--${boundary}--`
  );
  
  const rawEmail = emailLines.join('\r\n');
  const encodedEmail = Buffer.from(rawEmail).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
      threadId,
    },
  });

  return {
    messageId: response.data.id || '',
    threadId: response.data.threadId || '',
  };
}

// Get list of emails from Gmail
export async function listEmails(
  accessToken: string,
  options?: {
    maxResults?: number;
    labelIds?: string[];
    query?: string;
    pageToken?: string;
  }
): Promise<{ messages: gmail_v1.Schema$Message[]; nextPageToken?: string }> {
  const gmail = getGmailClient(accessToken);

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: options?.maxResults || 20,
    labelIds: options?.labelIds,
    q: options?.query,
    pageToken: options?.pageToken,
  });

  const messages: gmail_v1.Schema$Message[] = [];
  
  if (response.data.messages) {
    for (const msg of response.data.messages) {
      if (msg.id) {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });
        messages.push(fullMessage.data);
      }
    }
  }

  return {
    messages,
    nextPageToken: response.data.nextPageToken || undefined,
  };
}

// Get single email by ID
export async function getEmail(
  accessToken: string,
  messageId: string
): Promise<gmail_v1.Schema$Message> {
  const gmail = getGmailClient(accessToken);

  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  return response.data;
}

// Parse email message to extract useful data
export function parseEmailMessage(message: gmail_v1.Schema$Message): {
  id: string;
  threadId: string;
  subject: string;
  from: { name: string; email: string };
  to: string[];
  cc: string[];
  date: Date;
  snippet: string;
  bodyHtml: string;
  bodyText: string;
  labelIds: string[];
} {
  const headers = message.payload?.headers || [];
  
  const getHeader = (name: string) => 
    headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

  const fromHeader = getHeader('From');
  const fromMatch = fromHeader.match(/(?:"?([^"<]*)"?\s*)?<?([^>]+)>?/);
  
  const toHeader = getHeader('To');
  const toEmails = toHeader.split(',').map((e: string) => e.trim()).filter((e: string) => e);
  
  const ccHeader = getHeader('Cc');
  const ccEmails = ccHeader ? ccHeader.split(',').map((e: string) => e.trim()).filter((e: string) => e) : [];

  // Extract body content
  let bodyHtml = '';
  let bodyText = '';

  function extractBody(part: gmail_v1.Schema$MessagePart) {
    if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf8');
    }
    if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText = Buffer.from(part.body.data, 'base64').toString('utf8');
    }
    if (part.parts) {
      part.parts.forEach(extractBody);
    }
  }

  if (message.payload) {
    extractBody(message.payload);
  }

  return {
    id: message.id || '',
    threadId: message.threadId || '',
    subject: getHeader('Subject'),
    from: {
      name: fromMatch?.[1]?.trim() || '',
      email: fromMatch?.[2]?.trim() || fromHeader,
    },
    to: toEmails,
    cc: ccEmails,
    date: new Date(parseInt(message.internalDate || '0')),
    snippet: message.snippet || '',
    bodyHtml,
    bodyText,
    labelIds: message.labelIds || [],
  };
}

// Search emails by contact email (for linking to leads)
export async function searchEmailsByContact(
  accessToken: string,
  contactEmail: string,
  options?: {
    maxResults?: number;
    pageToken?: string;
  }
): Promise<{ messages: gmail_v1.Schema$Message[]; nextPageToken?: string }> {
  return listEmails(accessToken, {
    maxResults: options?.maxResults || 50,
    query: `from:${contactEmail} OR to:${contactEmail}`,
    pageToken: options?.pageToken,
  });
}

// Get email thread
export async function getThread(
  accessToken: string,
  threadId: string
): Promise<gmail_v1.Schema$Thread> {
  const gmail = getGmailClient(accessToken);

  const response = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full',
  });

  return response.data;
}

// Mark email as read
export async function markAsRead(
  accessToken: string,
  messageId: string
): Promise<void> {
  const gmail = getGmailClient(accessToken);

  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      removeLabelIds: ['UNREAD'],
    },
  });
}

// Get user's Gmail profile
export async function getProfile(accessToken: string): Promise<{
  emailAddress: string;
  messagesTotal: number;
}> {
  const gmail = getGmailClient(accessToken);

  const response = await gmail.users.getProfile({
    userId: 'me',
  });

  return {
    emailAddress: response.data.emailAddress || '',
    messagesTotal: response.data.messagesTotal || 0,
  };
}
