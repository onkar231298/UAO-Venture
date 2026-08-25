const EMAIL_ADDRESS_PATTERN = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

export function normalizeEmailAddress(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const email = value.trim();
  if (!email || email.length > 254 || !EMAIL_ADDRESS_PATTERN.test(email)) return undefined;
  const [local, domain] = email.split("@");
  if (!local || local.length > 64 || !domain || domain.length > 253) return undefined;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return undefined;
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return undefined;
  return `${local}@${domain.toLowerCase()}`;
}