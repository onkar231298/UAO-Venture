---
name: Browser CDP keyboard tests
description: Send keyboard input through Chrome DevTools Protocol when testing real button activation.
---

For keyboard activation of a focused button through the existing Chromium CDP harness, dispatch `rawKeyDown`, the matching `char` event for Enter/Space, then `keyUp`. Sending only `keyDown` and `keyUp` can leave focus in place without activating the button.

**Why:** The carousel accessibility check initially appeared to prove the controls were keyboard reachable, but Chromium did not trigger native activation until the full key event sequence was used.

**How to apply:** Use this sequence in browser tests that interact through `Input.dispatchKeyEvent`; still verify the resulting UI state, not only the focused element.
