---
name: S3 bucket uploads
description: Security rules for uploads to the public AWS images bucket — never trust multipart metadata, force Content-Type server-side.
---

# S3 bucket uploads (public bucket)

The images bucket (`AWS_S3_BUCKET_NAME`) is **public-read on every prefix** (verified empirically) and does not allow ACLs. Anything uploaded is world-readable by URL.

**Rules for any upload surface targeting it:**
- Never trust multipart `file.mimetype` or `originalname` — both are attacker-controlled.
- Validate the actual bytes (magic numbers) against a closed extension allowlist before anything reaches S3; buffer in memory rather than streaming so rejects never get stored.
- Set the stored Content-Type server-side from the allowlist — never client-provided, never sniffed.
- Never allow SVG/HTML: public bucket + active content = hosted XSS.
- Object keys must include a UUID (`Date.now()` alone collides within a millisecond → S3 silently overwrites, swapping one user's file for another's).

**Why:** multer-s3's `AUTO_CONTENT_TYPE` has an explicit SVG-content regex and will label sniffed SVG bytes `image/svg+xml` even when the file is named `.pdf` — so streaming uploads with sniffed types can publicly host active content. A completion review rejected exactly this.

**How to apply:** reuse the quality-attachments pattern in `server/s3Upload.ts` (memory multer + byte validator + manual PutObject). Browser-direct presigned PUT is additionally unverified for bucket CORS — proxy through the server.
