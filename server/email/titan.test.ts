import assert from "node:assert/strict";
import test from "node:test";
import { simpleParser } from "mailparser";
import {
  findTitanSentMailbox,
  TITAN_SENT_COPY_WARNING,
  TitanEmailProvider,
} from "./titan";

test("Titan send transmits and appends the same RFC message with threading intact", async () => {
  const events: string[] = [];
  let smtpRaw: Buffer | undefined;
  let smtpEnvelope: any;
  let appendedRaw: Buffer | undefined;
  let appendFlags: string[] | undefined;
  let appendDate: Date | string | undefined;

  const provider = new TitanEmailProvider({
    smtpTransport: (() => ({
      sendMail: async (options: any) => {
        events.push("smtp");
        smtpRaw = options.raw;
        smtpEnvelope = options.envelope;
        return {
          messageId: "<transport-generated-id@example.com>",
          accepted: options.envelope.to,
          rejected: [],
          pending: [],
          response: "250 accepted",
          envelope: options.envelope,
        };
      },
      close: () => events.push("smtp-close"),
    })) as any,
    imapClient: (() => ({
      connect: async () => {
        events.push("imap-connect");
      },
      list: async () => {
        events.push("imap-list");
        return [
          { path: "INBOX", name: "INBOX" },
          { path: "Sent Items", name: "Sent Items", specialUse: "\\Sent" },
        ];
      },
      mailboxOpen: async (path: string, options?: { readOnly?: boolean }) => {
        events.push(`imap-open:${path}`);
        if (options?.readOnly !== false) {
          throw new Error("Sent mailbox must be opened writable before APPEND");
        }
      },
      search: async () => {
        events.push("imap-search");
        return [];
      },
      append: async (
        path: string,
        raw: Buffer,
        flags: string[],
        date: Date | string,
      ) => {
        events.push(`imap-append:${path}`);
        appendedRaw = raw;
        appendFlags = flags;
        appendDate = date;
        return { destination: path, uid: 42 };
      },
      logout: async () => {
        events.push("imap-logout");
      },
    })) as any,
  });

  const result = await provider.send(
    { email: "sales@example.com", encryptedAppPassword: "unused-by-test" },
    {
      to: ["buyer@example.com"],
      cc: ["accounts@example.com"],
      bcc: ["audit@example.com"],
      subject: "Re: Quotation Q-100",
      bodyHtml: "<p>Please see the updated quotation.</p>",
      bodyText: "Please see the updated quotation.",
      fromName: "Sales Team",
      inReplyTo: "<parent@customer.example>",
      references: "<root@example.com> <parent@customer.example>",
      attachments: [{
        filename: "quotation.pdf",
        mimeType: "application/pdf",
        base64Data: Buffer.from("test-pdf").toString("base64"),
      }],
    },
  );

  assert.equal(result.sentFolderSaved, true);
  assert.equal(result.sentFolderPath, "Sent Items");
  assert.equal(result.threadId, "<root@example.com>");
  assert.match(result.messageId, /^<[^>]+@example\.com>$/);
  assert.deepEqual(smtpEnvelope, {
    from: "sales@example.com",
    to: ["buyer@example.com", "accounts@example.com", "audit@example.com"],
  });
  assert.ok(smtpRaw);
  assert.ok(appendedRaw);
  assert.equal(appendedRaw.equals(smtpRaw), true);
  assert.deepEqual(appendFlags, ["\\Seen"]);
  assert.ok(appendDate instanceof Date);
  assert.deepEqual(events, [
    "smtp",
    "smtp-close",
    "imap-connect",
    "imap-list",
    "imap-open:Sent Items",
    "imap-search",
    "imap-append:Sent Items",
    "imap-logout",
  ]);

  const parsed = await simpleParser(smtpRaw);
  assert.equal(parsed.messageId, result.messageId);
  assert.equal(parsed.inReplyTo, "<parent@customer.example>");
  assert.deepEqual(parsed.references, [
    "<root@example.com>",
    "<parent@customer.example>",
  ]);
  assert.equal(parsed.html, "<p>Please see the updated quotation.</p>");
  assert.equal(parsed.bcc, undefined);
  assert.equal(parsed.attachments[0]?.filename, "quotation.pdf");
  assert.equal(parsed.attachments[0]?.content.toString(), "test-pdf");
});

test("SMTP success remains successful when saving the Titan Sent copy fails", async () => {
  let smtpAttempts = 0;
  let appendAttempts = 0;
  const provider = new TitanEmailProvider({
    smtpTransport: (() => ({
      sendMail: async (options: any) => {
        smtpAttempts++;
        return {
          messageId: "<transport-id@example.com>",
          accepted: options.envelope.to,
          rejected: [],
          pending: [],
          response: "250 accepted",
          envelope: options.envelope,
        };
      },
      close: () => undefined,
    })) as any,
    imapClient: (() => ({
      connect: async () => undefined,
      list: async () => [
        { path: "Sent", name: "Sent", specialUse: "\\Sent" },
      ],
      mailboxOpen: async () => undefined,
      search: async () => [],
      append: async () => {
        appendAttempts++;
        throw new Error("mailbox quota exceeded");
      },
      logout: async () => undefined,
    })) as any,
  });

  const originalConsoleError = console.error;
  console.error = () => undefined;
  try {
    const result = await provider.send(
      { email: "sales@example.com", encryptedAppPassword: "unused-by-test" },
      {
        to: ["buyer@example.com"],
        subject: "Delivered once",
        bodyText: "Do not retry this SMTP submission.",
      },
    );

    assert.equal(smtpAttempts, 1);
    assert.equal(appendAttempts, 1);
    assert.equal(result.sentFolderSaved, false);
    assert.equal(result.warning, TITAN_SENT_COPY_WARNING);
    assert.match(result.messageId, /^<[^>]+@example\.com>$/);
  } finally {
    console.error = originalConsoleError;
  }
});

test("an SMTP copy already present in Titan Sent is not appended twice", async () => {
  let appendAttempts = 0;
  const provider = new TitanEmailProvider({
    smtpTransport: (() => ({
      sendMail: async (options: any) => ({
        messageId: "<transport-id@example.com>",
        accepted: options.envelope.to,
        rejected: [],
        pending: [],
        response: "250 accepted",
        envelope: options.envelope,
      }),
      close: () => undefined,
    })) as any,
    imapClient: (() => ({
      connect: async () => undefined,
      list: async () => [
        { path: "Sent", name: "Sent", specialUse: "\\Sent" },
      ],
      mailboxOpen: async () => undefined,
      search: async () => [99],
      append: async () => {
        appendAttempts++;
        return { destination: "Sent", uid: 100 };
      },
      logout: async () => undefined,
    })) as any,
  });

  const result = await provider.send(
    { email: "sales@example.com", encryptedAppPassword: "unused-by-test" },
    {
      to: ["buyer@example.com"],
      subject: "Already copied",
      bodyText: "Titan saved this automatically.",
    },
  );

  assert.equal(result.sentFolderSaved, true);
  assert.equal(result.sentFolderPath, "Sent");
  assert.equal(appendAttempts, 0);
});

test("Titan Sent mailbox discovery prefers special-use and supports common names", () => {
  assert.equal(
    findTitanSentMailbox([
      { path: "Archive/Sent", name: "Sent" },
      { path: "Sent Messages", name: "Sent Messages", specialUse: "\\Sent" },
    ]),
    "Sent Messages",
  );
  assert.equal(
    findTitanSentMailbox([
      { path: "INBOX", name: "INBOX" },
      { path: "Sent Mail", name: "Sent Mail" },
    ]),
    "Sent Mail",
  );
  assert.equal(
    findTitanSentMailbox([{ path: "INBOX", name: "INBOX" }]),
    undefined,
  );
});