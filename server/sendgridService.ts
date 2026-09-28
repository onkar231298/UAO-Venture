import sgMail from "@sendgrid/mail";
import { db } from "./db";
import { emailCampaigns, emailCampaignRecipients, emailTemplates, companies, companyContacts } from "@shared/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

const DEFAULT_FROM_EMAIL = "sales@bright-organic.com";
const DEFAULT_FROM_NAME = "Cape NatureX Organic";

// Initialize API key fresh each time to pick up secret updates
function initSendGrid(): boolean {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    console.log(`[SendGrid] API key configured (length: ${apiKey.length})`);
    sgMail.setApiKey(apiKey);
    return true;
  }
  console.warn("[SendGrid] API key not found - email functionality disabled");
  return false;
}

// Export function to verify API key exists (without exposing it)
export function verifyApiKeyExists(): { exists: boolean; length?: number } {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey && apiKey.length > 10) {
    return { exists: true, length: apiKey.length };
  }
  return { exists: false };
}

interface EmailRecipient {
  email: string;
  contactName?: string;
  companyName?: string;
  companyId?: number;
}

export interface EmailAttachment {
  content: string; // Base64 encoded content
  filename: string;
  type: string; // MIME type
  disposition?: 'attachment' | 'inline';
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

interface BulkEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
    result = result.replace(regex, value || "");
  }
  return result;
}

export async function sendSingleEmail(options: SendEmailOptions): Promise<BulkEmailResult> {
  if (!initSendGrid()) {
    return { success: false, error: "SendGrid API key not configured" };
  }

  try {
    // Create text version from HTML, ensuring it's never empty
    let textContent = options.text || options.html.replace(/<[^>]*>/g, "").trim();
    if (!textContent || textContent.length === 0) {
      textContent = "Please view this email in an HTML-compatible email client.";
    }
    
    // Ensure HTML content is valid and not empty
    const htmlContent = options.html && options.html.trim().length > 0 
      ? options.html 
      : `<p>${textContent}</p>`;
    
    console.log(`[SendGrid] Preparing email - HTML length: ${htmlContent.length}, Text length: ${textContent.length}`);
    
    const msg: any = {
      to: options.to,
      from: {
        email: DEFAULT_FROM_EMAIL,
        name: options.fromName || DEFAULT_FROM_NAME,
      },
      replyTo: options.replyTo || DEFAULT_FROM_EMAIL,
      subject: options.subject,
      text: textContent,
      html: htmlContent,
      // Click tracking is DISABLED on purpose: SendGrid rewrites every link
      // through url####.bright-organic.com, and that tracking subdomain serves
      // SendGrid's *.sendgrid.net SSL cert (no branded-link SSL provisioned),
      // so browsers block the redirect and recipients can't open any link.
      // Re-enable only after branded-link SSL is set up in SendGrid.
      // Open tracking is left at the account default (unaffected by this).
      trackingSettings: {
        clickTracking: { enable: false, enableText: false },
      },
    };

    // Add attachments if provided
    if (options.attachments && options.attachments.length > 0) {
      msg.attachments = options.attachments.map(att => ({
        content: att.content,
        filename: att.filename,
        type: att.type,
        disposition: att.disposition || 'attachment',
      }));
      console.log(`[SendGrid] Including ${options.attachments.length} attachment(s)`);
    }

    const response = await sgMail.send(msg);
    const messageId = response[0]?.headers?.["x-message-id"];
    
    console.log(`[SendGrid] Email sent to ${options.to}, messageId: ${messageId}`);
    return { success: true, messageId };
  } catch (error: any) {
    const errorBody = error?.response?.body;
    const errorMessage = errorBody?.errors?.[0]?.message || error.message;
    console.error(`[SendGrid] Failed to send email to ${options.to}:`);
    console.error(`[SendGrid] Status: ${error?.code || error?.response?.statusCode}`);
    console.error(`[SendGrid] Error body:`, JSON.stringify(errorBody, null, 2));
    console.error(`[SendGrid] Error message: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

export async function sendBulkEmails(
  campaignId: number,
  recipients: EmailRecipient[],
  subject: string,
  htmlContent: string,
  textContent?: string,
  fromName?: string,
  replyTo?: string,
  attachments?: EmailAttachment[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  if (!initSendGrid()) {
    return { sent: 0, failed: recipients.length, errors: ["SendGrid API key not configured"] };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  await db.update(emailCampaigns)
    .set({ status: "sending", totalRecipients: recipients.length })
    .where(eq(emailCampaigns.id, campaignId));

  for (const recipient of recipients) {
    const variables: Record<string, string> = {
      contact_name: recipient.contactName || "Valued Customer",
      company_name: recipient.companyName || "",
      email: recipient.email,
    };

    const personalizedHtml = replaceVariables(htmlContent, variables);
    const personalizedSubject = replaceVariables(subject, variables);
    const personalizedText = textContent ? replaceVariables(textContent, variables) : undefined;

    const result = await sendSingleEmail({
      to: recipient.email,
      subject: personalizedSubject,
      html: personalizedHtml,
      text: personalizedText,
      fromName,
      replyTo,
      attachments,
    });

    await db.insert(emailCampaignRecipients).values({
      campaignId,
      companyId: recipient.companyId,
      email: recipient.email,
      contactName: recipient.contactName,
      companyName: recipient.companyName,
      status: result.success ? "sent" : "failed",
      sendgridMessageId: result.messageId,
      sentAt: result.success ? new Date() : null,
      failedAt: result.success ? null : new Date(),
      failureReason: result.error,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${recipient.email}: ${result.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  await db.update(emailCampaigns)
    .set({
      status: "sent",
      sentAt: new Date(),
      sentCount: sent,
      failedCount: failed,
      updatedAt: new Date(),
    })
    .where(eq(emailCampaigns.id, campaignId));

  console.log(`[SendGrid] Campaign ${campaignId} completed: ${sent} sent, ${failed} failed`);
  return { sent, failed, errors };
}

export async function createCampaign(
  name: string,
  subject: string,
  htmlContent: string,
  textContent: string | null,
  createdBy: string,
  fromName?: string,
  replyTo?: string,
  templateId?: number,
  scheduledAt?: Date
): Promise<number> {
  const result = await db.insert(emailCampaigns).values({
    name,
    subject,
    htmlContent,
    textContent,
    fromName,
    replyToEmail: replyTo,
    templateId,
    status: scheduledAt ? "scheduled" : "draft",
    scheduledAt,
    createdBy,
  }).returning();

  return result[0].id;
}

export async function getCampaigns(userId: string, isAdmin: boolean) {
  if (isAdmin) {
    return db.select().from(emailCampaigns).orderBy(sql`${emailCampaigns.createdAt} DESC`);
  }
  return db.select()
    .from(emailCampaigns)
    .where(eq(emailCampaigns.createdBy, userId))
    .orderBy(sql`${emailCampaigns.createdAt} DESC`);
}

export async function getCampaignById(id: number) {
  const campaign = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id));
  return campaign[0] || null;
}

export async function getCampaignRecipients(campaignId: number) {
  return db.select()
    .from(emailCampaignRecipients)
    .where(eq(emailCampaignRecipients.campaignId, campaignId))
    .orderBy(sql`${emailCampaignRecipients.createdAt} DESC`);
}

export async function getTemplates() {
  return db.select()
    .from(emailTemplates)
    .where(eq(emailTemplates.isActive, true))
    .orderBy(sql`${emailTemplates.createdAt} DESC`);
}

export async function createTemplate(
  name: string,
  subject: string,
  htmlContent: string,
  textContent: string | null,
  description: string | null,
  variables: string[],
  createdBy: string
): Promise<number> {
  const result = await db.insert(emailTemplates).values({
    name,
    subject,
    htmlContent,
    textContent,
    description,
    variables,
    createdBy,
  }).returning({ id: emailTemplates.id });

  return result[0].id;
}

export async function updateTemplate(
  id: number,
  data: {
    name?: string;
    subject?: string;
    htmlContent?: string;
    textContent?: string | null;
    description?: string | null;
    variables?: string[];
    isActive?: boolean;
  }
): Promise<boolean> {
  const result = await db.update(emailTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(emailTemplates.id, id));
  return true;
}

export async function deleteTemplate(id: number): Promise<boolean> {
  await db.update(emailTemplates)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(emailTemplates.id, id));
  return true;
}

export async function getCompaniesForBulkEmail(userId: string, isAdmin: boolean) {
  const baseQuery = isAdmin 
    ? db.select({
        id: companies.id,
        name: companies.companyName,
        email: companies.primaryEmail,
      })
      .from(companies)
      .where(eq(companies.status, "active"))
    : db.select({
        id: companies.id,
        name: companies.companyName,
        email: companies.primaryEmail,
      })
      .from(companies)
      .where(and(
        eq(companies.status, "active"),
        eq(companies.assignedTo, userId)
      ));
  
  const companiesResult = await baseQuery;
  
  // Get all company IDs to fetch their contacts
  const companyIds = companiesResult.map(c => c.id);
  
  // Fetch all contacts for these companies
  const contacts = companyIds.length > 0 
    ? await db.select({
        id: companyContacts.id,
        companyId: companyContacts.companyId,
        name: companyContacts.contactName,
        email: companyContacts.email,
      })
      .from(companyContacts)
      .where(inArray(companyContacts.companyId, companyIds))
    : [];
  
  // Group contacts by company and add to each company
  return companiesResult.map(company => ({
    ...company,
    contacts: contacts
      .filter(c => c.companyId === company.id && c.email)
      .map(c => ({ id: c.id, name: c.name, email: c.email }))
  }));
}

export async function getCompanyContacts(companyIds: number[]) {
  if (companyIds.length === 0) return [];
  
  return db.select({
    id: companyContacts.id,
    companyId: companyContacts.companyId,
    name: companyContacts.contactName,
    email: companyContacts.email,
  })
  .from(companyContacts)
  .where(inArray(companyContacts.companyId, companyIds));
}

export async function getCampaignStats(campaignId: number) {
  const recipients = await db.select()
    .from(emailCampaignRecipients)
    .where(eq(emailCampaignRecipients.campaignId, campaignId));

  const stats = {
    total: recipients.length,
    pending: recipients.filter(r => r.status === "pending").length,
    sent: recipients.filter(r => r.status === "sent").length,
    delivered: recipients.filter(r => r.status === "delivered").length,
    opened: recipients.filter(r => r.status === "opened").length,
    clicked: recipients.filter(r => r.status === "clicked").length,
    bounced: recipients.filter(r => r.status === "bounced").length,
    failed: recipients.filter(r => r.status === "failed").length,
  };

  return stats;
}

export async function updateRecipientStatus(
  sendgridMessageId: string,
  status: string,
  additionalData?: {
    bounceReason?: string;
  }
): Promise<boolean> {
  const updateData: Record<string, any> = { status };
  
  switch (status) {
    case "delivered":
      updateData.deliveredAt = new Date();
      break;
    case "opened":
      updateData.openedAt = new Date();
      break;
    case "clicked":
      updateData.clickedAt = new Date();
      break;
    case "bounced":
      updateData.bouncedAt = new Date();
      updateData.bounceReason = additionalData?.bounceReason;
      break;
  }

  await db.update(emailCampaignRecipients)
    .set(updateData)
    .where(eq(emailCampaignRecipients.sendgridMessageId, sendgridMessageId));

  return true;
}
