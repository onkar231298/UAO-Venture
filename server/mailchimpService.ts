import crypto from "node:crypto";
import { ReplitConnectors } from "@replit/connectors-sdk";

const MAILCHIMP_API_ROOT = "/3.0";
const MAX_ERROR_DETAIL = 240;
const client = new ReplitConnectors();

export class ProviderError extends Error {
  constructor(
    public status: number,
    public type: string,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }

  problem() {
    return {
      type: `https://bright-organic.com/problems/${this.type}`,
      title: this.type.replaceAll("-", " "),
      status: this.status,
      detail: this.message,
    };
  }
}

function apiKey(): string | undefined {
  return process.env.MAILCHIMP_API_KEY;
}

function dataCenter(): string {
  const key = apiKey();
  const suffix = key?.split("-").pop();
  if (!key || !suffix || !/^[a-z0-9]+$/i.test(suffix)) {
    throw new ProviderError(
      503,
      "mailchimp-not-ready",
      "Mailchimp write access is not configured.",
    );
  }
  return suffix;
}

function providerFailureMessage(status: number): string {
  if (status === 401 || status === 403) {
    return "Mailchimp credentials do not allow this operation. Check the API key permissions.";
  }
  if (status === 404) {
    return "The configured Mailchimp audience or campaign no longer exists.";
  }
  if (status === 429) {
    return "Mailchimp is temporarily rate limiting requests. Please try again shortly.";
  }
  if (status >= 500) {
    return "Mailchimp is temporarily unavailable. Please try again shortly.";
  }
  return "Mailchimp rejected the request. Check the audience, sender verification, and campaign settings.";
}

export async function request(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<any> {
  const method = init.method || "GET";
  let response: Response;

  try {
    if (apiKey()) {
      response = await fetch(
        `https://${dataCenter()}.api.mailchimp.com${MAILCHIMP_API_ROOT}${path}`,
        {
          method,
          headers: {
            Authorization: `Basic ${Buffer.from(`replit:${apiKey()}`).toString("base64")}`,
            "Content-Type": "application/json",
          },
          body: init.body === undefined ? undefined : JSON.stringify(init.body),
          signal: AbortSignal.timeout(120_000),
        },
      );
    } else {
      if (method !== "GET") {
        throw new ProviderError(
          503,
          "mailchimp-write-unavailable",
          "The connected Mailchimp account is read-only. Add a Mailchimp Marketing API key in Replit Secrets to enable campaign sending.",
        );
      }
    response = await client.proxy("mailchimp", path, {
        method: "GET",
      });
    }
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError(
      502,
      "mailchimp-unavailable",
      "Mailchimp could not be reached. Please try again shortly.",
    );
  }

  if (!response.ok) {
    // Consume the body so the proxy connection can be reused, but never put
    // provider response bodies (which may contain recipient data) in logs/errors.
    await response.text().catch(() => "");
    throw new ProviderError(
      response.status >= 500 ? 502 : response.status,
      "mailchimp-api-error",
      providerFailureMessage(response.status).slice(0, MAX_ERROR_DETAIL),
    );
  }

  return response.status === 204 ? null : response.json();
}

export const mailchimpMemberHash = (email: string): string =>
  crypto
    .createHash("md5")
    .update(email.trim().toLowerCase())
    .digest("hex");

export function toMailchimpMergeTags(value: string): string {
  return value
    .replace(/{{\s*contact_name\s*}}/gi, "*|FNAME|*")
    .replace(/{{\s*company_name\s*}}/gi, "*|COMPANY|*")
    .replace(/{{\s*email\s*}}/gi, "*|EMAIL|*");
}

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      (
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        } as Record<string, string>
      )[character],
  );
}

export function campaignFooter(
  attachments: Array<{ url: string; filename: string }> = [],
): string {
  const attachmentRows = attachments
    .map(
      (attachment) =>
        `<li style="margin:4px 0"><a href="${escapeHtml(attachment.url)}">${escapeHtml(attachment.filename)}</a></li>`,
    )
    .join("");
  const attachmentBlock = attachmentRows
    ? `<div style="margin:24px 0;padding:16px;background:#f9fafb;border:1px solid #e5e7eb"><strong>Downloads</strong><ul style="margin:8px 0 0;padding-left:20px">${attachmentRows}</ul></div>`
    : "";

  return `${attachmentBlock}<div style="margin-top:24px;padding:16px;text-align:center;font-size:12px;line-height:1.6;color:#6b7280;border-top:1px solid #e5e7eb">Bright Fame Organic Pvt. Ltd.<br>Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui, Mehsana, Gujarat 384001, India<br><a href="*|UNSUB|*">Unsubscribe</a></div>`;
}

export function appendCampaignFooter(
  html: string,
  attachments: Array<{ url: string; filename: string }> = [],
): string {
  const footer = campaignFooter(attachments);
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${footer}</body>`);
  }
  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, `${footer}</html>`);
  }
  return `${html}${footer}`;
}

export async function readiness(): Promise<{
  ready: boolean;
  configured: boolean;
  writeAccess: boolean;
  accountName?: string;
  message: string;
}> {
  if (!apiKey()) {
    return {
      ready: false,
      configured: false,
      writeAccess: false,
      message:
        "The connected Mailchimp account is read-only. Add a Mailchimp Marketing API key in Replit Secrets to enable campaign sending.",
    };
  }

  try {
    const account = await request("/");
    return {
      ready: true,
      configured: true,
      writeAccess: true,
      accountName: account?.account_name,
      message: "Mailchimp is ready.",
    };
  } catch (error: any) {
    return {
      ready: false,
      configured: true,
      writeAccess: false,
      message: error?.message || "Mailchimp is unavailable.",
    };
  }
}

export async function audiences(): Promise<any[]> {
  const data = await request("/lists?count=100&fields=lists.id,lists.name,lists.stats.member_count,total_items");
  return data?.lists || [];
}

export function senderDomainIsVerified(
  email: string,
  verifiedDomains: any[],
): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  return verifiedDomains.some(
    (entry) =>
      String(entry?.domain || "").toLowerCase() === domain &&
      (entry?.verified === true ||
        entry?.status === "VERIFIED" ||
        entry?.status === "AUTHENTICATED"),
  );
}

export async function verifySenderEmail(email: string): Promise<boolean> {
  const response = await request("/verified-domains?count=1000");
  return senderDomainIsVerified(email, response?.domains || []);
}

async function ensureMergeFields(listId: string): Promise<void> {
  const response = await request(
    `/lists/${encodeURIComponent(listId)}/merge-fields?count=100&fields=merge_fields.tag,total_items`,
  );
  const existing = new Set<string>(
    (response?.merge_fields || []).map((field: any) => field.tag),
  );
  const desired = [
    { tag: "FNAME", name: "First name" },
    { tag: "COMPANY", name: "Company" },
  ];
  for (const field of desired) {
    if (!existing.has(field.tag)) {
      await request(`/lists/${encodeURIComponent(listId)}/merge-fields`, {
        method: "POST",
        body: { ...field, type: "text" },
      });
    }
  }
}

export type MailchimpRecipient = {
  email: string;
  companyId?: number;
  contactName?: string | null;
  companyName?: string | null;
};

export type MailchimpMemberResult = {
  recipient: MailchimpRecipient;
  hash: string;
  id?: string;
  status: string;
  excluded: boolean;
  reason?: string;
};

export async function upsertMember(
  listId: string,
  recipient: MailchimpRecipient,
): Promise<MailchimpMemberResult> {
  const hash = mailchimpMemberHash(recipient.email);
  try {
    // status_if_new is deliberately used without status. Existing unsubscribed,
    // cleaned, pending, or transactional members must never be resubscribed.
    const member = await request(
      `/lists/${encodeURIComponent(listId)}/members/${hash}`,
      {
        method: "PUT",
        body: {
          email_address: recipient.email,
          status_if_new: "subscribed",
          merge_fields: {
            FNAME: recipient.contactName || "",
            COMPANY: recipient.companyName || "",
          },
        },
      },
    );
    const status = member?.status || "unknown";
    return {
      recipient,
      hash,
      id: member?.id,
      status,
      excluded: status !== "subscribed",
      reason:
        status === "subscribed"
          ? undefined
          : `Mailchimp member status is ${status}.`,
    };
  } catch (error: any) {
    return {
      recipient,
      hash,
      status: "sync_failed",
      excluded: true,
      reason: error?.message || "Mailchimp member synchronization failed.",
    };
  }
}

async function deleteRemoteDraft(
  campaignId?: string,
  listId?: string,
  segmentId?: string,
): Promise<void> {
  if (campaignId) {
    await request(`/campaigns/${encodeURIComponent(campaignId)}`, {
      method: "DELETE",
    }).catch(() => undefined);
  }
  if (listId && segmentId) {
    await request(
      `/lists/${encodeURIComponent(listId)}/segments/${encodeURIComponent(segmentId)}`,
      { method: "DELETE" },
    ).catch(() => undefined);
  }
}

export function deliveryOutcomeIsUncertain(error: unknown): boolean {
  if (!(error instanceof ProviderError)) return true;
  return error.status === 408 ||
    error.status === 425 ||
    error.status === 429 ||
    error.status >= 500;
}

export const campaignIdempotencyMarker = (campaignKey: string) => `[bfo:${campaignKey}]`;
const campaignTitle = (name: string, campaignKey: string) =>
  `${name.slice(0, 180)} ${campaignIdempotencyMarker(campaignKey)}`;
const segmentTitle = (campaignKey: string) => `BFO ${campaignKey}`;

export async function createAndSend(input: {
  audienceId: string;
  campaignKey: string;
  name: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  html: string;
  attachments?: Array<{ url: string; filename: string }>;
  recipients: MailchimpRecipient[];
  scheduledAt?: Date;
  onProgress?: () => Promise<void>;
  onPrepared?: (state: {
    campaignId: string;
    segmentId: string;
    members: MailchimpMemberResult[];
  }) => Promise<void>;
}): Promise<{
  campaignId: string;
  segmentId: string;
  members: MailchimpMemberResult[];
}> {
  await input.onProgress?.();
  await ensureMergeFields(input.audienceId);

  const members: MailchimpMemberResult[] = [];
  for (let index = 0; index < input.recipients.length; index += 5) {
    members.push(
      ...(await Promise.all(
        input.recipients
          .slice(index, index + 5)
          .map((recipient) => upsertMember(input.audienceId, recipient)),
      )),
    );
    await input.onProgress?.();
  }

  const allowed = members.filter((member) => !member.excluded);
  if (allowed.length === 0) {
    const error: any = new ProviderError(
      409,
      "mailchimp-no-subscribed-recipients",
      "None of the selected recipients can receive marketing email in this audience.",
    );
    error.members = members;
    throw error;
  }

  let segmentId: string | undefined;
  let campaignId: string | undefined;
  let deliveryRequested = false;
  try {
    const segment = await request(
      `/lists/${encodeURIComponent(input.audienceId)}/segments`,
      {
        method: "POST",
        body: {
          name: segmentTitle(input.campaignKey),
          static_segment: allowed.map((member) => member.recipient.email),
        },
      },
    );
    segmentId = String(segment?.id || "");
    if (!segmentId) {
      throw new ProviderError(
        502,
        "mailchimp-segment-failed",
        "Mailchimp did not create the recipient segment.",
      );
    }

    const campaign = await request("/campaigns", {
      method: "POST",
      body: {
        type: "regular",
        recipients: {
          list_id: input.audienceId,
          segment_opts: { saved_segment_id: Number(segmentId) },
        },
        settings: {
          title: campaignTitle(input.name, input.campaignKey),
          subject_line: toMailchimpMergeTags(input.subject),
          from_name: input.fromName,
          reply_to: input.fromEmail,
        },
      },
    });
    campaignId = campaign?.id;
    if (!campaignId) {
      throw new ProviderError(
        502,
        "mailchimp-campaign-failed",
        "Mailchimp did not create the campaign.",
      );
    }

    await request(`/campaigns/${encodeURIComponent(campaignId)}/content`, {
      method: "PUT",
      body: {
        html: appendCampaignFooter(
          toMailchimpMergeTags(input.html),
          input.attachments,
        ),
      },
    });
    await input.onPrepared?.({ campaignId, segmentId, members });

    if (input.scheduledAt) {
      deliveryRequested = true;
      await request(
        `/campaigns/${encodeURIComponent(campaignId)}/actions/schedule`,
        {
          method: "POST",
          body: { schedule_time: input.scheduledAt.toISOString() },
        },
      );
    } else {
      deliveryRequested = true;
      await request(
        `/campaigns/${encodeURIComponent(campaignId)}/actions/send`,
        { method: "POST" },
      );
    }

    return { campaignId, segmentId, members };
  } catch (error: any) {
    const uncertain = deliveryRequested && deliveryOutcomeIsUncertain(error);
    if (!uncertain) {
      await deleteRemoteDraft(campaignId, input.audienceId, segmentId);
    } else {
      // If the delivery request timed out, Mailchimp may have accepted it.
      // Preserve remote identifiers so reconciliation can establish the truth,
      // and let local idempotency prevent a duplicate campaign.
      error.providerCampaignId = campaignId;
      error.providerSegmentId = segmentId;
      error.deliveryUncertain = true;
      error.members = members;
    }
    throw error;
  }
}

export async function recoverStaleCampaignAttempt(input: {
  campaignKey: string;
  audienceId: string;
  campaignId?: string | null;
  segmentId?: string | null;
}): Promise<{
  outcome: "discarded" | "not_found" | "delivery_possible";
  campaignId?: string;
  segmentId?: string;
  providerStatus?: string;
}> {
  let campaign: any = null;
  if (input.campaignId) {
    try {
      campaign = await request(`/campaigns/${encodeURIComponent(input.campaignId)}`);
    } catch (error) {
      if (!(error instanceof ProviderError) || error.status !== 404) throw error;
    }
  }
  if (!campaign) {
    const response = await request(
      "/campaigns?count=1000&sort_field=create_time&sort_dir=DESC",
    );
    const marker = campaignIdempotencyMarker(input.campaignKey);
    campaign = (response?.campaigns || []).find((item: any) =>
      String(item?.settings?.title || "").includes(marker),
    );
  }

  let segmentId = input.segmentId ||
    (campaign?.recipients?.segment_opts?.saved_segment_id
      ? String(campaign.recipients.segment_opts.saved_segment_id)
      : undefined);
  if (!segmentId) {
    const response = await request(
      `/lists/${encodeURIComponent(input.audienceId)}/segments?count=1000`,
    );
    const segment = (response?.segments || []).find(
      (item: any) => item?.name === segmentTitle(input.campaignKey),
    );
    segmentId = segment?.id ? String(segment.id) : undefined;
  }

  if (campaign && campaign.status !== "save") {
    return {
      outcome: "delivery_possible",
      campaignId: String(campaign.id),
      segmentId,
      providerStatus: campaign.status,
    };
  }

  if (campaign) {
    await request(`/campaigns/${encodeURIComponent(String(campaign.id))}`, {
      method: "DELETE",
    });
  }
  if (segmentId) {
    await request(
      `/lists/${encodeURIComponent(input.audienceId)}/segments/${encodeURIComponent(segmentId)}`,
      { method: "DELETE" },
    );
  }
  return {
    outcome: campaign || segmentId ? "discarded" : "not_found",
    campaignId: campaign?.id ? String(campaign.id) : undefined,
    segmentId,
    providerStatus: campaign?.status,
  };
}

export type CampaignReportSummary = {
  status: "scheduled" | "sent";
  sentAt: Date | null;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
};

function validDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function mapCampaignReport(report: any): CampaignReportSummary {
  const sentCount = Number(report?.emails_sent || 0);
  const bouncedCount =
    Number(report?.bounces?.hard_bounces || 0) +
    Number(report?.bounces?.soft_bounces || 0) +
    Number(report?.bounces?.syntax_errors || 0);
  const sentAt = validDate(report?.send_time);
  return {
    status: sentAt ? "sent" : "scheduled",
    sentAt,
    sentCount,
    deliveredCount: Math.max(0, sentCount - bouncedCount),
    openedCount: Number(report?.opens?.unique_opens || 0),
    clickedCount: Number(report?.clicks?.unique_subscriber_clicks || 0),
    bouncedCount,
    unsubscribedCount: Number(report?.unsubscribed || 0),
  };
}

export type RecipientActivity = {
  email: string;
  status: "sent" | "opened" | "clicked" | "bounced";
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  bounceReason?: string;
};

export function mapEmailActivity(row: any): RecipientActivity | null {
  if (!row || typeof row.email_address !== "string") return null;
  const result: RecipientActivity = {
    email: row.email_address.trim().toLowerCase(),
    status: "sent",
  };
  for (const event of Array.isArray(row.activity) ? row.activity : []) {
    const at = validDate(event?.timestamp);
    switch (event?.action) {
      case "sent":
        if (at && !result.sentAt) result.sentAt = at;
        break;
      case "open":
        result.status = result.status === "clicked" ? "clicked" : "opened";
        if (at && !result.openedAt) result.openedAt = at;
        break;
      case "click":
        result.status = "clicked";
        if (at && !result.clickedAt) result.clickedAt = at;
        break;
      case "bounce":
        result.status = "bounced";
        if (at && !result.bouncedAt) result.bouncedAt = at;
        result.bounceReason =
          typeof event.type === "string" ? event.type.slice(0, 100) : undefined;
        break;
    }
  }
  return result;
}

export async function campaignReport(campaignId: string): Promise<{
  summary: CampaignReportSummary;
  recipients: RecipientActivity[];
}> {
  const report = await request(
    `/reports/${encodeURIComponent(campaignId)}`,
  );
  const recipients: RecipientActivity[] = [];
  let offset = 0;
  const count = 1000;

  while (true) {
    const page = await request(
      `/reports/${encodeURIComponent(campaignId)}/email-activity?count=${count}&offset=${offset}`,
    );
    const rows = Array.isArray(page?.emails) ? page.emails : [];
    recipients.push(
      ...rows
        .map(mapEmailActivity)
        .filter((row: RecipientActivity | null): row is RecipientActivity => !!row),
    );
    offset += rows.length;
    if (rows.length === 0 || offset >= Number(page?.total_items || 0)) break;
  }

  return { summary: mapCampaignReport(report), recipients };
}

export type MailchimpWebhookEvent = {
  type: "unsubscribe" | "cleaned" | "upemail" | "campaign" | "other";
  audienceId?: string;
  campaignId?: string;
  email?: string;
  newEmail?: string;
  status?: string;
  reason?: string;
};

export function mapWebhookEvent(body: any): MailchimpWebhookEvent {
  const type = ["unsubscribe", "cleaned", "upemail", "campaign"].includes(
    body?.type,
  )
    ? body.type
    : "other";
  const data =
    body?.data && typeof body.data === "object"
      ? body.data
      : Object.fromEntries(
          Object.entries(body || {})
            .filter(([key]) => key.startsWith("data[") && key.endsWith("]"))
            .map(([key, value]) => [key.slice(5, -1), value]),
        );
  const emailValue =
    typeof data.email === "string"
      ? data.email
      : type === "upemail" && typeof data.old_email === "string"
        ? data.old_email
        : undefined;
  const email = emailValue?.trim().toLowerCase();
  return {
    type,
    audienceId:
      typeof data.list_id === "string" ? data.list_id : undefined,
    campaignId:
      typeof data.campaign_id === "string"
        ? data.campaign_id
        : type === "campaign" && typeof data.id === "string"
          ? data.id
          : undefined,
    email,
    newEmail:
      typeof data.new_email === "string"
        ? data.new_email.trim().toLowerCase()
        : undefined,
    status: typeof data.status === "string" ? data.status : undefined,
    reason:
      typeof data.reason === "string" ? data.reason.slice(0, 200) : undefined,
  };
}

export function verifyWebhookBasicAuth(
  header: unknown,
  configured = process.env.MAILCHIMP_WEBHOOK_SECRET,
): boolean {
  if (typeof header !== "string" || !configured || !header.startsWith("Basic ")) {
    return false;
  }
  let decoded = "";
  try {
    decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  } catch {
    return false;
  }
  const separator = decoded.indexOf(":");
  if (separator < 0 || decoded.slice(0, separator) !== "mailchimp") return false;
  const expected = Buffer.from(configured);
  const supplied = Buffer.from(decoded.slice(separator + 1));
  if (expected.length !== supplied.length) return false;
  return crypto.timingSafeEqual(expected, supplied);
}