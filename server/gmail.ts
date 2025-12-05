import { google, gmail_v1 } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];

// Token refresh buffer - refresh 5 minutes before expiry
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

// Email config interface for type safety
export interface EmailConfigForRefresh {
  id: number;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
}

// Callback to update tokens in storage
export type TokenUpdateCallback = (configId: number, tokens: {
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt: Date;
}) => Promise<void>;

// OAuth2 client configuration
function getOAuth2Client() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  
  // Use production domain for OAuth redirect URI
  const redirectUri = 'https://bright-organic.com/api/auth/gmail/callback';

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

// Check if token needs refresh
function isTokenExpired(tokenExpiresAt: Date | null): boolean {
  if (!tokenExpiresAt) return true;
  const now = Date.now();
  const expiresAt = new Date(tokenExpiresAt).getTime();
  return now >= expiresAt - TOKEN_REFRESH_BUFFER_MS;
}

// Refresh access token using refresh token
async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: Date;
  newRefreshToken?: string;
}> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token - no access token returned');
  }
  
  // Calculate expiry time (default to 1 hour if not provided)
  const expiresIn = credentials.expiry_date 
    ? credentials.expiry_date - Date.now()
    : 3600 * 1000;
  const expiresAt = new Date(Date.now() + expiresIn);
  
  console.log('[Gmail] Token refreshed successfully, expires at:', expiresAt);
  
  return {
    accessToken: credentials.access_token,
    expiresAt,
    newRefreshToken: credentials.refresh_token || undefined,
  };
}

// Get valid access token, refreshing if needed
export async function ensureValidAccessToken(
  config: EmailConfigForRefresh,
  updateTokens: TokenUpdateCallback
): Promise<string> {
  // Check if we have the required tokens
  if (!config.accessToken && !config.refreshToken) {
    throw new Error('Gmail not connected - no tokens available');
  }
  
  // If token is still valid, return it
  if (config.accessToken && !isTokenExpired(config.tokenExpiresAt)) {
    console.log('[Gmail] Access token still valid, expires at:', config.tokenExpiresAt);
    return config.accessToken;
  }
  
  // Token expired or missing - need to refresh
  if (!config.refreshToken) {
    throw new Error('Gmail token expired and no refresh token available - reconnection required');
  }
  
  console.log('[Gmail] Access token expired, refreshing...');
  
  try {
    const refreshed = await refreshAccessToken(config.refreshToken);
    
    // Update tokens in database
    await updateTokens(config.id, {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.newRefreshToken,
      tokenExpiresAt: refreshed.expiresAt,
    });
    
    return refreshed.accessToken;
  } catch (error: any) {
    console.error('[Gmail] Token refresh failed:', error.message);
    
    // Check if this is an invalid_grant error (refresh token revoked)
    if (error.message?.includes('invalid_grant') || error.code === 400) {
      throw new Error('Gmail authorization revoked - please reconnect your Gmail account');
    }
    
    throw error;
  }
}

// Create Gmail client with access token
export function getGmailClient(accessToken: string): gmail_v1.Gmail {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Create Gmail client with automatic token refresh
export async function getGmailClientWithRefresh(
  config: EmailConfigForRefresh,
  updateTokens: TokenUpdateCallback
): Promise<gmail_v1.Gmail> {
  const validAccessToken = await ensureValidAccessToken(config, updateTokens);
  return getGmailClient(validAccessToken);
}

// Inline attachment for embedding in emails (like signatures)
export interface InlineAttachment {
  contentId: string;  // e.g., 'signature_image'
  base64Data: string; // Base64 encoded image data
  mimeType: string;   // e.g., 'image/png'
  filename?: string;  // e.g., 'signature.png'
}

// Regular file attachment
export interface FileAttachment {
  base64Data: string; // Base64 encoded file data
  mimeType: string;   // e.g., 'application/pdf'
  filename: string;   // e.g., 'document.pdf'
}

// Send email using Gmail API with support for inline and file attachments
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
    inlineAttachments?: InlineAttachment[];
    fileAttachments?: FileAttachment[];
  }
): Promise<{ messageId: string; threadId: string }> {
  const gmail = getGmailClient(accessToken);

  // Build email MIME message
  const toHeader = options.to.join(', ');
  const ccHeader = (options.cc || []).filter(e => e && e.trim()).join(', ');
  const bccHeader = (options.bcc || []).filter(e => e && e.trim()).join(', ');
  
  const hasInlineAttachments = options.inlineAttachments && options.inlineAttachments.length > 0;
  const hasFileAttachments = options.fileAttachments && options.fileAttachments.length > 0;
  
  const mixedBoundary = 'mixed_' + Date.now();
  const relatedBoundary = 'related_' + Date.now();
  const alternativeBoundary = 'alternative_' + Date.now();
  
  let emailLines = [
    `To: ${toHeader}`,
  ];
  
  // Only add CC header if there are valid CC addresses
  if (ccHeader) emailLines.push(`Cc: ${ccHeader}`);
  // Only add BCC header if there are valid BCC addresses
  if (bccHeader) emailLines.push(`Bcc: ${bccHeader}`);
  if (options.fromName && options.fromEmail) {
    emailLines.push(`From: ${options.fromName} <${options.fromEmail}>`);
  }
  
  emailLines.push(
    `Subject: ${options.subject}`,
    `MIME-Version: 1.0`,
  );
  
  // Determine outer boundary structure
  if (hasFileAttachments) {
    // multipart/mixed as outer container for file attachments
    emailLines.push(
      `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
      '',
      `--${mixedBoundary}`,
    );
    
    if (hasInlineAttachments) {
      // multipart/related for inline images inside mixed
      emailLines.push(
        `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
        '',
        `--${relatedBoundary}`,
        `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
        '',
      );
    } else {
      emailLines.push(
        `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
        '',
      );
    }
  } else if (hasInlineAttachments) {
    // multipart/related for inline images only
    emailLines.push(
      `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
      '',
      `--${relatedBoundary}`,
      `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
      '',
    );
  } else {
    // Simple multipart/alternative for text/html
    emailLines.push(
      `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
      '',
    );
  }
  
  // Add text/plain part
  emailLines.push(
    `--${alternativeBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    options.bodyText || options.bodyHtml.replace(/<[^>]*>/g, ''),
    '',
  );
  
  // Add text/html part
  emailLines.push(
    `--${alternativeBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    options.bodyHtml,
    '',
    `--${alternativeBoundary}--`,
  );
  
  // Add inline attachments if any (close related boundary)
  if (hasInlineAttachments) {
    for (const attachment of options.inlineAttachments!) {
      emailLines.push(
        '',
        `--${relatedBoundary}`,
        `Content-Type: ${attachment.mimeType}`,
        `Content-Transfer-Encoding: base64`,
        `Content-ID: <${attachment.contentId}>`,
        `Content-Disposition: inline; filename="${attachment.filename || 'image'}"`,
        '',
        attachment.base64Data,
      );
    }
    emailLines.push('', `--${relatedBoundary}--`);
  }
  
  // Add file attachments if any
  if (hasFileAttachments) {
    for (const attachment of options.fileAttachments!) {
      emailLines.push(
        '',
        `--${mixedBoundary}`,
        `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
        `Content-Transfer-Encoding: base64`,
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        '',
        attachment.base64Data,
      );
    }
    emailLines.push('', `--${mixedBoundary}--`);
  }
  
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

// Reply to an existing email thread with support for inline and file attachments
export async function replyToEmail(
  accessToken: string,
  threadId: string,
  options: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    fromName?: string;
    fromEmail?: string;
    inReplyTo?: string;
    references?: string;
    inlineAttachments?: InlineAttachment[];
    fileAttachments?: FileAttachment[];
  }
): Promise<{ messageId: string; threadId: string }> {
  const gmail = getGmailClient(accessToken);

  const toHeader = options.to.join(', ');
  const ccHeader = (options.cc || []).filter(e => e && e.trim()).join(', ');
  const bccHeader = (options.bcc || []).filter(e => e && e.trim()).join(', ');
  
  const hasInlineAttachments = options.inlineAttachments && options.inlineAttachments.length > 0;
  const hasFileAttachments = options.fileAttachments && options.fileAttachments.length > 0;
  
  const mixedBoundary = 'mixed_' + Date.now();
  const relatedBoundary = 'related_' + Date.now();
  const alternativeBoundary = 'alternative_' + Date.now();
  
  let emailLines = [
    `To: ${toHeader}`,
  ];
  
  if (ccHeader) emailLines.push(`Cc: ${ccHeader}`);
  if (bccHeader) emailLines.push(`Bcc: ${bccHeader}`);
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
  );
  
  // Determine outer boundary structure
  if (hasFileAttachments) {
    // multipart/mixed as outer container for file attachments
    emailLines.push(
      `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
      '',
      `--${mixedBoundary}`,
    );
    
    if (hasInlineAttachments) {
      emailLines.push(
        `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
        '',
        `--${relatedBoundary}`,
        `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
        '',
      );
    } else {
      emailLines.push(
        `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
        '',
      );
    }
  } else if (hasInlineAttachments) {
    emailLines.push(
      `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
      '',
      `--${relatedBoundary}`,
      `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
      '',
    );
  } else {
    emailLines.push(
      `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
      '',
    );
  }
  
  emailLines.push(
    `--${alternativeBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    options.bodyText || options.bodyHtml.replace(/<[^>]*>/g, ''),
    '',
    `--${alternativeBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    options.bodyHtml,
    '',
    `--${alternativeBoundary}--`,
  );
  
  if (hasInlineAttachments) {
    for (const attachment of options.inlineAttachments!) {
      emailLines.push(
        '',
        `--${relatedBoundary}`,
        `Content-Type: ${attachment.mimeType}`,
        `Content-Transfer-Encoding: base64`,
        `Content-ID: <${attachment.contentId}>`,
        `Content-Disposition: inline; filename="${attachment.filename || 'image'}"`,
        '',
        attachment.base64Data,
      );
    }
    emailLines.push('', `--${relatedBoundary}--`);
  }
  
  // Add file attachments if any
  if (hasFileAttachments) {
    for (const attachment of options.fileAttachments!) {
      emailLines.push(
        '',
        `--${mixedBoundary}`,
        `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
        `Content-Transfer-Encoding: base64`,
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        '',
        attachment.base64Data,
      );
    }
    emailLines.push('', `--${mixedBoundary}--`);
  }
  
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
