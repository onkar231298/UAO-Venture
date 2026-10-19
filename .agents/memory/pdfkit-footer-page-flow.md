---
name: PDFKit footer page flow
description: Avoid accidental extra pages when adding positioned footers to buffered PDFs.
---

In PDFKit, an explicit text position below the page's content limit can still trigger automatic page creation, even when drawing on a buffered page. `bufferedPageRange()` may then describe fewer pages than the final PDF, and footer text can land on extra pages. Keep footer text above `page.height - margin.bottom`, or consistently set a smaller bottom margin on the document and every page added later.

**Why:** A footer positioned past the configured bottom margin produced blank pages and mismatched page counts in generated quotations.

**How to apply:** After PDF layout changes, generate a sample with multiple pages, compare `pdfinfo` page count with the rendered footer count, and inspect the final page.
