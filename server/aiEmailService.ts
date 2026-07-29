import sanitizeHtml from "sanitize-html";

// Email Generation Service
// Formats a plain-text brief into a professional, email-safe HTML email with
// product images embedded. Works fully internally (no external AI required).
// If an OPENAI_API_KEY is configured, it automatically upgrades to full AI
// writing; otherwise it uses the built-in smart formatter.

// Extract http(s) URLs from free text
export function extractImageUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>()]+/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches.map((u) => u.replace(/[.,;!?]+$/, ""))));
}

function isLikelyImageUrl(u: string): boolean {
  return (
    /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(u) ||
    /image|img|photo|product|cdn|amazonaws|cloudfront|storage\.googleapis/i.test(u)
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Restore personalization variables that escaping doesn't touch anyway,
// and linkify plain URLs left in text.
function formatInline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(
    /(https?:\/\/[^\s&]+(?:&amp;[^\s&]+)*)/gi,
    (m) => `<a href="${m.replace(/&amp;/g, "&")}" target="_blank" rel="noopener" style="color:#1a73e8; text-decoration:underline;">${m}</a>`
  );
  return out;
}

const IMG_STYLE =
  "max-width:100%; width:100%; max-width:480px; height:auto; display:block; margin:16px auto; border-radius:8px; border:1px solid #eeeeee;";

function imageBlock(url: string): string {
  return `<img src="${escapeHtml(url)}" alt="Product image" style="${IMG_STYLE}" />`;
}

// PropDocx-style benefits panel: white card, green left border, green checkmarks
function checkmarkPanel(items: string[]): string {
  const rows = items
    .map((item) => {
      // Bold the lead-in phrase before a colon, if present
      const colonIdx = item.indexOf(":");
      const content =
        colonIdx > 0 && colonIdx < 60
          ? `<strong style="color:#1b3a1f;">${formatInline(item.slice(0, colonIdx + 1))}</strong> ${formatInline(item.slice(colonIdx + 1).trim())}`
          : formatInline(item);
      return `<tr>
        <td valign="top" style="width:26px; padding:7px 0; color:#2e7d32; font-size:15px; font-weight:bold;">&#10004;</td>
        <td style="padding:7px 0; color:#3d4a3e; font-size:14px; line-height:1.6;">${content}</td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0; background-color:#ffffff; border:1px solid #e0e8e0; border-left:4px solid #2e7d32; border-radius:8px;">
    <tr><td style="padding:16px 22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    </td></tr>
  </table>`;
}

/**
 * Internal smart formatter: turns a free-text brief into a clean,
 * professional HTML email. Rules:
 * - First non-empty line that looks like a subject ("subject: ...") is used as subject;
 *   otherwise a subject is derived from the first sentence.
 * - Lines starting with -, *, or • become bullet lists.
 * - Blank lines split paragraphs.
 * - Image URLs (from prompt or explicit list) are embedded at the end of the
 *   paragraph where they appeared, or after the first paragraph if passed separately.
 * - Adds greeting with {{contact_name}} if the text doesn't already have one.
 */
function generateInternally(params: {
  prompt: string;
  imageUrls?: string[];
  currentSubject?: string;
}): { subject: string; html: string } {
  const promptUrls = extractImageUrls(params.prompt).filter(isLikelyImageUrl);
  const explicitImages = (params.imageUrls || []).filter((u) => /^https?:\/\//i.test(u));
  const allImages = Array.from(new Set([...explicitImages, ...promptUrls]));

  // Remove image URLs from the prompt text so they don't show as raw links
  let text = params.prompt;
  for (const u of promptUrls) {
    text = text.split(u).join(" ");
  }

  const rawLines = text.split(/\r?\n/);
  let subject = params.currentSubject?.trim() || "";
  const lines: string[] = [];
  for (const line of rawLines) {
    const m = line.match(/^\s*subject\s*[:\-]\s*(.+)$/i);
    if (m && !subject) {
      subject = m[1].trim();
    } else {
      lines.push(line);
    }
  }

  const cleaned = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  if (!subject) {
    // Derive from the first sentence that is NOT a greeting line
    const sentences = cleaned.split(/(?<=[.!?])\s+|\n/).map((s) => s.trim()).filter(Boolean);
    const candidate = sentences.find(
      (s) => !/^(dear|hi|hello|greetings|good\s(morning|afternoon|evening))\b/i.test(s) && s.length > 12
    );
    subject = (candidate || "Premium Organic Spices & Herbs from Bright Organic")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 78);
    if (subject.length === 78) subject = subject.replace(/\s+\S*$/, "") + "…";
  }

  const hasGreeting = /^(dear|hi|hello|greetings|good\s(morning|afternoon|evening))\b/i.test(cleaned);

  // Build content blocks (paragraphs + bullet lists)
  const blocks: string[] = [];
  const paragraphs = cleaned.split(/\n\s*\n/);
  for (const para of paragraphs) {
    const paraLines = para.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (paraLines.length === 0) continue;

    const bulletLines = paraLines.filter((l) => /^[-*•]\s+/.test(l));
    if (bulletLines.length > 0) {
      // Leading text (if any) then a styled checkmark panel
      const textPart = paraLines.filter((l) => !/^[-*•]\s+/.test(l)).join(" ");
      if (textPart) {
        blocks.push(`<p style="margin:16px 0; color:#3d4a3e; font-size:15px; line-height:1.7;">${formatInline(textPart)}</p>`);
      }
      blocks.push(checkmarkPanel(bulletLines.map((l) => l.replace(/^[-*•]\s+/, ""))));
    } else {
      blocks.push(
        `<p style="margin:16px 0; color:#3d4a3e; font-size:15px; line-height:1.7;">${formatInline(paraLines.join(" "))}</p>`
      );
    }
  }

  // Insert images: first image after the first paragraph, the rest spread
  // between remaining blocks (or appended at the end).
  const contentParts: string[] = [];
  let imgIdx = 0;
  blocks.forEach((block, i) => {
    contentParts.push(block);
    if (imgIdx < allImages.length && (i === 0 || i === Math.floor(blocks.length / 2))) {
      contentParts.push(imageBlock(allImages[imgIdx++]));
    }
  });
  while (imgIdx < allImages.length) {
    contentParts.push(imageBlock(allImages[imgIdx++]));
  }

  const greeting = hasGreeting
    ? ""
    : `<p style="margin:0 0 16px 0; color:#3d4a3e; font-size:15px; line-height:1.7;">Dear Purchaser,</p>`;

  // Headline for the green banner: prefer subject-like text, else first sentence
  let headline = subject && !/^dear\b/i.test(subject) ? subject : "";
  if (!headline) {
    headline = "Premium Organic Spices & Herbs for Your Business";
  }

  const html = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2ee; padding:32px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #dfe7df; font-family:Arial, Helvetica, sans-serif;">
        <tr>
          <td align="center" style="padding:26px 32px 18px 32px; background-color:#ffffff;">
            <div style="font-size:24px; font-weight:bold; color:#1b5e20; letter-spacing:2px;">BRIGHT ORGANIC</div>
            <div style="font-size:11px; color:#c9a227; letter-spacing:3px; margin-top:6px; text-transform:uppercase;">Premium Organic Spices &amp; Herbs</div>
          </td>
        </tr>
        <tr>
          <td align="center" style="background:linear-gradient(135deg,#1b5e20,#2e7d32); background-color:#2e7d32; padding:30px 36px;">
            <div style="font-size:24px; line-height:1.35; font-weight:bold; color:#ffffff;">${formatInline(headline)}</div>
          </td>
        </tr>
        <tr>
          <td style="height:4px; line-height:4px; font-size:0; background-color:#c9a227;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:30px 36px 8px 36px;">
            ${greeting}
            ${contentParts.join("\n            ")}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:8px 36px 6px 36px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#2e7d32; border-radius:8px;">
                  <a href="mailto:info@bfiorganic.com" style="display:inline-block; padding:14px 40px; color:#ffffff; font-size:15px; font-weight:bold; text-decoration:none;">&#9993;&nbsp; Get in Touch Today</a>
                </td>
              </tr>
            </table>
            <p style="margin:12px 0 0 0; color:#8a978b; font-size:12px;">Free Samples Available &bull; Fast Response &bull; Export Quality Assured</p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 36px 26px 36px;">
            <p style="margin:14px 0 4px 0; color:#3d4a3e; font-size:15px; line-height:1.7;">Warm regards,</p>
            <p style="margin:0; color:#1b3a1f; font-size:15px; line-height:1.7; font-weight:bold;">The Bright Organic Team</p>
            <p style="margin:2px 0 0 0; color:#8a978b; font-size:13px;">Premium Organic Spices &amp; Herbs Supplier</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="background-color:#f5f8f5; padding:20px 32px; border-top:1px solid #e5ece5;">
            <p style="margin:0 0 6px 0; color:#2e7d32; font-size:13px; font-weight:bold; letter-spacing:1px;">BRIGHT ORGANIC</p>
            <p style="margin:0 0 6px 0; color:#6b7a6c; font-size:12px;">100% Certified Organic &bull; Farm to Table &bull; Export Quality</p>
            <p style="margin:0; color:#9aa79b; font-size:11px;">You are receiving this email as a valued business contact of Bright Organic. If you'd prefer not to receive these emails, simply reply and let us know.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();

  return { subject, html };
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "table", "thead", "tbody", "tfoot", "tr", "td", "th",
    "div", "span", "p", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s",
    "ul", "ol", "li", "blockquote",
    "a", "img", "center",
  ],
  allowedAttributes: {
    "*": ["style", "align", "valign", "width", "height", "border", "cellpadding", "cellspacing", "bgcolor", "colspan", "rowspan", "role"],
    a: ["href", "target", "rel", "style"],
    img: ["src", "alt", "width", "height", "style"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
};

function buildAiUserMessage(params: {
  prompt: string;
  imageUrls?: string[];
  currentSubject?: string;
}): { userMessage: string } {
  const promptUrls = extractImageUrls(params.prompt).filter(isLikelyImageUrl);
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
  return { userMessage };
}

const AI_SYSTEM_PROMPT = `You are an elite B2B email marketing copywriter and premium HTML email designer, producing agency-quality newsletter designs like those from Mailchimp's best templates.

OUTPUT FORMAT (critical — follow exactly):
Line 1: SUBJECT: <compelling subject line, max 80 chars>
Then from line 2 onward: the complete email body HTML, raw, with NO markdown fences, NO JSON, NO commentary. Just the subject line followed by the HTML.

BRAND: The sender is Bright Organic / BFI Organic — a premium organic spices & herbs supplier. Brand palette:
- Primary green: #2e7d32, dark green: #1b5e20, light green tint: #e8f5e9
- Accent gold: #c9a227, warm cream: #fdfbf5
- Text: headings #1b3a1f, body #3d4a3e, muted #6b7a6c

DESIGN SPEC (mandatory — the email must look richly designed, never plain):
1. Outer wrapper: full-width table with background-color:#eef2ee and padding 32px 0.
2. Main card: centered 600px table, background #ffffff, border-radius:12px, overflow:hidden, box-shadow via border: 1px solid #dfe7df.
3. HEADER BANNER (always include): a full-width <td> with background:linear-gradient(135deg,#1b5e20,#2e7d32) AND fallback background-color:#2e7d32, padding 28px 32px. Inside: company name "Bright Organic" in #ffffff, 22px, bold, letter-spacing:1px, plus a small tagline line in #c8e6c9, 12px, uppercase, letter-spacing:2px (e.g. "PREMIUM ORGANIC SPICES & HERBS").
4. A thin 4px accent bar <td> with background-color:#c9a227 directly under the header.
5. HERO SECTION: padding 32px; a large headline (22-26px, bold, color #1b3a1f) capturing the email's core message, then greeting "Dear Purchaser,".
6. Body paragraphs: 15px, line-height 1.7, color #3d4a3e, margin 0 0 16px.
7. FEATURE/BENEFIT BLOCK: present key points as a styled table with background:#e8f5e9, border-left:4px solid #2e7d32, border-radius:8px, padding 20px 24px. Each point on its own row with a green "✔" or "•" in #2e7d32 bold, followed by benefit text (bold lead-in phrase, then normal text).
8. IMAGES: if product image URLs are provided, embed EACH one inside its own centered <td> with padding 8px 32px, using <img> with style="${IMG_STYLE}" plus border:1px solid #e0e0e0, and a caption line under it (12px, italic, color #6b7a6c) naming the product. Never skip a provided image URL. If two+ images, you may place two side by side in a 2-column table (each width 48%).
9. CTA: a centered bulletproof button — table with <td style="background-color:#2e7d32;border-radius:8px"> containing an <a> with color:#ffffff, font-weight:bold, padding:14px 36px, display:inline-block, text-decoration:none. Use mailto: or a relevant link only if one was provided; otherwise link mailto:info@bfiorganic.com. Below the button add a subtle reassurance line (12px, muted).
10. DIVIDERS: use <td> with border-top:1px solid #e5ece5 between major sections.
11. SIGN-OFF: warm closing, then "Warm regards," + sender block (bold name/company, muted title line).
12. FOOTER (always include): background-color:#f5f8f5, padding 20px 32px, centered, 12px, color #6b7a6c: company name, a line like "100% Certified Organic • Farm to Table • Export Quality", and a small note "You are receiving this email as a valued business contact of Bright Organic."

TECHNICAL RULES (critical — real email clients like Gmail/Outlook):
- Only email-safe HTML: nested tables for ALL layout, inline CSS on every element. No <style> blocks, classes, external CSS, or JavaScript. Use role="presentation" cellpadding="0" cellspacing="0" on layout tables.
- Font stack: Georgia, 'Times New Roman', serif for the big headline is allowed; everything else Arial, Helvetica, sans-serif.
- Do NOT use any personalization placeholders like {{contact_name}} or {{company_name}}. Address the reader as "Dear Purchaser," and refer to their company generically (e.g. "your business"). Sign off as "The Bright Organic Team".
- Do NOT include <html>, <head>, or <body> tags — only inner body content.
- Do NOT invent image URLs; only use exact URLs provided.
- Copy: professional, warm, persuasive, specific to the brief. No spammy language.

Remember: first line "SUBJECT: ...", then raw HTML. Nothing else.`;

function parseAiJson(raw: string): { subject: string; html: string } {
  // Strip accidental markdown fences
  let cleaned = raw.trim()
    .replace(/^```(?:json|html)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  // Preferred format: "SUBJECT: ..." on the first line, HTML after
  const subjectMatch = cleaned.match(/^\s*SUBJECT\s*:\s*(.+?)\s*$/im);
  if (subjectMatch) {
    const html = cleaned
      .slice(cleaned.indexOf(subjectMatch[0]) + subjectMatch[0].length)
      .trim();
    if (html.includes("<")) {
      return { subject: subjectMatch[1].trim(), html };
    }
  }

  // Legacy/fallback: JSON object { subject, html }
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    try {
      const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
      if (parsed.subject && parsed.html) {
        return { subject: String(parsed.subject), html: String(parsed.html) };
      }
    } catch {
      // fall through
    }
  }

  // Last resort: response is raw HTML without a subject line
  if (cleaned.includes("<table") || cleaned.includes("<div")) {
    return { subject: "", html: cleaned };
  }

  throw new Error("AI response missing subject or body.");
}

async function generateWithGemini(params: {
  prompt: string;
  imageUrls?: string[];
  currentSubject?: string;
}): Promise<{ subject: string; html: string }> {
  const { userMessage } = buildAiUserMessage(params);

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY as string,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: AI_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 16384,
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data: any = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Gemini returned an empty response.");
  return parseAiJson(raw);
}

async function generateWithOpenAI(params: {
  prompt: string;
  imageUrls?: string[];
  currentSubject?: string;
}): Promise<{ subject: string; html: string }> {
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const { userMessage } = buildAiUserMessage(params);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: AI_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.6,
    max_tokens: 8000,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("AI returned an empty response.");
  return parseAiJson(raw);
}

export async function generateEmailWithAI(params: {
  prompt: string;
  imageUrls?: string[];
  currentSubject?: string;
}): Promise<{ subject: string; html: string }> {
  let result: { subject: string; html: string };

  // Per user preference: ChatGPT (OpenAI) is the primary generator, with the
  // built-in designer as fallback. Set AI_EMAIL_PROVIDER=gemini or =internal to override.
  const provider = (process.env.AI_EMAIL_PROVIDER || (process.env.OPENAI_API_KEY ? "openai" : "internal")).toLowerCase();

  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    try {
      result = await generateWithGemini(params);
    } catch (err) {
      console.error("[AI Email] Gemini attempt 1 failed, retrying once:", err);
      try {
        result = await generateWithGemini(params);
      } catch (err2) {
        console.error("[AI Email] Gemini generation failed, falling back to internal formatter:", err2);
        result = generateInternally(params);
      }
    }
    if (!result.subject) {
      result.subject = params.currentSubject || "A message from Bright Organic";
    }
  } else if (provider === "openai" && process.env.OPENAI_API_KEY) {
    try {
      result = await generateWithOpenAI(params);
    } catch (err) {
      console.error("[AI Email] OpenAI generation failed, falling back to internal formatter:", err);
      result = generateInternally(params);
    }
  } else {
    result = generateInternally(params);
  }

  const safeHtml = sanitizeHtml(result.html, SANITIZE_OPTIONS);
  const safeSubject = result.subject.replace(/<[^>]*>/g, "").slice(0, 200);

  return { subject: safeSubject, html: safeHtml };
}
