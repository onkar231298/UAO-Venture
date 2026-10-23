---
name: Private quotation document storage
description: Confidential handling of signed quotations and purchase orders.
---

Signed quotation and purchase-order files are confidential commercial documents. Serve them only through quotation-scoped endpoints that re-check customer ownership or assigned staff access. Do not place them in the public-read AWS image bucket or expose raw storage paths to the client.

**Why:** These files contain customer and commercial signatures, while the project's AWS image bucket is public-read on every prefix.

**How to apply:** Future quotation, PO, and related commercial-document uploads should validate file bytes before storage and use authenticated, ownership-checked download handlers.

The user requested database storage for these documents for now and will provide a private Amazon bucket later. Keep existing stored documents readable when introducing a new backend; migrate the files deliberately rather than silently changing their locations.

**Why:** The user explicitly chose the database as interim storage because App Storage was not configured.

**How to apply:** Store confidential file bytes in the database until the private Amazon bucket is provided. Preserve authorization, size limits, and atomic file/metadata writes; do not substitute public storage.

An installed App Storage SDK does not establish that a storage bucket has been provisioned for this workspace. Check resource configuration before replacing an upload backend to address a missing-storage error.

**Why:** The SDK was installed while the workspace had neither a usable default bucket nor a configured private upload directory; switching SDKs alone could not resolve uploads.

**How to apply:** When object storage is introduced, verify the bucket exists and is linked to the app, configure its private directory, then test upload and authorized download. Do not substitute public storage or an ephemeral local directory.
