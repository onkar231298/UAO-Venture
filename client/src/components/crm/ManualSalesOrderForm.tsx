import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { calculateSalesOrderTotals, manualSalesOrderSchema, type ManualSalesOrder } from "../../../../shared/salesOrderContract";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type DraftParty = { name: string; address: string; contactName: string; email: string; phone: string };
type DraftItem = {
  productName: string;
  hsnCode: string;
  totalBags: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  batchNumber: string;
};
type ManualSalesOrderDraft = {
  contractNumber: string;
  contractDate: string;
  proformaNumber: string;
  proformaDate: string;
  seller: { name: string; address: string; phone: string; email: string; website: string; gstNumber: string; iecNumber: string };
  buyer: DraftParty;
  consignee: DraftParty;
  notifyParty: DraftParty;
  currency: string;
  items: DraftItem[];
  packingDetails: string;
  paymentTerms: string;
  lcType: string;
  leadTime: string;
  priceTerms: string;
  portOfLoading: string;
  portOfDischarge: string;
  finalDestination: string;
  destinationCountry: string;
  bank: { name: string; branch: string; accountName: string; accountNumber: string; ifsc: string; swift: string; address: string };
  authorisedSignatory: string;
  signatoryDesignation: string;
  additionalTerms: string;
  internalNotes: string;
  expectedDeliveryDate: string;
  advancePercent: string;
  creditDays: string;
  discountPercent: string;
  taxPercent: string;
};

interface Props {
  open: boolean;
  quotationNumber: string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (order: ManualSalesOrder) => void;
}

const blankParty = (): DraftParty => ({ name: "", address: "", contactName: "", email: "", phone: "" });
const blankItem = (): DraftItem => ({
  productName: "",
  hsnCode: "",
  totalBags: "",
  quantity: "",
  unit: "",
  unitPrice: "",
  batchNumber: "",
});
const initialDraft = (): ManualSalesOrderDraft => ({
  contractNumber: "",
  contractDate: "",
  proformaNumber: "",
  proformaDate: "",
  seller: { name: "Atlas Ingredients", address: "", phone: "", email: "", website: "", gstNumber: "", iecNumber: "" },
  buyer: blankParty(),
  consignee: blankParty(),
  notifyParty: blankParty(),
  currency: "USD",
  items: [blankItem()],
  packingDetails: "",
  paymentTerms: "",
  lcType: "",
  leadTime: "",
  priceTerms: "",
  portOfLoading: "",
  portOfDischarge: "",
  finalDestination: "",
  destinationCountry: "",
  bank: { name: "", branch: "", accountName: "", accountNumber: "", ifsc: "", swift: "", address: "" },
  authorisedSignatory: "",
  signatoryDesignation: "",
  additionalTerms: "",
  internalNotes: "",
  expectedDeliveryDate: "",
  advancePercent: "",
  creditDays: "",
  discountPercent: "",
  taxPercent: "",
});

type FieldErrors = Record<string, string>;
type GroupName = "buyer" | "consignee" | "notifyParty";

function setPath<T extends Record<string, any>>(source: T, path: string, value: string): T {
  const keys = path.split(".");
  const next = { ...source };
  let target: Record<string, any> = next;
  let oldTarget: Record<string, any> = source;
  keys.slice(0, -1).forEach((key) => {
    target[key] = { ...oldTarget[key] };
    target = target[key];
    oldTarget = oldTarget[key];
  });
  target[keys[keys.length - 1]] = value;
  return next;
}

function FieldError({ error, id }: { error?: string; id: string }) {
  return error ? <p id={`${id}-error`} className="text-xs font-medium text-destructive">{error}</p> : null;
}

export default function ManualSalesOrderForm({ open, quotationNumber, pending, onOpenChange, onSubmit }: Props) {
  const [draft, setDraft] = useState<ManualSalesOrderDraft>(initialDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(initialDraft());
      setErrors({});
      setFormError("");
    }
  }, [open]);

  const updateField = (path: string) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDraft((current) => setPath(current, path, event.target.value));
    setErrors((current) => {
      if (!current[path]) return current;
      const next = { ...current };
      delete next[path];
      return next;
    });
    setFormError("");
  };

  const field = (path: string, label: string, type = "text", placeholder?: string) => {
    const id = `manual-so-${path.replaceAll(".", "-")}`;
    return (
      <div className="min-w-0 space-y-1.5" key={path}>
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type={type}
          value={path.split(".").reduce<any>((value, key) => value?.[key], draft) ?? ""}
          onChange={updateField(path)}
          placeholder={placeholder}
          aria-invalid={Boolean(errors[path])}
          aria-describedby={errors[path] ? `${id}-error` : undefined}
          disabled={pending}
        />
        <FieldError id={id} error={errors[path]} />
      </div>
    );
  };

  const notes = (path: string, label: string, rows = 3) => {
    const id = `manual-so-${path.replaceAll(".", "-")}`;
    return (
      <div className="space-y-1.5" key={path}>
        <Label htmlFor={id}>{label}</Label>
        <Textarea
          id={id}
          rows={rows}
          value={path.split(".").reduce<any>((value, key) => value?.[key], draft) ?? ""}
          onChange={updateField(path)}
          aria-invalid={Boolean(errors[path])}
          aria-describedby={errors[path] ? `${id}-error` : undefined}
          disabled={pending}
        />
        <FieldError id={id} error={errors[path]} />
      </div>
    );
  };

  const partySection = (key: GroupName, title: string) => (
    <section className="space-y-4 rounded-lg border bg-card/60 p-4" aria-labelledby={`manual-so-${key}-title`} key={key}>
      <h3 id={`manual-so-${key}-title`} className="text-sm font-semibold">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {field(`${key}.name`, "Company / party name")}
        {field(`${key}.contactName`, "Contact name")}
        {field(`${key}.email`, "Email", "email")}
        {field(`${key}.phone`, "Phone")}
      </div>
      {notes(`${key}.address`, "Full address", 2)}
    </section>
  );

  const addProduct = () => setDraft((current) => ({ ...current, items: [...current.items, blankItem()] }));
  const removeProduct = (index: number) => setDraft((current) => ({
    ...current,
    items: current.items.filter((_, itemIndex) => itemIndex !== index),
  }));
  const updateProduct = (index: number, key: keyof DraftItem) => (event: ChangeEvent<HTMLInputElement>) => {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: event.target.value } : item),
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[`items.${index}.${key}`];
      return next;
    });
  };

  const totals = (() => {
    if (!draft.items.length) return null;
    const numeric = (value: string) => {
      if (value.trim() === "") return null;
      const result = Number(value);
      return Number.isFinite(result) && result >= 0 && result <= 9999999999.99 ? result : null;
    };
    const discountPercent = numeric(draft.discountPercent || "0");
    const taxPercent = numeric(draft.taxPercent || "0");
    const validItems = draft.items.map((item) => {
      const quantity = numeric(item.quantity);
      const unitPrice = numeric(item.unitPrice);
      if (quantity === null || unitPrice === null || quantity <= 0) return null;
      return { productName: item.productName, hsnCode: item.hsnCode, totalBags: Number(item.totalBags) || 0, quantity, unit: item.unit || "—", unitPrice, batchNumber: item.batchNumber };
    });
    if (discountPercent === null || taxPercent === null || validItems.some((item) => item === null)) return null;
    try {
      return calculateSalesOrderTotals({
        items: validItems as ManualSalesOrder["items"],
        discountPercent,
        taxPercent,
      });
    } catch {
      return null;
    }
  })();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const result = manualSalesOrderSchema.safeParse(draft);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (path && !nextErrors[path]) nextErrors[path] = issue.message;
      });
      setErrors(nextErrors);
      setFormError("Review the highlighted fields before creating this order.");
      const firstField = document.getElementById(`manual-so-${result.error.issues[0]?.path.join("-")}`);
      firstField?.focus();
      return;
    }
    setErrors({});
    setFormError("");
    onSubmit(result.data);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!pending) onOpenChange(next); }}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12 sm:px-7">
          <DialogTitle className="text-xl">Create Sales Order</DialogTitle>
          <DialogDescription>
            Enter the export contract manually for accepted quotation <strong>{quotationNumber}</strong>. Nothing is created until you submit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-7">
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Contract references</h3>
                <p className="mt-1 text-xs text-muted-foreground">Enter the contract identifiers and issue dates as they should appear on the export document.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {field("contractNumber", "Contract number")}
                {field("contractDate", "Contract date", "date")}
                {field("proformaNumber", "Proforma invoice number")}
                {field("proformaDate", "Proforma date", "date")}
                {field("currency", "Currency", "text", "USD")}
                {field("expectedDeliveryDate", "Expected delivery date", "date")}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Seller / exporter</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {field("seller.name", "Seller name")}
                {field("seller.phone", "Phone")}
                {field("seller.email", "Email", "email")}
                {field("seller.website", "Website")}
                {field("seller.gstNumber", "GST number")}
                {field("seller.iecNumber", "IEC number")}
              </div>
              {notes("seller.address", "Registered address", 2)}
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Parties</h3>
              {partySection("buyer", "Buyer")}
              {partySection("consignee", "Consignee")}
              {partySection("notifyParty", "Notify party")}
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Products and pricing</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Line values and adjustments are used for the live totals preview.</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addProduct} disabled={pending || draft.items.length >= 100}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add product
                </Button>
              </div>
              <div className="space-y-4">
                {draft.items.map((item, index) => (
                  <div className="rounded-lg border bg-card/60 p-4" key={index}>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-medium">Product line {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(index)}
                        disabled={pending || draft.items.length <= 1}
                        aria-label={`Remove product line ${index + 1}`}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" /> Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {([
                        ["productName", "Product description"],
                        ["hsnCode", "HSN code"],
                        ["totalBags", "Number of bags", "number"],
                        ["quantity", "Quantity", "number"],
                        ["unit", "Unit"],
                        ["unitPrice", `Unit price (${draft.currency || "currency"})`, "number"],
                        ["batchNumber", "Batch number"],
                      ] as Array<[keyof DraftItem, string, string?]>).map(([key, label, type = "text"]) => {
                        const id = `manual-so-items-${index}-${key}`;
                        const error = errors[`items.${index}.${key}`];
                        return (
                          <div className="min-w-0 space-y-1.5" key={key}>
                            <Label htmlFor={id}>{label}</Label>
                            <Input
                              id={id}
                              type={type}
                              min={type === "number" ? 0 : undefined}
                              step={key === "totalBags" ? 1 : "any"}
                              value={item[key]}
                              onChange={updateProduct(index, key)}
                              aria-invalid={Boolean(error)}
                              aria-describedby={error ? `${id}-error` : undefined}
                              disabled={pending}
                            />
                            <FieldError id={id} error={error} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {errors.items && <p className="text-sm font-medium text-destructive">{errors.items}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {field("discountPercent", "Discount (%)", "number")}
                {field("taxPercent", "Tax (%)", "number")}
              </div>
              <div className="rounded-lg border bg-muted/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Order totals</p>
                  <span className="text-xs text-muted-foreground">{draft.currency || "Currency"} · calculated from entered lines</span>
                </div>
                {totals ? (
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                    <div><dt className="text-muted-foreground">Subtotal</dt><dd className="font-medium">{draft.currency} {totals.subtotal}</dd></div>
                    <div><dt className="text-muted-foreground">Discount</dt><dd className="font-medium">− {draft.currency} {totals.discountAmount}</dd></div>
                    <div><dt className="text-muted-foreground">Tax</dt><dd className="font-medium">+ {draft.currency} {totals.taxAmount}</dd></div>
                    <div><dt className="text-muted-foreground">Total</dt><dd className="font-semibold">{draft.currency} {totals.totalAmount}</dd></div>
                  </dl>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Enter a valid quantity, unit price, discount, and tax to preview totals.</p>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Packing and commercial terms</h3>
              {notes("packingDetails", "Packing details")}
              <div className="grid gap-4 sm:grid-cols-2">
                {notes("paymentTerms", "Payment terms")}
                {notes("lcType", "Letter of credit type")}
                {field("advancePercent", "Advance payment (%)", "number")}
                {field("creditDays", "Credit days", "number")}
                {field("leadTime", "Lead time")}
                {field("priceTerms", "Pricing terms / Incoterm")}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Shipment and destination</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {field("portOfLoading", "Port of loading")}
                {field("portOfDischarge", "Port of discharge")}
                {field("finalDestination", "Final destination")}
                {field("destinationCountry", "Destination country")}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Bank details</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {field("bank.name", "Bank name")}
                {field("bank.branch", "Branch")}
                {field("bank.accountName", "Account name")}
                {field("bank.accountNumber", "Account number")}
                {field("bank.ifsc", "IFSC")}
                {field("bank.swift", "SWIFT")}
              </div>
              {notes("bank.address", "Bank address", 2)}
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Signatory and notes</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {field("authorisedSignatory", "Authorised signatory name")}
                {field("signatoryDesignation", "Signatory designation")}
              </div>
              <p className="text-xs text-muted-foreground">The PDF will print the signatory name and designation; no image signature is collected here.</p>
              {notes("additionalTerms", "Additional terms", 4)}
              {notes("internalNotes", "Internal notes (not for customer)", 3)}
            </section>
            {formError && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">{formError}</p>}
          </div>
          <DialogFooter className="shrink-0 border-t bg-background px-5 py-4 sm:px-7">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending} data-testid="button-submit-manual-sales-order">
              {pending ? "Creating Sales Order…" : "Create Sales Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
