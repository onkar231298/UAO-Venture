---
name: Field quality deletion locking
description: Concurrency and storage rules for permanently deleting generated IRF/TRF records.
---

Permanent IRF/TRF deletion must hold one parent-record lock while obtaining the authoritative attachment list, deleting owned storage objects, unlinking dependent records, and deleting database children. Every path that creates a link or attachment must coordinate on that same parent lock.

**Why:** Listing attachments before locking allows a concurrent upload to leave an orphaned object, while unlocked IRF link creation or editing can leave a TRF pointing to a deleted IRF. Deleting database rows before storage cleanup also removes the only durable reference needed to retry a failed object deletion.

**How to apply:** Any new endpoint that links a record to an IRF or attaches data to a field quality record must join the parent-lock protocol. Owned-file cleanup failures must abort the database delete and return a retryable failure; arbitrary external URLs must never be sent to the storage deletion API.