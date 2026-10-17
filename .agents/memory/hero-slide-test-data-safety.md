---
name: Hero slide test data safety
description: Keep managed-carousel checks from changing public production CMS content.
---

Hero slider tests must use isolated fixtures or staging data; never create, update, or delete live CMS slides to test rendering or controls.

**Why:** Live hero content is public production data, and test runs must not publish fixtures or alter the visitor carousel.

**How to apply:** Mock `/api/hero-slides` in an isolated browser or use an explicitly isolated staging source when checking managed-slide order, layout, or navigation.
