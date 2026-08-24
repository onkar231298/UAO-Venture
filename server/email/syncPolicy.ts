import { createHash } from "node:crypto";

export function stableInboundMessageId(source: Uint8Array, parsedMessageId?: string): string {
  return parsedMessageId || `<titan-${createHash("sha256").update(source).digest("hex")}@local>`;
}

export function titanInboundProviderId(configId: number, messageId: string): string {
  return `titan:${configId}:${createHash("sha256").update(messageId).digest("hex")}`;
}

export function normalizeReplySubject(value: string): string {
  return value.replace(/^((re|fw|fwd):\s*)+/i, "").trim().toLowerCase();
}

export function renderCampaignRecipientSubject(
  template: string,
  recipient: { contactName?: string | null; companyName?: string | null; email: string },
): string {
  return template
    .replace(/{{\s*contact_name\s*}}/gi, recipient.contactName || "Valued Customer")
    .replace(/{{\s*company_name\s*}}/gi, recipient.companyName || "")
    .replace(/{{\s*email\s*}}/gi, recipient.email);
}

export function uniquelyMatchedCampaignCompanyId(
  matches: Array<{ companyId?: number | null }>,
): number | undefined {
  const companyIds = Array.from(new Set<number>(
    matches.reduce<number[]>((ids, match) => {
      if (typeof match.companyId === "number") ids.push(match.companyId);
      return ids;
    }, []),
  ));
  return companyIds.length === 1 ? companyIds[0] : undefined;
}

export function uniquelyMatchingLeadBySender<
  T extends { contactPerson?: { email?: string | null } | null },
>(leads: T[], senderEmail: string): T | undefined {
  const normalizedSender = senderEmail.toLowerCase();
  const matches = leads.filter(
    lead => lead.contactPerson?.email?.toLowerCase() === normalizedSender,
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function canSendSalesOrder(
  userId: string,
  role: string | null | undefined,
  order: {
    assignedToUserId?: string | null;
    lead?: { assignedSalesRep?: string | null } | null;
    company?: { assignedTo?: string | null } | null;
  },
): boolean {
  const privileged = role === "super_admin" || role === "sales_manager" || Boolean(role?.includes("admin"));
  return privileged ||
    order.assignedToUserId === userId ||
    order.lead?.assignedSalesRep === userId ||
    order.company?.assignedTo === userId;
}