import OpenAI from "openai";
import sanitizeHtml from "sanitize-html";

// AI Email Generation Service
// Generates professional, HTML-formatted marketing emails from a prompt.
// Product image URLs found in the prompt (or passed explicitly) are embedded
// into the layout with proper email-safe styling.

async function callOpenAI(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 4000,
  });
  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned an empty response.");
  return raw;
}

async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const models = ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-2.0-flash"];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userMessage }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
              maxOutputTokens: 8000,
            },
          }),
        }
      );
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Gemini API error ${resp.status}: ${errText.slice(0, 200)}`);
      }
      const data = await resp.json();
      const raw = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
      if (!raw) throw new Error("Gemini returned an empty response.");
      return raw;
    } catch (e: any) {
      lastError = e;
      // Try the next model only on model-not-found errors
      if (!/404|not found|NOT_FOUND/i.test(e.message || "")) throw e;
    }
  }
  throw lastError || new Error("Gemini generation failed.");
}

// Strip markdown code fences some models wrap around JSON output
function stripCodeFences(raw: string): string {
  return raw.trim().replace(/^```(?:json|html)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

// Extract http(s) image/product URLs from free text
export function extractImageUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>()]+/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches.map((u) => u.replace(/[.,;!?]+$/, ""))));
}

const SYSTEM_PROMPT = `You are an expert email designer and B2B email marketing copywriter. Produce a complete, production-ready HTML email.

Design rules (critical — this is for real email clients like Gmail/Outlook):
- Table-based layout, max 600px wide, centered, inline CSS only. No <style> blocks, no classes, no external CSS, no script tags, no JavaScript.
- Professional design with clean typography (system fonts: Arial, Helvetica, sans-serif), generous whitespace, a clear header, body sections, a prominent CTA button, and a simple footer.
- Brand accent color: #16a34a (green). Use it for the header accent, the CTA button background (white text, padding 12px 28px, border-radius 6px), and links.
- Body text 14-15px, line-height 1.6, color #333333.
- Structure: a header, a greeting, short engaging paragraphs, optionally a bulleted list of benefits, a clear call-to-action, a polite sign-off, and a simple footer.
- Use the personalization variables {{contact_name}}, {{company_name}}, and {{email}} where appropriate (e.g., "Dear {{contact_name}},").
- Do NOT invent or placeholder image URLs — they render as broken icons. Only use the exact image URLs provided by the user.
- If product image URLs are provided, embed EACH one with an <img> tag: style="max-width:100%; width:100%; max-width:480px; height:auto; display:block; margin:16px auto; border-radius:8px;" and a descriptive alt attribute. Place images at natural points in the email (e.g., after the paragraph introducing that product). Never skip a provided image URL.
- Do NOT include <html>, <head>, or <body> tags — only the inner body content.
- Keep the tone professional, warm, and persuasive. No spammy language.

If the user provides existing HTML to revise, keep its overall intent and any provided image URLs, and apply the requested changes — do not start from scratch.

Return JSON with exactly these keys:
{
  "subject": "compelling subject line (max 80 chars)",
  "html": "complete email body HTML"
}
Return ONLY valid JSON. No markdown fences, no commentary.`;

export async function generateEmailWithAI(params: {
  prompt: string;
  imageUrls?: string[];
  subject?: string;
  currentHtml?: string;
}): Promise<{ subject: string; html: string }> {
  if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error("No AI provider is configured. Add OPENAI_API_KEY or GEMINI_API_KEY in Secrets to use Generate with AI.");
  }

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
  if (params.subject) {
    userMessage += `\n\nThe user wants this subject line (use it, polishing only if a small improvement is clearly better): "${params.subject}"`;
  }
  if (params.currentHtml && params.currentHtml.trim()) {
    userMessage += `\n\nHere is the current HTML to revise (apply the brief as edits to this content instead of starting from scratch):\n${params.currentHtml}`;
  }

  // Try OpenAI first; fall back to Gemini if OpenAI is unavailable
  // (missing key, quota exceeded, auth error, etc.)
  let raw: string;
  if (process.env.OPENAI_API_KEY) {
    try {
      raw = await callOpenAI(SYSTEM_PROMPT, userMessage);
    } catch (openaiError: any) {
      if (process.env.GEMINI_API_KEY) {
        console.warn("[AI Email] OpenAI failed, falling back to Gemini:", openaiError?.message?.slice(0, 150));
        raw = await callGemini(SYSTEM_PROMPT, userMessage);
      } else {
        throw openaiError;
      }
    }
  } else {
    raw = await callGemini(SYSTEM_PROMPT, userMessage);
  }

  let parsed: { subject?: string; html?: string };
  try {
    parsed = JSON.parse(stripCodeFences(raw));
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
