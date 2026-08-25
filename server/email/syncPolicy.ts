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

export function isSalesOrderEmailThreadCompatible(
  order: { leadId?: number | null; companyId?: number | null },
  thread: { leadId?: number | null; companyId?: number | null },
): boolean {
  const matchesLead = typeof order.leadId === "number" && thread.leadId === order.leadId;
  const matchesCompany = typeof order.companyId === "number" && thread.companyId === order.companyId;
  return matchesLead || matchesCompany;
}

export function requestedReplyThreadId(value: unknown, isReply: unknown): number | undefined {
  if (isReply !== true) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function emailThreadIncludesRecipient(
  thread: { participantEmails?: Array<string | null> | null },
  messages: Array<{
    fromEmail?: string | null;
    toEmails?: Array<string | null> | null;
    ccEmails?: Array<string | null> | null;
    bccEmails?: Array<string | null> | null;
  }>,
  recipient: string,
): boolean {
  const normalizedRecipient = recipient.trim().toLowerCase();
  if (!normalizedRecipient) return false;
  const participants = new Set<string>();
  const add = (value?: string | null) => {
    const normalized = value?.trim().toLowerCase();
    if (normalized) participants.add(normalized);
  };
  for (const email of thread.participantEmails || []) add(email);
  for (const message of messages) {
    add(message.fromEmail);
    for (const email of message.toEmails || []) add(email);
    for (const email of message.ccEmails || []) add(email);
    for (const email of message.bccEmails || []) add(email);
  }
  return participants.has(normalizedRecipient);
}
