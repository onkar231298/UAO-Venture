---
name: Inquiry and lead ownership
description: Role-based ownership and visibility for enquiries, company-converted leads, and related quotations.
---

Admins and super admins can see and manage all product enquiries. Sales users can see and manage only enquiries assigned to their user account. An enquiry assignment is made to an active sales representative, and the assigned enquiry appears in that representative's CRM view. Quotes linked to an enquiry follow the same access scope.

**Why:** The user explicitly requested that admins see all enquiries while sales representatives see only their assigned enquiries.

**How to apply:** Enforce these boundaries in server-side list, detail, update, publish, and PDF routes, not only by hiding client-side controls. Keep the existing lead-assignment workflow available.

Assigned sales representatives must also have the same enquiry and quotation actions as admins from their own “My Assigned Inquiries” view, including recording acceptance and creating an order from an accepted quote. Reassignment remains admin-only.

**Why:** The user explicitly asked that assigned representatives be able to use the same options in their own enquiry section.

**How to apply:** Reuse the established inquiry actions where practical, while keeping every write and document route scoped to the assigned representative; admins retain all-enquiry access.

The super-admin Sales Management workspace must expose inquiry assignment and eligible draft-quotation deletion directly; do not rely only on the sales-only My Sales & Quotations page. If there are no active sales representatives, explain that and link to User Management rather than leaving a disabled empty selector.

**Why:** the user reported that both controls were still missing from the super-admin view, and the development database may have no active sales accounts to populate the selector.

**How to apply:** verify actions from the super-admin's actual Sales Management route, and confirm at least one active sales representative exists before expecting assignment choices.

When a company assigned to a sales representative is converted to a lead, keep that representative as the lead owner and make the new lead appear in their My Leads view without a manual reload. An admin converting the company must not become the lead owner merely because they performed the conversion.

**Why:** the user explicitly asked that company-converted leads appear in the assigned sales representative's My Leads section.

**How to apply:** preserve the company assignee on lead creation, refresh the rep's cached lead views after conversion, and keep server-side lead queries scoped to the assigned representative.
