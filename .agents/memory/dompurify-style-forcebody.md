---
name: DOMPurify FORCE_BODY for style tags
description: DOMPurify silently deletes a leading <style> element unless FORCE_BODY:true, even with ADD_TAGS:["style"]
---

**Rule:** Any DOMPurify.sanitize() call that must preserve `<style>` elements needs BOTH `ADD_TAGS: ["style"]` AND `FORCE_BODY: true`.

**Why:** DOMPurify's internal parser hoists leading `<style>` (head-eligible) elements into `<head>`, and sanitize() returns only body content — so the entire stylesheet vanishes silently with no error, even though "style" is in the allowed tags. Cost a multi-round debugging session on the product spec-sheet viewer: pasted HTML+CSS specs rendered as plain unstyled HTML and every code-read of the pipeline looked correct.

**How to apply:** Anywhere pasted/stored full HTML documents (with embedded CSS) are sanitized for styled rendering. Empirical browser-level test that proved it: a throwaway public HTML page importing the real module via `/src/...tsx` (needs the react-refresh preamble snippet, and must live in `client/public/` — vite middleware mode doesn't serve root-level HTML, the SPA catch-all swallows it). That harness pattern is worth reusing for "works in code-review, broken in browser" client bugs.
