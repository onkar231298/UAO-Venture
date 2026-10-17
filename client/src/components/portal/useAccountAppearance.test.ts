import assert from "node:assert/strict";
import test from "node:test";
import {
  appearanceForAccount,
  appearanceStorageKey,
  normalizeAppearance,
  readAppearance,
} from "./useAccountAppearance";

function storage(values: Record<string, string> = {}): Pick<Storage, "getItem"> {
  return { getItem: (key) => values[key] ?? null };
}

test("browser preferences remain isolated when the signed-in account changes", () => {
  const local = storage({
    [appearanceStorageKey("staff:one")]: JSON.stringify({ mode: "dark", palette: "ocean-teal" }),
    [appearanceStorageKey("staff:two")]: JSON.stringify({ mode: "light", palette: "plum-gold" }),
  });
  const first = readAppearance("staff:one", local).preference;
  const second = readAppearance("staff:two", local).preference;

  assert.deepEqual(first, { mode: "dark", palette: "ocean-teal" });
  assert.deepEqual(second, { mode: "light", palette: "plum-gold" });
  assert.deepEqual(
    appearanceForAccount({ account: "staff:one", preference: first }, "staff:two", second),
    second,
  );
});

test("legacy browser mode is eligible for migration and unsupported values fall back to the whitelist", () => {
  const legacy = readAppearance("staff:one", storage({ "bfo-portal-theme": "dark" }));
  assert.deepEqual(legacy.preference, { mode: "dark", palette: "navy-amber" });
  assert.equal(legacy.hasAccountChoice, true);

  assert.deepEqual(normalizeAppearance({ mode: "system", palette: "rainbow" }), {
    mode: "light",
    palette: "navy-amber",
  });
});
