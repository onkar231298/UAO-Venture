import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { decryptEmailCredential } from "./credentials";
import { stableInboundMessageId } from "./syncPolicy";

export interface TitanCredentials {
  email: string;
  encryptedAppPassword: string;
}

export interface EmailAttachmentInput {
  filename: string;
  mimeType: string;
  base64Data: string;
  contentId?: string;
  disposition?: "attachment" | "inline";
}

export interface SendEmailInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  fromName?: string;
  inReplyTo?: string;
  references?: string;
  attachments?: EmailAttachmentInput[];
}

export interface SyncedEmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  contentId?: string;
  disposition?: string;
}

export interface SyncedInboxMessage {
  uid: number;
  messageId: string;
  inReplyTo: string;
  references: string;
  subject: string;
  from: { name: string; email: string };
  to: string[];
  cc: string[];
  bcc: string[];
  receivedAt: Date;
  bodyHtml: string;
  bodyText: string;
  attachments: SyncedEmailAttachment[];
  flags: string[];
}

export interface TitanInboxSyncResult {
  uidValidity: number;
  lastUid: number;
  messages: SyncedInboxMessage[];
}

const smtpHost = process.env.TITAN_SMTP_HOST || "smtp.titan.email";
const smtpPort = Number(process.env.TITAN_SMTP_PORT || 465);
const imapHost = process.env.TITAN_IMAP_HOST || "imap.titan.email";
const imapPort = Number(process.env.TITAN_IMAP_PORT || 993);

function passwordFor(credentials: TitanCredentials): string {
  if (!credentials.email) throw new Error("Titan email address is required");
  if (!credentials.encryptedAppPassword) throw new Error("Titan app password has not been configured");
  return decryptEmailCredential(credentials.encryptedAppPassword);
}

function smtpTransport(credentials: TitanCredentials) {
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: true,
    auth: { user: credentials.email, pass: passwordFor(credentials) },
  });
}

function imapClient(credentials: TitanCredentials) {
  return new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: true,
    auth: { user: credentials.email, pass: passwordFor(credentials) },
    logger: false,
  });
}

function addressList(value: unknown): string[] {
  const addressObjects = Array.isArray(value) ? value : [value];
  const entries = addressObjects.flatMap((addressObject) =>
    addressObject && typeof addressObject === "object" && "value" in addressObject
      ? (addressObject as { value?: Array<{ address?: string }> }).value || []
      : [],
  );
  return entries.flatMap((entry) => (entry.address ? [entry.address] : []));
}

function firstAddress(value: unknown): { name: string; email: string } {
  if (!value || typeof value !== "object" || !("value" in value)) return { name: "", email: "" };
  const entry = (value as { value?: Array<{ address?: string; name?: string }> }).value?.[0];
  return { name: entry?.name || "", email: entry?.address || "" };
}

function stableThreadId(messageId: string, inReplyTo: string, references: string): string {
  const referenceChain = references.trim().split(/\s+/).filter(Boolean);
  return referenceChain[0] || inReplyTo || messageId;
}

export class TitanEmailProvider {
  async verifyCredentials(credentials: TitanCredentials): Promise<void> {
    const transport = smtpTransport(credentials);
    const imap = imapClient(credentials);
    try {
      await transport.verify();
      await imap.connect();
      await imap.mailboxOpen("INBOX", { readOnly: true });
    } finally {
      await imap.logout().catch(() => undefined);
      transport.close();
    }
  }

  async send(credentials: TitanCredentials, input: SendEmailInput): Promise<{ messageId: string; threadId: string }> {
    if (!input.to.length) throw new Error("At least one recipient is required");
    const transport = smtpTransport(credentials);
    let info;
    try {
      info = await transport.sendMail({
        from: input.fromName ? `${input.fromName} <${credentials.email}>` : credentials.email,
        to: input.to,
        cc: input.cc,
        bcc: input.bcc,
        subject: input.subject,
        html: input.bodyHtml,
        text: input.bodyText || (input.bodyHtml ? input.bodyHtml.replace(/<[^>]*>/g, "") : undefined),
        inReplyTo: input.inReplyTo,
        references: input.references || input.inReplyTo,
        attachments: input.attachments?.map((attachment) => ({
          filename: attachment.filename,
          contentType: attachment.mimeType,
          content: Buffer.from(attachment.base64Data, "base64"),
          cid: attachment.contentId,
          contentDisposition: attachment.disposition || (attachment.contentId ? "inline" : "attachment"),
        })),
      });
    } finally {
      transport.close();
    }
    const messageId = info.messageId;
    if (!messageId) throw new Error("Titan SMTP accepted mail without returning a Message-ID");
    return { messageId, threadId: stableThreadId(messageId, input.inReplyTo || "", input.references || "") };
  }

  async reply(
    credentials: TitanCredentials,
    input: SendEmailInput & { inReplyTo: string },
  ): Promise<{ messageId: string; threadId: string }> {
    if (!input.inReplyTo) throw new Error("An RFC Message-ID is required to send a reply");
    return this.send(credentials, {
      ...input,
      references: input.references || input.inReplyTo,
    });
  }

  async syncInbox(
    credentials: TitanCredentials,
    checkpoint?: { lastUid?: number | null; uidValidity?: number | null },
  ): Promise<TitanInboxSyncResult> {
    const imap = imapClient(credentials);
    try {
      await imap.connect();
      const lock = await imap.getMailboxLock("INBOX");
      try {
        const mailbox = imap.mailbox;
        if (!mailbox) throw new Error("Titan IMAP did not open INBOX");
        const uidValidity = Number(mailbox.uidValidity || 0);
        const checkpointIsValid = checkpoint?.uidValidity === uidValidity;
        const afterUid = checkpointIsValid ? checkpoint?.lastUid || 0 : 0;
        const highestKnownUid = Math.max(0, Number(mailbox.uidNext || 1) - 1);
        if (afterUid >= highestKnownUid) {
          return { uidValidity, lastUid: afterUid, messages: [] };
        }
        const messages: SyncedInboxMessage[] = [];
        let lastUid = afterUid;
        for await (const fetched of imap.fetch(`${afterUid + 1}:${highestKnownUid}`, {
          uid: true,
          source: true,
          flags: true,
          internalDate: true,
        }, { uid: true })) {
          if (!fetched.source) continue;
          const parsed = await simpleParser(fetched.source);
          const messageId = stableInboundMessageId(fetched.source, parsed.messageId);
          const references = parsed.references || "";
          messages.push({
            uid: fetched.uid,
            messageId,
            inReplyTo: parsed.inReplyTo || "",
            references: Array.isArray(references) ? references.join(" ") : references,
            subject: parsed.subject || "",
            from: firstAddress(parsed.from),
            to: addressList(parsed.to),
            cc: addressList(parsed.cc),
            bcc: addressList(parsed.bcc),
            receivedAt: parsed.date ||
              (fetched.internalDate
                ? new Date(fetched.internalDate)
                : new Date()),
            bodyHtml: typeof parsed.html === "string" ? parsed.html : "",
            bodyText: parsed.text || "",
            attachments: parsed.attachments.map((attachment) => ({
              filename: attachment.filename || "attachment",
              mimeType: attachment.contentType,
              size: attachment.size,
              contentId: attachment.cid || undefined,
              disposition: attachment.contentDisposition,
            })),
            flags: fetched.flags ? Array.from(fetched.flags) : [],
          });
          lastUid = Math.max(lastUid, fetched.uid);
        }
        return { uidValidity, lastUid, messages };
      } finally {
        lock.release();
      }
    } finally {
      await imap.logout().catch(() => undefined);
    }
  }
}

export const titanEmailProvider = new TitanEmailProvider();