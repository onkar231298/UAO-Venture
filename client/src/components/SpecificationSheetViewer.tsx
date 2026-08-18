import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";

// Presentational attributes old Word/Excel exports rely on. Most are already in
// DOMPurify's default allow-list; ADD_ATTR makes the intent explicit and future-proof.
const SPEC_EXTRA_ATTRS = [
  "align", "valign", "bgcolor", "background", "border", "cellpadding", "cellspacing",
  "color", "colspan", "rowspan", "face", "size", "width", "height", "nowrap",
];

// Inside the shadow root there is no <html>/<body>/:root, so stylesheet rules that
// target the document root (very common in Word/Excel exports: "body { font... }",
// "html body td { ... }") would silently match nothing. Re-target them to :host.
const ROOT_SELECTOR_RE = /^\s*(?:html\s+body|html|body|:root)(?![\w-])/i;

function rewriteRootSelector(selector: string): string {
  return selector.replace(ROOT_SELECTOR_RE, ":host");
}

function rewriteSheetRules(rules: CSSRuleList): string {
  let out = "";
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      try {
        rule.selectorText = rule.selectorText.split(",").map(rewriteRootSelector).join(", ");
      } catch {
        // selector rewrite is best-effort; keep the original rule
      }
      out += rule.cssText + "\n";
    } else if (rule instanceof CSSGroupingRule) {
      // @media / @supports — rewrite the nested rules, keep the wrapper prelude
      const inner = rewriteSheetRules(rule.cssRules);
      const head = rule.cssText.slice(0, rule.cssText.indexOf("{"));
      out += `${head}{\n${inner}}\n`;
    } else {
      out += rule.cssText + "\n";
    }
  }
  return out;
}

function remapDocumentRootCss(css: string): string {
  try {
    // Use the browser's own CSS parser instead of regexing the whole stylesheet
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    return rewriteSheetRules(sheet.cssRules);
  } catch {
    // Older browsers without constructable stylesheets: best-effort text fallback
    return css.replace(/(^|[{},]\s*)(?:html\s+body|html|body|:root)(?![\w-])/gi, "$1:host");
  }
}

/**
 * Sanitize pasted specification HTML while KEEPING its styling.
 *
 * Spec sheets are usually copied as full HTML documents whose CSS lives in
 * <head><style>. DOMPurify's default pass returns body content only, which is
 * why specs used to render as plain unstyled HTML. We pull every <style> block
 * out first, re-attach it in front of the body markup, then sanitize — scripts,
 * event handlers and other dangerous content are still stripped.
 */
export function sanitizeSpecHtml(raw: string): string {
  let css = "";
  let bodyHtml = raw;
  try {
    const doc = new DOMParser().parseFromString(raw, "text/html");
    const styleTags = Array.from(doc.querySelectorAll("style"));
    css = styleTags.map((s) => s.textContent || "").join("\n");
    styleTags.forEach((s) => s.remove());
    bodyHtml = doc.body ? doc.body.innerHTML : raw;
  } catch {
    // DOMParser should never throw, but if it does fall back to the raw string
  }
  css = remapDocumentRootCss(css);
  const merged = (css.trim() ? `<style>${css}</style>` : "") + bodyHtml;
  return DOMPurify.sanitize(merged, { ADD_TAGS: ["style"], ADD_ATTR: SPEC_EXTRA_ATTRS });
}

/**
 * Renders a sanitized spec sheet inside a shadow root so the pasted CSS applies
 * exactly as copied WITHOUT leaking out: pasted documents often carry global rules
 * like `* { margin: 0 }` or `td { border: ... }` that would otherwise restyle the
 * surrounding page — and the site's own CSS can't flatten the spec's colours either.
 */
export function SpecificationSheetViewer({
  html,
  className,
  testId,
}: {
  html: string;
  className?: string;
  testId?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    root.innerHTML =
      "<style>:host{display:block;overflow-x:auto}</style>" + sanitizeSpecHtml(html);
  }, [html]);

  return <div ref={hostRef} className={className} data-testid={testId ?? "spec-sheet-viewer"} />;
}
