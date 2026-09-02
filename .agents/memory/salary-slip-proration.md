---
name: Salary slip proration
description: Payroll rules for an employee's first month and historical salary-slip rendering.
---

An employee's first salary month starts on the configured joining date. Paid days include attendance, paid leave, weekends, and holidays only from that date onward, and first-month pay always uses the month's actual calendar-day divisor.

**Why:** Applying full-month weekends or a fixed 26/30-day divisor before employment begins overstates paid days or understates first-month salary. Recalculating PDFs from current salary settings can also change historical payroll records after later edits.

**How to apply:** Keep later-month fixed/actual divisor choices unchanged, cap deductions so net pay cannot be negative, and render downloaded slips from their stored salary snapshot rather than mutable current configuration.