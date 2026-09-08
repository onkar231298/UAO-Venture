import { z, type ZodError } from "zod";

const nullToEmptyString = (value: unknown) => value == null ? "" : value;

export const bulkEmailConfigurationSchema = z.object({
  audienceId: z.preprocess(
    nullToEmptyString,
    z.string().trim().min(1, "Choose an audience."),
  ),
  fromEmail: z.preprocess(
    nullToEmptyString,
    z.string().trim()
      .min(1, "Enter a sender email address.")
      .email("Enter a valid sender email address."),
  ),
  fromName: z.preprocess(
    nullToEmptyString,
    z.string().trim()
      .min(1, "Enter a sender display name.")
      .max(100, "Sender display name must be 100 characters or fewer."),
  ),
  enableAll: z.boolean().optional().default(false),
});

export function configurationFieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

export interface SharedConfigurationRow {
  audienceId: string | null;
  fromEmail: string | null;
  fromName: string | null;
}

function consensus(
  rows: SharedConfigurationRow[],
  field: keyof SharedConfigurationRow,
  normalize: (value: string) => string = (value) => value,
): string | null {
  if (rows.length === 0) return null;
  const values = rows.map((row) => row[field] === null ? null : normalize(row[field]));
  const first = values[0];
  return values.every((value) => value === first) ? first : null;
}

/**
 * Builds an editable draft without choosing a winner for any conflicting field.
 * Each field is considered independently so common legacy values remain visible.
 */
export function sharedConfigurationDraft(rows: SharedConfigurationRow[]): {
  audienceId: string | null;
  fromEmail: string | null;
  fromName: string | null;
} {
  return {
    audienceId: consensus(rows, "audienceId"),
    fromEmail: consensus(rows, "fromEmail", (value) => value.trim().toLowerCase()),
    fromName: consensus(rows, "fromName"),
  };
}