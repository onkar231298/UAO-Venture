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

Converting an assigned product inquiry or its quotation must likewise keep the inquiry's assigned sales representative as the lead owner; do not silently assign the lead to the admin or manager who clicks Convert.

**Why:** the user expects a converted inquiry already assigned to a rep to appear in that rep's My Leads, and a real converted inquiry was being owned by the converting admin instead.

**How to apply:** use the inquiry assignee for direct inquiry and accepted-quotation conversions, with the actor as fallback only when the inquiry has no assignee.

Quotations created from an inquiry remain linked to that inquiry after it is converted, but must also appear in the linked CRM lead's Quotes tab for authorized staff.

**Why:** the user expects the assigned sales representative to download an already-generated quotation from the lead record, even when the quotation was originally created against its inquiry.

**How to apply:** when listing quotations for a lead, include direct lead quotations and quotations from inquiries whose `crmLeadId` points to that lead. Keep inquiry-linked quotes scoped to the inquiry assignee and direct lead quotes scoped to the assigned lead representative.

When a lead is assigned or reassigned to a sales representative, assign its linked company to that same representative so it appears in My Companies.

**Why:** the user expects the company behind an assigned lead to appear in that representative's company workspace automatically.

**How to apply:** synchronize company ownership on inquiry/quotation lead conversion, manual lead creation, and lead reassignment. Keep lead and company reassignment atomic so the UI cannot report success while the company remains unassigned.
