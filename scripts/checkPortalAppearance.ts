import assert from "node:assert/strict";
import { PORTAL_PALETTES, portalPaletteTokens } from "../client/src/components/portal/portalPalettes";
import { appearanceStorageKey, readAppearance } from "../client/src/components/portal/useAccountAppearance";

const values = new Map<string, string>();
const storage = { getItem: (key: string) => values.get(key) ?? null };
const first = "staff:appearance-test-first", second = "staff:appearance-test-second";
assert.equal(readAppearance(first, storage).preference.palette, "navy-amber");
values.set(appearanceStorageKey(first), JSON.stringify({ palette: "ocean-teal", mode: "dark" }));
assert.deepEqual(readAppearance(first, storage).preference, { palette: "ocean-teal", mode: "dark" });
assert.deepEqual(readAppearance(second, storage).preference, { palette: "navy-amber", mode: "light" });
values.set(appearanceStorageKey(second), JSON.stringify({ palette: "forest-sage", mode: "light" }));
assert.equal(readAppearance(first, storage).preference.palette, "ocean-teal");
values.set(appearanceStorageKey(second), "bad JSON");
assert.equal(readAppearance(second, storage).preference.palette, "navy-amber");
values.set(appearanceStorageKey(second), JSON.stringify({ palette: "unknown", mode: "unknown" }));
assert.deepEqual(readAppearance(second, storage).preference, { palette: "navy-amber", mode: "light" });
assert.equal(readAppearance(first, { getItem() { throw Error("storage blocked"); } }).storageAvailable, false);
assert.equal(readAppearance(null, storage).storageAvailable, false);

function luminance(hex: string) {
  const rgb = hex.replace("#", "").match(/../g)!.map(v => {
    const n = parseInt(v, 16) / 255;
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}
function contrast(first: string, second: string) {
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
for (const palette of PORTAL_PALETTES) for (const mode of ["light", "dark"] as const) {
  const surface = palette[mode];
  const tokens = portalPaletteTokens(palette.id, mode);
  assert.equal(tokens["--bfo-bg"], surface.bg);
  assert.equal(tokens["--bfo-sidebar"], palette.sidebar);
  assert.equal(tokens["--primary"], palette.action);
  for (const background of [surface.bg, surface.panel, surface.raised, surface.input]) {
    assert(contrast(surface.text, background) >= 4.5, `${palette.id}/${mode} body text`);
    assert(contrast(surface.muted, background) >= 4.5, `${palette.id}/${mode} muted text`);
  }
  assert(contrast("#FFFFFF", palette.action) >= 4.5, `${palette.id} action text`);
  assert(contrast(tokens["--bfo-sidebar-text"], palette.sidebar) >= 4.5, `${palette.id} sidebar text`);
  assert(contrast(tokens["--bfo-sidebar-accent"], palette.sidebar) >= 4.5, `${palette.id} sidebar emphasis`);
}
console.log("PASS: account isolation, reload preferences, invalid/blocked storage and base text/action contrast in all 8 palette/mode combinations.");
