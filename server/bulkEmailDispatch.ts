import { and, eq, inArray, sql } from "drizzle-orm";
import { companies, users } from "@shared/schema";
import { db } from "./db";
import {
  getSharedMailchimpConfiguration,
  isBulkEmailAdmin,
  isEligibleBulkEmailSender,
  resolveAutomaticMailchimpConfiguration,
  sharedMailchimpConfigurationMatches,
  type SharedMailchimpConfiguration,
} from "./bulkEmailCampaignService";

type DispatchSnapshot = SharedMailchimpConfiguration & { replyToEmail: string };

export function assertBulkEmailDispatchState(
  expected: DispatchSnapshot,
  current: {
    configuration: SharedMailchimpConfiguration | null;
    conflicts: SharedMailchimpConfiguration[];
  },
) {
  if (!current.configuration || current.conflicts.length ||
      !sharedMailchimpConfigurationMatches([current.configuration], expected)) {
    throw Object.assign(new Error("Bulk email settings changed while preparing this campaign. Nothing was sent; review the current settings."), { status: 409 });
  }
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
    const shared = await getSharedMailchimpConfiguration(tx);
    // This is deliberately a read-only provider lookup. In particular, a
    // campaign prepared against a sole account audience must not be dispatched
    // if that account has become ambiguous or the chosen audience disappeared.
    const { audiences } = await import("./mailchimpService");
    const resolved = resolveAutomaticMailchimpConfiguration(shared, await audiences());
    assertBulkEmailDispatchState(expected, {
      configuration: resolved,
      conflicts: shared.conflicts,
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