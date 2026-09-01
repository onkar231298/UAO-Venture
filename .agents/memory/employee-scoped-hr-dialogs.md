---
name: Employee-scoped HR dialogs
description: Prevent one employee's cached HR data from appearing in another employee's edit dialog.
---

Employee-scoped HR dialogs must clear the previous form before switching selections and only hydrate when the response belongs to the currently selected employee. Mutation responses must be parsed before updating the exact employee query cache, and salary details should refetch whenever the dialog opens.

**Why:** The shared query client treats cached data as fresh indefinitely, and a delayed or stale employee response can repopulate a newly selected employee's form with the previous employee's values. Returning an unparsed HTTP response also prevents cache updates from using the server-confirmed record.

**How to apply:** For any HR dialog reused across employees, include the employee ID in the query key, reset visible state on selection, compare the payload's employee ID before applying it, parse mutation JSON, and update or invalidate that employee's exact cache key.