import OpenAI from "openai";
import sanitizeHtml from "sanitize-html";

// AI Email Generation Service
// Generates professional, HTML-formatted marketing emails from a prompt.
// Product image URLs found in the prompt (or passed explicitly) are embedded
// into the layout with proper email-safe styling.

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Add it in Secrets to use Write with AI.");
  }
  return new OpenAI({ apiKey });
}

// Extract http(s) image/product URLs from free text
export function extractImageUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>()]+/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches.map((u) => u.replace(/[.,;!?]+$/, ""))));
}

const SYSTEM_PROMPT = `You are an expert B2B email marketing copywriter and HTML email designer.

Generate a professional marketing email as JSON with exactly these keys:
{
  "subject": "compelling subject line (max 80 chars)",
  "html": "complete email body HTML"
}

HTML rules (critical — this is for real email clients like Gmail/Outlook):
- Use only email-safe HTML: tables for layout, inline CSS styles on every element. No <style> blocks, no classes, no external CSS, no JavaScript.
- Wrap everything in a single centered container table, max-width 600px, with a clean white background, subtle border-radius, and generous padding.
- Use a professional font stack: Arial, Helvetica, sans-serif. Body text 14-15px, line-height 1.6, color #333333.
- Structure: a header/greeting, short engaging paragraphs, optionally a bulleted list of benefits, a clear call-to-action, and a polite sign-off.
- If product image URLs are provided, embed EACH one with an <img> tag: style="max-width:100%; width:100%; max-width:480px; height:auto; display:block; margin:16px auto; border-radius:8px;" and a descriptive alt attribute. Place images at natural points in the email (e.g., after the paragraph introducing that product). Never skip a provided image URL.
- Use the personalization variables {{contact_name}} and {{company_name}} where natural (e.g., "Dear {{contact_name}},").
- Do NOT include <html>, <head>, or <body> tags — only the inner body content.
- Do NOT invent image URLs. Only use the exact image URLs provided.
- Keep the tone professional, warm, and persuasive. No spammy language.

Return ONLY valid JSON. No markdown fences, no commentary.`;

export async function generateEmailWithAI(params: {
  prompt: string;
  imageUrls?: string[];
  currentSubject?: string;
}): Promise<{ subject: string; html: string }> {
  const openai = getClient();

  // Merge explicit image URLs with any pasted directly into the prompt
  const promptUrls = extractImageUrls(params.prompt).filter((u) =>
    /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(u) || /image|img|photo|product|cdn|amazonaws|cloudfront/i.test(u)
  );
  const allImages = Array.from(new Set([...(params.imageUrls || []), ...promptUrls]));

  let userMessage = `Write a professional marketing email based on this brief:\n\n${params.prompt}`;
  if (allImages.length > 0) {
    userMessage += `\n\nProduct image URLs to embed in the email (embed every one of them):\n${allImages
      .map((u, i) => `${i + 1}. ${u}`)
      .join("\n")}`;
  }
  if (params.currentSubject) {
    userMessage += `\n\nThe user already has this subject line (improve it only if clearly better): "${params.currentSubject}"`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 4000,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("AI returned an empty response. Please try again.");
  }

  let parsed: { subject?: string; html?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid output. Please try again.");
  }

  if (!parsed.subject || !parsed.html) {
    throw new Error("AI response was missing the subject or email body. Please try again.");
  }

  // Sanitize the generated HTML: allow email-safe tags/attributes only,
  // strip scripts, event handlers, and javascript: URLs.
  const safeHtml = sanitizeHtml(parsed.html, {
    allowedTags: [
      "table", "thead", "tbody", "tfoot", "tr", "td", "th",
      "div", "span", "p", "br", "hr",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "b", "em", "i", "u", "s",
      "ul", "ol", "li", "blockquote",
      "a", "img", "center",
    ],
    allowedAttributes: {
      "*": ["style", "align", "valign", "width", "height", "border", "cellpadding", "cellspacing", "bgcolor", "colspan", "rowspan"],
      a: ["href", "target", "rel", "style"],
      img: ["src", "alt", "width", "height", "style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    // Keep {{variables}} intact — sanitize-html leaves plain text alone.
  });

  const safeSubject = String(parsed.subject).replace(/<[^>]*>/g, "").slice(0, 200);

  return { subject: safeSubject, html: safeHtml };
}
