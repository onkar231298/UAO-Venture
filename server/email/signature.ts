import sanitizeHtml from "sanitize-html";

export const MAX_SIGNATURE_HTML_LENGTH = 30_000;
export const CRM_SIGNATURE_MARKER = 'data-crm-signature="true"';
const CRM_SIGNATURE_WRAPPER_PATTERN = /<div\b[^>]*\bdata-crm-signature=(["'])true\1[^>]*>/i;

const SAFE_CSS_VALUE = /^(?!.*(?:url\s*\(|expression\s*\(|javascript|@import|behavior\s*:|-moz-binding))[a-z0-9\s#(),.%+\-/"']+$/i;

const ALLOWED_STYLE_PROPERTIES = [
  "background-color",
  "border",
  "border-bottom",
  "border-collapse",
  "border-left",
  "border-right",
  "border-spacing",
  "border-top",
  "color",
  "display",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "height",
  "letter-spacing",
  "line-height",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-width",
  "padding",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "text-align",
  "text-decoration",
  "vertical-align",
  "white-space",
  "width",
] as const;

const allowedStyles = Object.fromEntries(
  ALLOWED_STYLE_PROPERTIES.map(property => [property, [SAFE_CSS_VALUE]]),
);

export function sanitizeSignatureHtml(value: string): string {
  if (value.length > MAX_SIGNATURE_HTML_LENGTH) {
    throw new Error(`Signature HTML must be ${MAX_SIGNATURE_HTML_LENGTH.toLocaleString()} characters or fewer.`);
  }

  return sanitizeHtml(value, {
    allowedTags: [
      "a",
      "b",
      "blockquote",
      "br",
      "div",
      "em",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hr",
      "i",
      "img",
      "li",
      "ol",
      "p",
      "span",
      "strong",
      "table",
      "tbody",
      "td",
      "tfoot",
      "th",
      "thead",
      "tr",
      "u",
      "ul",
    ],
    allowedAttributes: {
      "*": ["align", "height", "style", "title", "valign", "width"],
      a: ["href", "rel", "target", "title", "style"],
      img: ["alt", "height", "src", "style", "title", "width"],
      table: ["border", "cellpadding", "cellspacing", "role", "style", "width"],
      td: ["colspan", "rowspan", "style", "valign", "width"],
      th: ["colspan", "rowspan", "scope", "style", "valign", "width"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    allowedStyles: {
      "*": allowedStyles,
    },
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
    transformTags: {
      a: (_tagName, attributes) => ({
        tagName: "a",
        attribs: {
          ...attributes,
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    },
  }).trim();
}

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&([a-z]+);/gi, (entity, name: string) => namedEntities[name.toLowerCase()] ?? entity)
    .replace(/&#(\d+);/g, (_entity, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_entity, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

export function signatureHtmlToText(value: string): string {
  const withLineBreaks = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n• ")
    .replace(/<\/(?:blockquote|div|h[1-6]|li|ol|p|table|tr|ul)>/gi, "\n");
  const textOnly = sanitizeHtml(withLineBreaks, { allowedTags: [], allowedAttributes: {} });
  return decodeHtmlEntities(textOnly)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function hasSupportedSignatureContent(value: string): boolean {
  return signatureHtmlToText(value).length > 0 || /<(?:hr|img)\b/i.test(value);
}

function hasAppendedSignature(bodyHtml: string): boolean {
  return CRM_SIGNATURE_WRAPPER_PATTERN.test(bodyHtml);
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character] || character,
  );
}

export function appendHtmlSignature(
  bodyHtml: string,
  bodyText: string,
  signatureHtml: string,
): { html: string; text: string } {
  if (hasAppendedSignature(bodyHtml)) {
    return { html: bodyHtml, text: bodyText };
  }

  const sanitizedSignature = sanitizeSignatureHtml(signatureHtml);
  if (!hasSupportedSignatureContent(sanitizedSignature)) {
    return { html: bodyHtml, text: bodyText };
  }

  const signatureText = signatureHtmlToText(sanitizedSignature);
  return {
    html: `${bodyHtml}<div ${CRM_SIGNATURE_MARKER} style="margin-top:24px">${sanitizedSignature}</div>`,
    text: signatureText ? `${bodyText.trimEnd()}\n\n--\n${signatureText}` : bodyText,
  };
}

export function appendLegacyImageSignature(
  bodyHtml: string,
  bodyText: string,
  imageUrl: string,
  displayName?: string | null,
): { html: string; text: string } {
  if (hasAppendedSignature(bodyHtml)) {
    return { html: bodyHtml, text: bodyText };
  }

  const safeDisplayName = (displayName || "Signature").replace(/[\r\n]+/g, " ").trim() || "Signature";
  return {
    html: `${bodyHtml}<div ${CRM_SIGNATURE_MARKER} style="margin-top:24px"><img src="${escapeHtmlAttribute(imageUrl)}" alt="${escapeHtmlAttribute(safeDisplayName)}" style="max-width:600px;display:block;" /></div>`,
    text: `${bodyText.trimEnd()}\n\n--\n${safeDisplayName}`,
  };
}
