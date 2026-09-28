---
name: Neon pool maintenance errors
description: Prevent PostgreSQL maintenance disconnects from crashing the app process.
---

Attach a pool-level `error` listener to the Neon PostgreSQL pool and log only a safe message and error code, not the whole error object or connection configuration.

**Why:** A managed PostgreSQL restart can terminate an idle pooled connection with SQLSTATE `57P01`. Without a pool listener, the emitted error can become an uncaught EventEmitter error and stop the Node process.

**How to apply:** When using `@neondatabase/serverless` Pool, handle idle-client errors at the pool boundary so later queries can acquire a fresh connection. Keep per-request query errors handled at their call sites as well.