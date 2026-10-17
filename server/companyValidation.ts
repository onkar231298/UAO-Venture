import { getTableColumns } from "drizzle-orm";
import { companies } from "../shared/schema";

// Keep checks aligned with the database schema, including non-form API callers.
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
