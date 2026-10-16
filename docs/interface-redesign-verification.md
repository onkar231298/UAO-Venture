# All-user interface preservation

## Scope and evidence

The approved workspace redesign is scoped to signed-in workspaces. The public storefront,
authentication mechanisms, permissions and server endpoints are not redesigned.

Before visual changes, `scripts/check-interface-options.cjs --record` recorded
5,018 semantic controls across 173 client source files in
`interface-options-baseline.json`. Each item records its original file, location,
element, literal label and action/field attributes. The checker matches the same
semantic controls in the same module after the redesign, allowing wrapper,
layout, styling and line-number changes. Duplicate controls are counted
separately. It fails on a missing control or a changed handler/field attribute.
Never regenerate the baseline to silence failures.

This is a static preservation check, not a claim that all possible business
states were exercised in a browser. Conditional controls remain conditional on
the same existing state and role logic. The browser smoke checks complement,
rather than replace, the source inventory.

## Role/navigation mapping

| Roles | Existing workspace and preserved destinations |
|---|---|
| Super Admin | Admin overview; Inventory; Sales and all its submenus (Customer Inquiries, Sample Requests, High Volume Bids, Quote Negotiations, Sales Orders, Lead Management, Company Management, Duplicate Review); Purchase; Logistics; Accounts; Website; Newsletter; Blog; Users; HR; Quality; Sales Activity Logs; Security & Activity; Analytics; Document Upload; System Settings; website and logout |
| Admin | Same authorized Admin destinations, excluding the existing Super Admin-only Document Upload |
| Sales Manager, Sales Executive | Overview; My Leads; My Companies; Follow-ups; My Sales & Quotations; Sample Requests; Internal Chat; My Activity Log; Quality Requests; My Attendance; Email Settings; logout |
| Purchase Manager / Executive | Staff dashboard, Purchase Management, Internal Chat, My Attendance, Profile Settings, logout; Analytics only for manager |
| Inventory Manager / Executive | Staff dashboard, Inventory Management, Internal Chat, My Attendance, Profile Settings, logout; Analytics only for manager |
| Logistics Manager / Executive | Staff dashboard, Logistics Management, Internal Chat, My Attendance, Profile Settings, logout; Analytics only for manager |
| Accounts Manager / Executive | Staff dashboard, Accounts & Finance, Internal Chat, My Attendance, Profile Settings, logout; Analytics only for manager |
| SEO Manager / Website Manager | Staff dashboard, Website Management, Internal Chat, My Attendance, Profile Settings, logout; Analytics only for SEO Manager |
| Quality Manager / Executive | Staff dashboard and existing assigned module access; Quality dashboard, Sample Requests, Document Requests, Testing Records, Test Reports, Batch Management, Material Vendors, Customer Vendor Approvals, NCRs, Website Management, My Attendance, Profile Settings, logout |
| Customer | Dashboard, Sample Requests, Browse Products, Search, My Inquiries, Saved Products, Quotations, Downloads, Catalogs, My Profile, website, Settings, logout; existing high-volume bid route and workflow |

Admin modules retain their existing nested forms and submodules, including
website management, HR employee dialogs, inventory, purchasing, logistics,
accounts, security, bulk actions and exports. These are inventoried at control
level in the baseline, not replaced by dashboard summary cards.

## Before → after mapping

* Original role-specific sidebar actions → compact desktop rail and complete
  labelled All destinations dialog, with original permission conditions.
* Original desktop pages and handlers → same pages and handlers inside the
  scoped theme; no module replaced by a mockup.
* Original dialogs, form fields, tabs, filters, sorting, pagination, context
  actions, uploads, exports and bulk actions → same control signatures in the
  inventory; theme and layout apply in place.
* Original customer destinations → same customer sidebar, plus responsive drawer
  and compact mobile navigation.
* Standalone customer products/search/profile, chat and mailbox settings → same
  components with themed workspace navigation.
* Duplicate global search/Create shortcuts → removed; original page search,
  filters and create actions remain in their existing workflows.
* Existing account utilities → desktop bottom utility dock and full destinations
  menu; mobile has one navigation dock rather than stacked utility bars.
* Company pages → original records/actions plus an authenticated company/people
  side desk. Every returned contact remains separate, including blank-email and
  non-primary contacts. Context switches validate company ownership and share the
  existing contacts query cache. The desk does not generate extra company-access
  events merely by rendering.
* Departmental `/staff` landing → exact route alias to the existing guarded
  StaffDashboard. The pre-existing `/staff/*` route remains registered.

## Verification commands

```sh
node scripts/check-interface-options.cjs
TEST_APP_ORIGIN="https://$REPLIT_DEV_DOMAIN" node scripts/verifyPortalRedesign.cjs --isolated
TEST_APP_ORIGIN="https://$REPLIT_DEV_DOMAIN" node scripts/verifyCompanyRestoreUI.cjs --admin-writes
TEST_APP_ORIGIN="https://$REPLIT_DEV_DOMAIN" node scripts/verifyCompanyRestoreUI.cjs --writes
TEST_APP_ORIGIN="https://$REPLIT_DEV_DOMAIN" node scripts/verifyCompanyRestoreUI.cjs
./node_modules/.bin/tsx scripts/test-api-request.ts
```

The role smoke test signs in with an isolated temporary user, checks navigation
for all 16 staff roles plus customer, checks the Super Admin-only item, visits
customer sections, captures representative desktop/mobile screens, and removes
its test data. It does not send mail, place orders, change real company data or
write to production.

The company tests create their own temporary company/contact records, exercise
the actual Admin/Sales edit dialogs and contact creation, check persisted data
directly in the development database, and remove only those temporary records.
The read-only company test opens existing multi-contact companies and validates
the company export response.

## Existing limitations, not removed options

* Several departmental module and profile sections already display “coming
  soon” placeholders. They remain reachable; this design task does not implement
  missing departmental business workflows.
* The customer's existing Settings button has no action handler. It is preserved
  rather than silently removed or assigned an invented workflow.
* The legacy server exact route `/admin/dashboard` has a special-session
  redirect. New workspace shortcuts use `/admin?section=...`; CRM deep routes
  `/admin/dashboard/crm/...` remain in use.
* The repository has pre-existing TypeScript diagnostic debt. A production bundle
  or syntax-only transpile is not evidence of a clean full semantic type check.
* Customer login currently returns customer data without establishing the staff
  session expected by the existing customer sample-request read endpoint.
  Customer sample-request fetches returned 401 in the browser checks. Navigation
  and styling were verified, but that business flow was not marked passed.
  Authentication changes are explicitly outside this redesign.

## Recorded results

| Check | Result |
|---|---|
| Original semantic controls | 5,018 recorded; 5,018 matched; 0 missing |
| Staff-role navigation | All 16 roles checked with real temporary staff sign-in; no browser runtime exceptions |
| Customer navigation | Customer login, dashboard and seven existing sections rendered; no browser runtime exceptions |
| Theme persistence | Admin, Sales, departmental and Customer light/dark switching survived reload |
| Mobile navigation | Admin, Sales, departmental, Quality and Customer dock capped at five destinations; original navigation in More; dialog focus and Escape checked |
| Tablet layout | Five portal families checked at 820×1180; no document-level horizontal overflow; compact headers wrap their controls instead of clipping them |
| Search and Create | Duplicate header controls absent; original company search retained; existing Admin/Sales company forms exercised |
| Sales Today panel | Existing real-data follow-up panel opened and closed with Escape |
| Admin and Sales company edits | Actual forms saved; company fields, email and phone checked directly in development PostgreSQL |
| Contacts | Three temporary blank-email/non-primary contacts persisted; both request signatures and actual Sales contact form checked; separate contact-name search returned the owning company |
| Existing multi-contact companies | Three companies opened with 15, 14 and 11 visible contacts; side-desk IDs/counts matched their owning company directly against PostgreSQL |
| Company export | HTTP 200, XLSX MIME type, 4,837,059 bytes |
| Build | `npm run build` passed; existing large-bundle warning remains |
| Test cleanup | No temporary portal-check users remained |
| Public site | No workspace-theme leakage; homepage visually checked |

The option inventory is exhaustive at source-control level. Browser checks are
representative workflow checks, not a claim that every conditional record state,
destructive action, upload, download or populated business scenario was exercised.
