# Current company workspace extraction

`Current.tsx` extracts the rendered admin shell/sidebar/header structure from `client/src/pages/AdminDashboard.tsx` and the company workspace's toolbar, filters, stage tabs, metrics, selection actions, table, pagination, and row menu structure from `client/src/pages/crm/CompanyManagement.tsx`. JSX class names and the source markup patterns for the shell and list workspace are retained; the two source components' large surrounding application workflows are not copied.

Boundaries:
- Authentication, role lookup, router changes, notifications, remote queries, mutations, timers, exports, upload processing, email delivery, and database access are not included. Local static records are fictional and controls operate only on preview state.
- Add, bulk upload, download, country cleanup, delete, email, view details, quality request, and other workflow entry points show an explicit preview-only dialog/message rather than performing the real operation.
- The source provides stage, origin, industry, priority, status, assignment, and date filters; all enumerated options are represented. The preview also includes the source pagination choices and per-row/bulk actions.
- The list is the initial view. The source JSX exposes the list/kanban switch; the preview gives the kanban control a local stage-column display using the same fictional records (a local preview behavior, not an extracted source kanban workflow).
- Portal-theme tokens and the relevant portal repaint rules were copied from `client/src/styles/portal-theme.css` into `_group.css`, with selectors confined to `.bfo-portal-root`. This does not import or edit main-app code or sandbox-global styles.
- Sidebar links, topbar tools, actions and dialogs are preview-only and do not navigate, call APIs, mutate persistent data, or connect to a live database.
