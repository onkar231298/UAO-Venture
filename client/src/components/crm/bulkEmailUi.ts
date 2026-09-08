export function bulkEmailErrorMessage(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : String(error || "");
  const jsonStart = raw.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const problem = JSON.parse(raw.slice(jsonStart));
      if (typeof problem.detail === "string" && problem.detail.trim()) return problem.detail;
      if (typeof problem.message === "string" && problem.message.trim()) return problem.message;
    } catch {
      // Fall through to a plain, non-JSON message.
    }
  }
  const plain = raw.replace(/^\d{3}:\s*/, "").trim();
  return plain && !plain.startsWith("{") ? plain : fallback;
}