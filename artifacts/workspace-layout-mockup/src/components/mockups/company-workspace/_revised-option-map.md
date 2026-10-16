# Revised workspace — option map

This mockup reorganizes the extracted company-management workspace into a compact Cape NatureX dark upper bar, narrow destination rail, central records surface and a separate company/contact information desk. At phone widths the rail becomes a short mobile destination bar; the company desk follows the records rather than replacing them. Every record and contact shown is fictional design-preview content.

## Navigation and shell

- Brand, workspace path, notifications, user identity and theme switch live in the deep-navy upper bar. There is intentionally no duplicate Find Companies/Contacts control and no second Create control next to the theme switch.
- Four frequent destinations (Dashboard, Sales Management, Company Management, Analytics & Reports) live on the slim left rail. “All destinations” opens the complete navigation list. It contains all extracted navigation destinations: Dashboard; Inventory Management; Sales Management; Customer Inquiries; Sample Requests; High Volume Bids; Quote Negotiations; Sales Orders; Lead Management; Company Management; Duplicate Review; Purchase Management; Logistics Management; Accounts & Finance; Website Management; Newsletter; Blog Management; User Management; HR Management; Quality Management; Sales Activity Logs; Security & Activity; Analytics & Reports; Document Upload; System Settings; Back to Website; Log out. The bottom dock contains the existing utility destinations System Settings, Back to Website and Log out; those utilities are no longer duplicated as individual rail buttons. On phones the dock is hidden and a single bottom navigation (Home, Companies, More) opens the complete destination index. No production routing or permission model is changed.
- Role context remains a presentation-level signed-in Amara Shah illustration only. The mockup does not assert or alter permissions.

## Company workspace controls

- The central header contains the single company action set: List/Kanban, Refresh, Download All, Clean Up Countries, Filters, Bulk Upload and Add Company. Add opens an accessible preview form; submitting gives truthful preview-only feedback and does not create a record.
- Lifecycle tabs retain All, New, Contacted, Qualified, Active Customer, Inactive and Churned.
- Search is a single central search field and matches company name, company email, city and fictional associated contact names/roles/emails.
- Main filters retain Origin (All Origins, Website, Manual, Imported), Industry (All Industries, Food & Beverage, Pharmaceuticals, Cosmetics & Personal Care, Nutraceuticals, Other) and Country (All Countries plus represented countries).
- Expanded Filters retains Priority (All Priorities, Hot, Warm, Cold), Status (All Statuses, Active, Inactive, Pending, Merged (Duplicates)), Assigned To (All Assignments, Unassigned, Amara Shah, Noah Bennett, Maya Chen), From Date, To Date and Clear dates.
- Record modes retain List and Kanban. List columns retain selection, company and email, origin, lifecycle, priority, location, date added, assigned owner and actions. Not Relevant view retains company, reason, flagged-by/date, assigned representative and Restore via the shared information desk/context. Active Companies and Not Relevant are separate view toggles.
- Row actions retain View; assignment to each of the three sales representatives (with current owner indicated); Mark as Not Relevant / Mark as Relevant; Delete Company. On Not Relevant records, Restore appears in the action cell. The selected company’s complete company and contacts context stays visible at right.
- Bulk selection retains Assign to all representatives, Bulk Email, Request Quality, Delete Selected and Clear. Bulk assignment is local mockup state; email, quality and delete give explicit preview-only feedback/confirmation.
- Pagination retains Companies per page: 10, 25, 50, 100, All; First, Previous, Next, Last; and a current page/range summary.
- Preview-only actions with dialogs/notices include Notifications, Back to Website, Log out, Refresh, Download All, Clean Up Countries, Bulk Upload, Add Company, View, Email, Bulk Email, Request Quality and delete. No network, persistent storage or real messages are involved.

## People desk and accessibility

- Every contact is rendered as an individual person in the company’s right-hand details panel, including people with no email or phone and non-primary contacts. The company’s primary inbox is separately shown as company data.
- Navigation dialogs and action dialogs are keyboard-dismissible with Escape, trap Tab/Shift+Tab focus while open, and restore focus to the trigger on close; modal backdrops close on outside click. All interactive controls have a visible focus indicator. Buttons, view toggles, filters, row selection, pagination, menus, mobile navigation and theme are keyboard-operable native controls with labels/expanded or selected state where applicable. Feedback is exposed as a live status region.
- Table text is raised to 12px and company names to 12px; detail labels and values are 11px, contact names 12px. Long email and address values wrap in the separate desk without widening the overall workspace.
