---
name: Attendance photo upload (edge 403)
description: Why attendance punch-in/out uploads photos directly to object storage instead of base64-in-JSON
---

# Attendance photo upload — avoid base64 in request body

Punch-in / punch-out (`/api/hr/attendance/punch-in|punch-out`) must NOT carry the
photo as base64 inside the JSON body. In production this caused intermittent,
device-dependent `403 Forbidden` (a generic `<title>403</title>` HTML page, not our
JSON errors) — the POST never reached Express. Large/binary-ish JSON bodies get
rejected at the deployment edge/WAF before the app sees them. Body-parser limit
(50mb) and client-side image downscaling did NOT fix it.

**Fix / pattern:** client requests a presigned PUT URL
(`POST /api/hr/attendance/photo-upload-url`, returns `{uploadURL, photoPath}`),
uploads the image bytes straight to object storage, then sends only the small
`photoPath` string to punch-in/out. Server keeps base64 as a backward-compat
fallback for old cached clients.

**Why this works:** the heavy/binary payload bypasses the app request path
entirely, so the edge has nothing to reject.

**Integrity guard:** server must never trust a client-supplied `photoPath`.
`resolveAttendancePhotoPath()` enforces it starts with
`{PRIVATE_OBJECT_DIR}/attendance/{userId}/`, matches strict regex
`punch_{in|out}_{YYYY-MM-DD}_{ts}.jpg`, AND that the object actually `exists()` in
storage — otherwise a client could "punch" with a fabricated, never-uploaded path.
The `/{userId}/` segment in the path is load-bearing: the photo-serving route
ownership check (`/api/hr/attendance/photo/...`) keys off it.
