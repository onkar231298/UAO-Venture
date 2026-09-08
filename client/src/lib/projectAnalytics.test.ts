import test from "node:test";
import assert from "node:assert/strict";
import { trackProjectEvent } from "./projectAnalytics";

test("analytics is safe without a browser or tracker and on tracker failures", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  try {
    Reflect.deleteProperty(globalThis, "window");
    assert.doesNotThrow(() => trackProjectEvent("customer_registered"));
    Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
    assert.doesNotThrow(() => trackProjectEvent("customer_registered"));
    const calls: unknown[] = [];
    window.umami = { track: (name, data) => { calls.push({ name, data }); } };
    trackProjectEvent("inquiry_submitted", { form: "product" });
    assert.deepEqual(calls, [{ name: "inquiry_submitted", data: { form: "product" } }]);
    window.umami = { track: () => { throw new Error("tracker failed"); } };
    assert.doesNotThrow(() => trackProjectEvent("customer_registered"));
    window.umami = { track: () => Promise.reject(new Error("network failed")) };
    trackProjectEvent("customer_registered");
    await new Promise(resolve => setTimeout(resolve, 0));
  } finally {
    Reflect.deleteProperty(globalThis, "window");
    if (original) Object.defineProperty(globalThis, "window", original);
  }
});