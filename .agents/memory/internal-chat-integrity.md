---
name: Internal chat integrity
description: Concurrency and query-shape rules that keep internal group chat consistent and scalable.
---

Group membership, ownership transfer, leave, removal, and closure must serialize per conversation, then re-read membership and authorization inside the transaction. Any conditional lifecycle update must verify its affected row before committing.

**Why:** authorization checked before a concurrent ownership change becomes stale. Without shared serialization, transfer can race removal or closure and leave a group owned by a non-member, or let a former owner close it.

**How to apply:** any new group lifecycle write must participate in the same conversation-level lock and revalidate state after acquiring it. Preserve the invariant that every open group owner has an owner membership.

Permanent staff deletion is also a chat lifecycle write: deactivate first, lock every related conversation in stable ID order, close groups the staff member owns, remove direct chats/authored messages/memberships, then delete the account.

**Why:** restrictive user foreign keys otherwise break offboarding, while deleting the user without resolving ownership can leave an open group with no manager.

**How to apply:** any future staff-deletion or archival flow must explicitly preserve open-group ownership and serialize with message/group writes.

Frequently polled conversation summaries and unread counts must use bounded, set-based queries rather than one query per conversation.

**Why:** polling turns even a moderate per-conversation query fan-out into sustained database load across active staff sessions.

**How to apply:** batch members and latest/unread summaries, aggregate unread counts in one query, and require pagination for conversation lists.