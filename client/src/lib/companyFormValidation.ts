import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { ApiRequestError } from "./queryClient";

// Set errors only: never reset values or close the dialog after a rejection.
export function applyCompanyServerErrors<T extends FieldValues>(
  error: Error,
  form: Pick<UseFormReturn<T>, "getValues" | "setError">,
) {
  if (!(error instanceof ApiRequestError)) return;
  const body = error.responseBody;
  if (!body || typeof body !== "object" || !("errors" in body) || !Array.isArray(body.errors)) return;
  const values = form.getValues();
  let focus = true;
  for (const item of body.errors) {
    if (!item || typeof item.field !== "string" || typeof item.message !== "string") continue;
    if (!Object.prototype.hasOwnProperty.call(values, item.field)) continue;
    form.setError(item.field as Path<T>, { type: "server", message: item.message }, { shouldFocus: focus });
    focus = false;
  }
}
