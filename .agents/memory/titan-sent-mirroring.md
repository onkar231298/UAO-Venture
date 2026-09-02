---
name: Titan Sent mirroring
description: Non-obvious Titan mailbox behavior and safety rules for CRM-originated email.
---

Titan SMTP submission does not reliably create a copy in the mailbox's Sent folder. Outbound CRM mail must be built once as a canonical RFC message, sent through SMTP, and then mirrored to the IMAP special-use Sent mailbox using the same Message-ID and thread headers.

**Why:** Without the IMAP copy, the Titan app cannot display or group CRM-originated messages. An IMAP failure occurs after customer delivery, so treating it as a send failure can cause staff or automated retries to deliver duplicates.

**How to apply:** Open the Sent mailbox writable before searching/appending (read-only is only for inbox sync), deduplicate by Message-ID, keep Bcc recipients in the SMTP envelope rather than message headers, and report Sent-copy failures as delivered-with-warning. Never retry SMTP solely because Sent discovery, search, or append failed.