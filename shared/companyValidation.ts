import { getTableColumns } from "drizzle-orm";
import { companies } from "./schema";

// PostgreSQL varchar limits count Unicode code points, not UTF-16 code units.
export function companyLengthErrors(data: Record<string, unknown>) {
  const errors: { field: string; maxLength: number; message: string }[] = [];
  for (const [field, column] of Object.entries(getTableColumns(companies))) {
    const maxLength = "length" in column ? column.length : undefined;
    const value = data[field];
    if (typeof maxLength !== "number" || typeof value !== "string") continue;
    if (Array.from(value).length > maxLength) {
      const label = field.replace(/([A-Z])/g, " $1").toLowerCase();
      errors.push({ field, maxLength, message: `${label} must be ${maxLength} characters or fewer.` });
    }
  }
  return errors;
}
