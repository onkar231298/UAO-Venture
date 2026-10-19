---
name: Inquiry ownership and quote access
description: Role-based ownership rules for product enquiries and their quotations.
---

Admins and super admins can see and manage all product enquiries. Sales users can see and manage only enquiries assigned to their user account. An enquiry assignment is made to an active sales representative, and the assigned enquiry appears in that representative's CRM view. Quotes linked to an enquiry follow the same access scope.

**Why:** The user explicitly requested that admins see all enquiries while sales representatives see only their assigned enquiries.

**How to apply:** Enforce these boundaries in server-side list, detail, update, publish, and PDF routes, not only by hiding client-side controls. Keep the existing lead-assignment workflow available.
