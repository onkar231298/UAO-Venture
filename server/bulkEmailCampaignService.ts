import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "./db";
import { companies, companyContacts, emailCampaignRecipients, emailCampaigns, bulkEmailUserConfigs } from "@shared/schema";
import type { UserEmailConfig } from "@shared/schema";
import { z } from "zod";

export const BULK_EMAIL_FROM_EMAIL = "sales@bright-organic.com";
export const BULK_EMAIL_FROM_NAME = "Atlas Ingredients";
export const BULK_EMAIL_REPLY_TO_EMAIL = "sales@bright-organic.com";

export const isBulkEmailAdmin = (role?: string | null) => role === "admin" || role === "super_admin";
export const isEligibleBulkEmailSender = (user?: { role?: string | null; accountStatus?: string | null } | null) =>
  !!user &&
  user.accountStatus === "active" &&
  ["sales_manager", "sales_executive", "admin", "super_admin"].includes(user.role || "");

export const BULK_EMAIL_REPLY_ADDRESS_REQUIRED_MESSAGE =
  "No valid reply address is assigned to this sales agent. An administrator must assign a valid company email or staff email before bulk campaigns can be sent.";

export function resolveBulkEmailReplyTo(
  config: Pick<
    UserEmailConfig,
    "companyEmail"
  > | null | undefined,
  staffEmail?: string | null,
): string | null {
  // Bulk-mail reply routing needs an address, not mailbox credentials or a
  // connected mail client. Do not use this helper for ordinary mailbox sending.
  const assigned = z.string().trim().email().safeParse(config?.companyEmail);
  if (assigned.success) return assigned.data.toLowerCase();
  const fallback = z.string().trim().email().safeParse(staffEmail);
  return fallback.success ? fallback.data.toLowerCase() : null;
}

export const MAILCHIMP_INDEPENDENT_REPLY_TO_UNVERIFIED_MESSAGE =
  "Mailchimp Marketing's documented setup uses the campaign email address for the visible sender and direct replies. This integration cannot send with a shared From address and a different agent Reply-To. Agent access does not remove this provider limitation.";

export function mailchimpRoutingCapability(fromEmail?: string | null, replyToEmail?: string | null): {
  ready: boolean; message?: string;
} {
  const from = z.string().trim().email().safeParse(fromEmail);
  const reply = z.string().trim().email().safeParse(replyToEmail);
  if (!reply.success) return { ready: false, message: BULK_EMAIL_REPLY_ADDRESS_REQUIRED_MESSAGE };
  if (!from.success) return { ready: false, message: "A valid shared Mailchimp sender address is required." };
  return from.data.toLowerCase() === reply.data.toLowerCase()
    ? { ready: true }
    : { ready: false, message: MAILCHIMP_INDEPENDENT_REPLY_TO_UNVERIFIED_MESSAGE };
}

export function publicBulkEmailError(error: unknown): { status: number; message: string } {
  const candidate = error as { status?: unknown; message?: unknown };
  const status = typeof candidate?.status === "number" &&
    Number.isInteger(candidate.status) &&
    candidate.status >= 400 &&
    candidate.status < 500
    ? candidate.status
    : 500;
  return {
    status,
    message: status < 500 && typeof candidate?.message === "string"
      ? candidate.message
      : "Failed to create email campaign",
  };
}
export const canAccessCampaign = (campaign: { createdBy: string | null }, userId: string, admin: boolean) =>
  admin || campaign.createdBy === userId;

export function dedupeRecipients(items: Array<{ email: string; companyId?: number; contactName?: string | null; companyName?: string | null }>) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const email = item.email.trim().toLowerCase();
    if (!email || seen.has(email)) return false;
    seen.add(email);
    return true;
  }).map(item => ({ ...item, email: item.email.trim().toLowerCase() }));
}

export function sharedMailchimpConfigurationMatches(
  configs: Array<{ audienceId: string; fromEmail: string; fromName: string }>,
  candidate: { audienceId: string; fromEmail: string; fromName: string },
) {
  const normalizedEmail = candidate.fromEmail.trim().toLowerCase();
  const normalizedName = candidate.fromName.trim();
  return configs.every((config) =>
    config.audienceId === candidate.audienceId &&
    config.fromEmail.trim().toLowerCase() === normalizedEmail &&
    config.fromName.trim() === normalizedName
  );
}

export function parseCampaignSchedule(value: string | undefined, now = Date.now()): Date | undefined {
  if (!value) return undefined;
  const scheduledAt = new Date(value);
  const earliest = now + 10 * 60 * 1000;
  const latest = now + 366 * 24 * 60 * 60 * 1000;
  if (
    Number.isNaN(scheduledAt.getTime()) ||
    scheduledAt.getTime() < earliest ||
    scheduledAt.getTime() > latest
  ) {
    throw Object.assign(
      new Error("Scheduled campaigns must be between 10 minutes and one year in the future."),
      { status: 400 },
    );
  }
  return scheduledAt;
}

export async function getCampaigns(userId: string, admin: boolean) {
  return db.select().from(emailCampaigns).where(admin ? undefined : eq(emailCampaigns.createdBy, userId))
    .orderBy(sql`${emailCampaigns.createdAt} DESC`);
}
export async function createCampaign(data: { name: string; subject: string; htmlContent: string; textContent?: string | null; createdBy: string; fromName: string; replyToEmail: string; templateId?: number; scheduledAt?: Date; attachments?: any[]; providerAudienceId: string; idempotencyKey: string; recipientPermissionBasis: string; recipientPermissionConfirmedAt: Date; recipientPermissionConfirmedBy: string }) {
  return (await db.insert(emailCampaigns).values({ ...data, provider: "mailchimp", status: "draft" }).returning({ id: emailCampaigns.id }))[0].id;
}
export async function getCampaignByIdempotencyKey(idempotencyKey: string, userId: string) {
  return (await db.select().from(emailCampaigns).where(and(
    eq(emailCampaigns.idempotencyKey, idempotencyKey),
    eq(emailCampaigns.createdBy, userId),
  )))[0] || null;
}
export async function getCampaignStats(campaignId: number) {
  const rows = await db.select().from(emailCampaignRecipients).where(eq(emailCampaignRecipients.campaignId, campaignId));
  const count = (status: string) => rows.filter(r => r.status === status).length;
  return { total: rows.length, pending: count("pending"), sent: count("sent"), delivered: count("delivered"), opened: count("opened"), clicked: count("clicked"), bounced: count("bounced"), failed: count("failed"), excluded: count("excluded") };
}
export async function getCampaignForUser(id: number, userId: string, admin: boolean) {
  const campaign = (await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id)))[0];
  return campaign && canAccessCampaign(campaign, userId, admin) ? campaign : null;
}
export async function getCampaignRecipientsForUser(id: number, userId: string, admin: boolean) {
  if (!await getCampaignForUser(id, userId, admin)) return null;
  return db.select().from(emailCampaignRecipients).where(eq(emailCampaignRecipients.campaignId, id));
}
export async function getUserConfig(_userId?: string) {
  const shared = await getSharedMailchimpConfiguration();
  if (shared.conflicts.length) {
    throw Object.assign(new Error(
      "Legacy Mailchimp records reference multiple different audiences. Remove the conflict before sending.",
    ), { status: 409 });
  }
  return shared.configuration;
}

export type SharedMailchimpConfiguration = {
  audienceId: string;
  fromEmail: string;
  fromName: string;
};
export function resolveSharedMailchimpConfiguration(rows: Array<SharedMailchimpConfiguration>): {
  configuration: SharedMailchimpConfiguration | null;
  conflicts: SharedMailchimpConfiguration[];
} {
  if (!rows.length) return { configuration: null, conflicts: [] };
  const unique = new Map<string, SharedMailchimpConfiguration>();
  for (const row of rows) {
    const audienceId = row.audienceId.trim();
    if (!audienceId) continue;
    const config = {
      audienceId,
      fromEmail: BULK_EMAIL_FROM_EMAIL,
      fromName: BULK_EMAIL_FROM_NAME,
    };
    // Legacy sender names, sender addresses, and enabled flags are no longer
    // authoritative. Only a disagreement about the actual audience conflicts.
    unique.set(config.audienceId, config);
  }
  const configurations = Array.from(unique.values());
  if (!configurations.length) return { configuration: null, conflicts: [] };
  return { configuration: configurations[0], conflicts: configurations.length > 1 ? configurations : [] };
}

export function resolveAutomaticMailchimpConfiguration(
  legacy: ReturnType<typeof resolveSharedMailchimpConfiguration>,
  providerAudiences: Array<{ id?: unknown }>,
): SharedMailchimpConfiguration {
  if (legacy.conflicts.length) {
    throw Object.assign(new Error(
      "Legacy Mailchimp records reference multiple different audiences. Remove the conflict before sending.",
    ), { status: 409 });
  }
  const actualIds = Array.from(new Set(providerAudiences
    .map(audience => String(audience.id || "").trim())
    .filter(Boolean)));
  let audienceId = legacy.configuration?.audienceId;
  if (audienceId) {
    if (!actualIds.includes(audienceId)) {
      throw Object.assign(new Error("The saved Mailchimp audience no longer exists."), { status: 409 });
    }
  } else if (actualIds.length === 1) {
    audienceId = actualIds[0];
  } else if (actualIds.length === 0) {
    throw Object.assign(new Error("The Mailchimp account has no audience available for sending."), { status: 409 });
  } else {
    throw Object.assign(new Error(
      "The Mailchimp account has multiple audiences and no single saved audience. A single audience must be established before sending.",
    ), { status: 409 });
  }
  return { audienceId, fromEmail: BULK_EMAIL_FROM_EMAIL, fromName: BULK_EMAIL_FROM_NAME };
}

export async function getSharedMailchimpConfiguration(database: Pick<typeof db, "select"> = db): Promise<{
  configuration: SharedMailchimpConfiguration | null;
  conflicts: SharedMailchimpConfiguration[];
}> {
  const rows = await database.select().from(bulkEmailUserConfigs)
    .orderBy(bulkEmailUserConfigs.createdAt, bulkEmailUserConfigs.id);
  return resolveSharedMailchimpConfiguration(rows);
}
export async function getCompaniesForBulkEmail(userId: string, admin: boolean) {
  const companyRows = await db.select({
    id: companies.id,
    name: companies.companyName,
    email: companies.primaryEmail,
  }).from(companies).where(admin
    ? eq(companies.status, "active")
    : and(eq(companies.status, "active"), eq(companies.assignedTo, userId)));
  const ids = companyRows.map((company) => company.id);
  const contacts = ids.length
    ? await db.select({
        id: companyContacts.id,
        companyId: companyContacts.companyId,
        name: companyContacts.contactName,
        email: companyContacts.email,
      }).from(companyContacts).where(inArray(companyContacts.companyId, ids))
    : [];
  return companyRows.map((company) => ({
    ...company,
    contacts: contacts
      .filter((contact) => contact.companyId === company.id && contact.email)
      .map((contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
      })),
  }));
}
export async function getEligibleRecipients(companyIds: number[], userId: string, admin: boolean) {
  const owned = await db.select({ id: companies.id, name: companies.companyName, email: companies.primaryEmail })
    .from(companies).where(and(inArray(companies.id, companyIds), eq(companies.status, "active"), ...(admin ? [] : [eq(companies.assignedTo, userId)])));
  if (owned.length !== new Set(companyIds).size) throw Object.assign(new Error("One or more selected companies are unavailable"), { status: 403 });
  const contacts = owned.length ? await db.select({ companyId: companyContacts.companyId, name: companyContacts.contactName, email: companyContacts.email })
    .from(companyContacts).where(inArray(companyContacts.companyId, owned.map(x => x.id))) : [];
  return dedupeRecipients([
    ...owned.filter(x => x.email).map(x => ({ email: x.email!, companyId: x.id, contactName: x.name, companyName: x.name })),
    ...contacts.filter(x => x.email).map(x => {
      const company = owned.find(c => c.id === x.companyId)!;
      return { email: x.email!, companyId: x.companyId, contactName: x.name, companyName: company.name };
    }),
  ]);
}

export async function reconcileMailchimpCampaign(campaignId: number) {
  const campaign = (await db.select().from(emailCampaigns)
    .where(eq(emailCampaigns.id, campaignId)))[0];
  if (!campaign || campaign.provider !== "mailchimp" || !campaign.providerCampaignId) {
    throw Object.assign(new Error("This campaign has no Mailchimp report."), { status: 400 });
  }

  const { campaignReport } = await import("./mailchimpService");
  const report = await campaignReport(campaign.providerCampaignId);
  await db.update(emailCampaigns).set({
    status: report.summary.status,
    sentAt: report.summary.sentAt,
    sentCount: report.summary.sentCount,
    deliveredCount: report.summary.deliveredCount,
    openedCount: report.summary.openedCount,
    clickedCount: report.summary.clickedCount,
    bouncedCount: report.summary.bouncedCount,
    unsubscribedCount: report.summary.unsubscribedCount,
    providerError: report.summary.providerError,
    updatedAt: new Date(),
  }).where(eq(emailCampaigns.id, campaignId));

  // Older submissions marked every eligible recipient sent optimistically.
  // Clear only those unconfirmed records; leave observed engagement and opt-outs.
  await db.update(emailCampaignRecipients).set({
    status: "pending",
    sentAt: null,
  }).where(and(
    eq(emailCampaignRecipients.campaignId, campaignId),
    eq(emailCampaignRecipients.status, "sent"),
    eq(emailCampaignRecipients.providerStatus, "subscribed"),
  ));

  for (const activity of report.recipients) {
    await db.update(emailCampaignRecipients).set({
      status: activity.status,
      providerStatus: activity.status,
      sentAt: activity.sentAt,
      openedAt: activity.openedAt,
      clickedAt: activity.clickedAt,
      bouncedAt: activity.bouncedAt,
      bounceReason: activity.bounceReason,
    }).where(and(
      eq(emailCampaignRecipients.campaignId, campaignId),
      sql`lower(${emailCampaignRecipients.email}) = ${activity.email}`,
      ne(emailCampaignRecipients.status, "excluded"),
      ne(emailCampaignRecipients.status, "unsubscribed"),
    ));
  }

  return (await db.select().from(emailCampaigns)
    .where(eq(emailCampaigns.id, campaignId)))[0];
}

export async function applyMailchimpWebhookEvent(event: {
  type: "unsubscribe" | "cleaned" | "upemail" | "campaign" | "other";
  audienceId?: string;
  campaignId?: string;
  email?: string;
  newEmail?: string;
  status?: string;
  reason?: string;
}) {
  if (event.type === "other") return;

  if (event.type === "campaign" && event.campaignId) {
    // A delayed webhook can describe a send that Mailchimp later disabled.
    // Read current provider truth rather than trusting the old notification.
    const { getMailchimpDeliveryState } = await import("./mailchimpService");
    const state = await getMailchimpDeliveryState(event.campaignId);
    await db.update(emailCampaigns).set({
      ...state,
      updatedAt: new Date(),
    }).where(and(
      eq(emailCampaigns.provider, "mailchimp"),
      eq(emailCampaigns.providerCampaignId, event.campaignId),
    ));
    return;
  }

  if (!event.email || !event.audienceId) return;
  const campaigns = await db.select({ id: emailCampaigns.id })
    .from(emailCampaigns)
    .where(and(
      eq(emailCampaigns.provider, "mailchimp"),
      eq(emailCampaigns.providerAudienceId, event.audienceId),
    ));
  const campaignIds = campaigns.map((campaign) => campaign.id);
  if (!campaignIds.length) return;

  const recipientWhere = and(
    inArray(emailCampaignRecipients.campaignId, campaignIds),
    sql`lower(${emailCampaignRecipients.email}) = ${event.email}`,
  );
  if (event.type === "unsubscribe") {
    await db.update(emailCampaignRecipients).set({
      status: "unsubscribed",
      providerStatus: "unsubscribed",
      exclusionReason: "Recipient unsubscribed in Mailchimp.",
      unsubscribedAt: sql`COALESCE(${emailCampaignRecipients.unsubscribedAt}, NOW())`,
    }).where(recipientWhere);
  } else if (event.type === "cleaned") {
    await db.update(emailCampaignRecipients).set({
      status: "bounced",
      providerStatus: "cleaned",
      bounceReason: event.reason || "Mailchimp cleaned this address.",
      bouncedAt: sql`COALESCE(${emailCampaignRecipients.bouncedAt}, NOW())`,
    }).where(recipientWhere);
  } else if (event.type === "upemail" && event.newEmail) {
    const { mailchimpMemberHash } = await import("./mailchimpService");
    await db.update(emailCampaignRecipients).set({
      providerMemberHash: mailchimpMemberHash(event.newEmail),
      providerStatus: "email_updated",
    }).where(recipientWhere);
  }
}