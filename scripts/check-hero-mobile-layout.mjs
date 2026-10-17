import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(
  new URL("../client/src/components/SimpleHeroSlider.tsx", import.meta.url),
  "utf8",
);

const stressCases = [
  {
    source: "built-in",
    title: "Organic Ingredients for Your Next Product",
    primary: "Discuss Your Requirements",
    secondary: "Explore Products",
  },
  {
    source: "CMS",
    title: "Premium Organic Ingredients for Your Next Food, Wellness, and Manufacturing Product",
    primary: "Discuss Your Ingredient Specifications and Delivery Requirements",
    secondary: "Explore Our Complete Product Range",
  },
];

test("long built-in and CMS copy stays covered by wrapping styles", () => {
  for (const copy of stressCases) {
    assert.ok(copy.title.length > 35, `${copy.source} title should exercise a long heading`);
    assert.ok(copy.primary.length > 20, `${copy.source} primary label should exercise wrapping`);
    assert.ok(copy.secondary.length > 15, `${copy.source} secondary label should exercise wrapping`);
  }

  assert.match(component, /<h1 className="[^"]*break-words/);
  assert.match(component, /<h2 className="[^"]*break-words/);
  assert.match(component, /<p className="[^"]*break-words/);
  assert.match(component, /whitespace-normal break-words/);
});

test("320px and 375px widths keep actions stacked and able to grow for wrapped labels", () => {
  assert.match(component, /flex min-w-0 flex-col gap-3 min-\[420px\]:flex-row/);
  assert.equal((component.match(/h-auto min-h-12 w-full max-w-full/g) || []).length, 2);
  assert.equal((component.match(/min-\[420px\]:w-fit/g) || []).length, 2);
});

test("carousel controls remain reachable without widening the page", () => {
  assert.match(component, /flex max-w-full items-center gap-2 overflow-x-auto/);
  assert.match(component, /grid h-8 w-8 shrink-0 place-items-center/);
  assert.match(component, /flex h-8 w-8 shrink-0 items-center justify-center/);
});
