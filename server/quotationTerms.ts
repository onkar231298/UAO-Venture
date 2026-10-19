import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const sourceFileName = "Pasted-CRM-DEVELOPMENT-PROMPT-SALES-QUOTATION-TERMS-CONDITIONS_1792384283401.txt";

export function getProposedQuotationTermsText(): string {
  const candidates = [
    path.resolve(process.cwd(), "attached_assets", sourceFileName),
    path.resolve(process.cwd(), "dist", sourceFileName),
  ];
  const sourcePath = candidates.find(existsSync);
  if (!sourcePath) {
    throw new Error("The supplied quotation terms source is not available.");
  }

  const source = readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");
  const startMarker = "These General Terms & Conditions (“Terms”) govern";
  const start = source.indexOf(startMarker);
  const end = source.indexOf("\n\nATLAS INGREDIENTS PRIVATE LIMITED", start);
  if (start < 0 || end < 0) {
    throw new Error("The supplied quotation terms could not be extracted.");
  }

  const termsText = source.slice(start, end).trim();
  if (termsText.length < 10000 || termsText.length > 50000) {
    throw new Error("The supplied quotation terms have an unexpected length.");
  }
  return termsText;
}
