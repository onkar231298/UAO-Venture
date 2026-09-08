import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { bulkEmailUserConfigs, companies, userEmailConfigs, users } from "@shared/schema";
import { db } from "./db";
import {
  getSharedMailchimpConfiguration,
  isBulkEmailAdmin,
  isEligibleBulkEmailSender,
  mailchimpRoutingCapability,
  resolveBulkEmailReplyTo,
  sharedMailchimpConfigurationMatches,
  type SharedMailchimpConfiguration,
} from "./bulkEmailCampaignService";

type DispatchSnapshot = SharedMailchimpConfiguration & { replyToEmail: string };

export function assertBulkEmailDispatchState(
  expected: DispatchSnapshot,
  current: {
    enabled: boolean;
    configuration: SharedMailchimpConfiguration | null;
    conflicts: SharedMailchimpConfiguration[];
    replyToEmail: string | null;
  },
) {
  if (!current.enabled) {
    throw Object.assign(new Error("Bulk email access was disabled before sending."), { status: 403 });
  }
  if (!current.configuration || current.conflicts.length ||
      !sharedMailchimpConfigurationMatches([current.configuration], expected) ||
      current.replyToEmail !== expected.replyToEmail) {
    throw Object.assign(new Error("Bulk email settings changed while preparing this campaign. Nothing was sent; review the current settings."), { status: 409 });
  }
  const routing = mailchimpRoutingCapability(current.configuration.fromEmail, current.replyToEmail);
  if (!routing.ready) throw Object.assign(new Error(routing.message), { status: 409 });
}

// Serialize the final irreversible request with admin access/config changes.
// Contact synchronization can be slow, so the earlier readiness snapshot alone
// must never authorize delivery. The provider owns uncertain-outcome handling.
export async function authorizeBulkEmailDispatch(
  userId: string,
  companyIds: number[],
  expected: DispatchSnapshot,
  dispatch: () => Promise<void>,
) {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('bulk_email_shared_mailchimp_configuration'))`);
    const [sender] = await tx.select({
      role: users.role, accountStatus: users.accountStatus, email: users.email,
    }).from(users).where(eq(users.id, userId)).for("share");
    if (!isEligibleBulkEmailSender(sender)) {
      throw Object.assign(new Error("An active sales or admin account is required."), { status: 403 });
    }
    const [access] = await tx.select({ enabled: bulkEmailUserConfigs.enabled })
      .from(bulkEmailUserConfigs).where(eq(bulkEmailUserConfigs.userId, userId));
    const shared = await getSharedMailchimpConfiguration(tx);
    const [address] = await tx.select({ companyEmail: userEmailConfigs.companyEmail })
      .from(userEmailConfigs).where(and(eq(userEmailConfigs.userId, userId), eq(userEmailConfigs.isPrimary, true)))
      .orderBy(desc(userEmailConfigs.createdAt)).limit(1).for("share");
    assertBulkEmailDispatchState(expected, {
      ...shared, enabled: access?.enabled === true,
      replyToEmail: resolveBulkEmailReplyTo(address, sender.email),
    });
    const authorizedCompanies = await tx.select({ id: companies.id }).from(companies)
      .where(and(inArray(companies.id, companyIds), eq(companies.status, "active"),
        ...(isBulkEmailAdmin(sender.role) ? [] : [eq(companies.assignedTo, userId)])))
      .for("share");
    if (authorizedCompanies.length !== new Set(companyIds).size) {
      throw Object.assign(new Error("Selected company access changed before sending. Nothing was sent."), { status: 403 });
    }
    await dispatch();
  });
}