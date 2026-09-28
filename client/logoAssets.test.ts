import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const approvedLogoSha256 = "95fbbefe1ed260824a5d1a41556f9e7e9db0baef0f31c5998a1dee282a3553fe";
const canonicalLogoUrl = "/cape-naturex-logo.png";

const logoPages = [
  ["Header", "./src/components/Header.tsx"],
  ["Presentation", "./src/pages/Presentation.tsx"],
  ["Packaging solutions", "./src/pages/PackagingSolutions.tsx"],
] as const;

test("header, presentation, and packaging use the Cape NatureX logo URL", async () => {
  for (const [pageName, relativePath] of logoPages) {
    const source = await readFile(new URL(relativePath, import.meta.url), "utf8");

    assert.match(
      source,
      /src\s*=\s*["']\/cape-naturex-logo\.png["']/,
      `${pageName} should use ${canonicalLogoUrl}`,
    );
    assert.doesNotMatch(
      source,
      /(?:\/bfi-logo\.png|bright\s*fame)/i,
      `${pageName} must not use the retired Bright Fame logo`,
    );
  }
});

test("canonical and compatibility logo URLs resolve to the approved artwork", async () => {
  const canonicalLogo = await readFile(new URL("./public/cape-naturex-logo.png", import.meta.url));
  const compatibilityLogo = await readFile(new URL("./public/bfi-logo.png", import.meta.url));
  const canonicalSha256 = createHash("sha256").update(canonicalLogo).digest("hex");

  assert.equal(canonicalSha256, approvedLogoSha256, "canonical logo artwork changed");
  assert.deepEqual(
    compatibilityLogo,
    canonicalLogo,
    "the /bfi-logo.png compatibility URL must serve the canonical artwork",
  );
});