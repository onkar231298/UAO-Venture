import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ChevronDown, ChevronUp, ClipboardList, Download, FilePlus2, History, Plus, Search, ShieldCheck, Users } from "lucide-react";

export type Product = { id: number; name: string; productType?: string | null; isOrganic?: boolean | null; unit?: string | null; stockUnit?: string | null };
export type Vendor = Record<string, any> & { id: number; vendorName: string; vendorCode?: string | null; scopes?: any[]; documents?: any[] };
export type Requisition = Record<string, any> & { id: number; requisitionNumber: string; status: string; productName: string; quantity: string; unit: string };
type Props = { role: string; onChanged: () => void };
const admin = (r: string) => ["admin", "super_admin"].includes(r);
const manager = (r: string) => admin(r) || r === "purchase_manager";
const purchaseEdit = (r: string) => manager(r) || r === "purchase_executive";
const currency = (value: any, code = "USD") => `${code} ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateInput = (v?: string | Date | null) => v ? new Date(v).toISOString().slice(0, 10) : "";
const labelCase = (value?: string) => (value || "unknown").replaceAll("_", " ");

async function send(url: string, method: string, body?: unknown) {
  const response = await apiRequest(url, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  return response.status === 204 ? null : response.json();
}
async function upload(url: string, file: File, fields: Record<string, string>) {
  const form = new FormData();
  form.append("file", file);
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  const response = await fetch(url, { method: "POST", body: form, credentials: "include" });
  if (!response.ok) {
    let message = "Document upload failed";
    try { message = (await response.json()).message || message; } catch { /* use fallback */ }
    throw new Error(message);
  }
  return response.json();
}
function useSave(onChanged: () => void) {
  return useMutation({ mutationFn: ({ url, method = "POST", body }: { url: string; method?: string; body?: unknown }) => send(url, method, body), onSuccess: () => onChanged() });
}
function State({ error, loading, empty, retry }: { error?: unknown; loading?: boolean; empty?: string; retry?: () => void }) {
  if (loading) return <div className="space-y-2 py-4" aria-label="Loading"><div className="h-10 animate-pulse rounded bg-muted" /><div className="h-10 animate-pulse rounded bg-muted" /><div className="h-10 animate-pulse rounded bg-muted" /></div>;
  if (error) return <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"><span>{(error as Error).message || "Could not load records."}</span>{retry && <Button size="sm" variant="outline" onClick={retry}>Retry</Button>}</div>;
  if (empty) return <div className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{empty}</div>;
  return null;
}
function Status({ value }: { value?: string }) {
  const s = value || "unknown";
  const cls = ["approved", "active", "fulfilled", "stock_available"].includes(s) ? "border-emerald-300 bg-emerald-50 text-emerald-800" :
    ["rejected", "inactive", "cancelled", "purchase_required"].includes(s) ? "border-rose-300 bg-rose-50 text-rose-800" :
    ["draft", "pending", "under_review", "pending_approval", "needs_review", "returned", "production_review", "inventory_review"].includes(s) ? "border-amber-300 bg-amber-50 text-amber-900" : "border-border bg-muted text-muted-foreground";
  return <Badge variant="outline" className={`whitespace-nowrap capitalize ${cls}`}>{labelCase(s)}</Badge>;
}
function Panel({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-lg border border-border bg-card">
    <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
      <div><h2 className="font-semibold">{title}</h2>{description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}</div>{action}
    </div><div className="p-4 md:p-5">{children}</div>
  </section>;
}
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block space-y-1.5"><span className="text-xs font-medium text-foreground">{label}</span>{children}{hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}</label>;
}
function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
    <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-xl border border-border bg-card p-5 shadow-xl sm:rounded-xl">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><Button variant="ghost" size="sm" onClick={close}>Close</Button></div>{children}
    </div>
  </div>;
}
function ActionsError({ message }: { message?: string }) { return message ? <div role="alert" className="mb-3 rounded border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">{message}</div> : null; }

export function PurchaseVendors({ role, onChanged }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showScope, setShowScope] = useState<Vendor | null>(null);
  const [review, setReview] = useState<Vendor | null>(null);
  const [actionError, setActionError] = useState("");
  const [financial, setFinancial] = useState<Vendor | null>(null);
  const [audit, setAudit] = useState<{ type: string; id: number; title: string } | null>(null);
  const { data, isLoading, isError, refetch } = useQuery<Vendor[]>({ queryKey: ["/api/purchase/vendors", { status: filter }] });
  const productsQuery = useQuery<Product[]>({ queryKey: ["/api/purchase/catalog-products"] });
  const vendors = useMemo(() => (data || []).filter((v) => `${v.vendorName} ${v.vendorCode || ""}`.toLowerCase().includes(search.toLowerCase())), [data, search]);
  const save = useSave(onChanged);
  const uploadMutation = useMutation({ mutationFn: ({ vendorId, file, scopeId, type }: { vendorId: number; file: File; scopeId?: number; type: string }) => upload(`/api/purchase/vendors/${vendorId}/documents`, file, { documentType: type, ...(scopeId ? { approvalScopeId: String(scopeId) } : {}) }), onSuccess: () => { onChanged(); setActionError(""); }, onError: (e: Error) => setActionError(e.message) });
  const [vendorForm, setVendorForm] = useState<Record<string, string>>({});
  const [scopeForm, setScopeForm] = useState({ scopeType: "product", productId: "", scopeDescription: "", organicRequirement: "unknown", certificationScheme: "", qualityRequired: true, validUntil: "" });
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState("approved");
  const [reason, setReason] = useState("");
  const beginVendor = (vendor?: Vendor) => {
    setEditing(vendor || null);
    setVendorForm(vendor ? Object.fromEntries(["vendorName", "contactPerson", "contactEmail", "contactPhone", "address", "taxRegistrationNumber", "registrationNumber", "website", "materialSupplied", "notes"].map((k) => [k, vendor[k] || ""])) : { vendorName: "", contactPerson: "", contactEmail: "", contactPhone: "", address: "", taxRegistrationNumber: "", registrationNumber: "", website: "", materialSupplied: "", notes: "" });
    setShowCreate(true);
  };
  const submitVendor = () => {
    if ((vendorForm.vendorName || "").trim().length < 2) return setActionError("Enter a vendor name with at least two characters.");
    const payload = Object.fromEntries(Object.entries(vendorForm).filter(([, v]) => v.trim()));
    save.mutate({ url: editing ? `/api/purchase/vendors/${editing.id}` : "/api/purchase/vendors", method: editing ? "PATCH" : "POST", body: payload }, { onSuccess: () => { setShowCreate(false); setActionError(""); } });
  };
  const productOptions = productsQuery.data || [];
  const selectedProduct = productOptions.find((p) => String(p.id) === scopeForm.productId);
  const addScope = () => {
    if (!showScope) return;
    if (scopeForm.scopeDescription.trim().length < 3) return setActionError("Describe the exact product or service scope.");
    const payload: any = { scopeType: scopeForm.scopeType, productId: scopeForm.scopeType === "service" ? null : Number(scopeForm.productId), scopeDescription: scopeForm.scopeDescription.trim(), organicRequirement: scopeForm.organicRequirement, certificationScheme: scopeForm.certificationScheme, qualityRequired: scopeForm.qualityRequired, validUntil: scopeForm.validUntil ? new Date(`${scopeForm.validUntil}T00:00:00.000Z`).toISOString() : null };
    if (scopeForm.scopeType !== "service" && !scopeForm.productId) return setActionError("Select a catalog product.");
    save.mutate({ url: `/api/purchase/vendors/${showScope.id}/scopes`, body: payload }, { onSuccess: () => { setShowScope(null); setActionError(""); } });
  };
  const reviewVendor = () => {
    if (!review || notes.trim().length < 3) return setActionError("Review notes must contain at least three characters.");
    save.mutate({ url: `/api/purchase/vendors/${review.id}/general-review`, body: { decision, notes: notes.trim() } }, { onSuccess: () => { setReview(null); setActionError(""); setNotes(""); } });
  };
  return <div className="space-y-4">
    <Panel title="Supplier register" description="A registered vendor remains pending until submitted and reviewed. Approval is never implied by registration." action={purchaseEdit(role) ? <Button size="sm" onClick={() => beginVendor()}><Plus className="mr-1.5 h-4 w-4" />Register supplier</Button> : undefined}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search supplier or code" /></div>
        <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All approvals" /></SelectTrigger><SelectContent>{["all", "pending", "under_review", "approved", "rejected", "suspended"].map((s) => <SelectItem key={s} value={s}>{labelCase(s)}</SelectItem>)}</SelectContent></Select>
      </div>
      <State loading={isLoading} error={isError ? new Error("Supplier register unavailable.") : undefined} retry={() => refetch()} empty={!isLoading && !isError && vendors.length === 0 ? "No supplier records match this view. No records have been created for you." : undefined} />
      {vendors.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-y border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground"><tr>{["Supplier / code", "Registration", "Supplier status", "Approval scopes", "Documents", "Actions"].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
        <tbody>{vendors.map((v) => <tr key={v.id} className="border-b border-border/70 align-top last:border-0">
          <td className="px-3 py-3"><div className="font-medium">{v.vendorName}</div><div className="mt-1 font-mono text-xs text-muted-foreground">{v.vendorCode || `#${v.id}`}</div></td>
          <td className="px-3 py-3"><Status value={v.generalApprovalStatus || v.approvalStatus} />{v.generalReviewNotes && <div className="mt-1 max-w-52 text-xs text-muted-foreground">{v.generalReviewNotes}</div>}</td>
          <td className="px-3 py-3"><Status value={v.vendorStatus} /></td>
          <td className="px-3 py-3">{v.scopes?.length || 0}<div className="mt-1 text-xs text-muted-foreground">{v.scopes?.filter((s: any) => s.approvalStatus === "approved").length || 0} approved</div></td>
          <td className="px-3 py-3">{v.documents?.length || 0}</td>
          <td className="px-3 py-3"><div className="flex flex-wrap gap-1.5">
            {purchaseEdit(role) && <Button size="sm" variant="outline" onClick={() => beginVendor(v)}>Edit</Button>}
            {purchaseEdit(role) && <Button size="sm" variant="outline" onClick={() => { setShowScope(v); setActionError(""); }}>Add scope</Button>}
            {purchaseEdit(role) && <Button size="sm" variant="outline" onClick={() => save.mutate({ url: `/api/purchase/vendors/${v.id}/submit` })} disabled={save.isPending || !v.scopes?.length}>Submit</Button>}
            {admin(role) && <Button size="sm" variant="outline" onClick={() => { setReview(v); setNotes(""); setActionError(""); }}>Registration review</Button>}
            {manager(role) && <Button size="sm" variant="outline" onClick={() => { setReason(""); setActionError(""); setReview({ ...v, __status: "status" } as any); }}> {v.vendorStatus === "active" ? "Deactivate" : "Activate"}</Button>}
            {(admin(role) || role === "purchase_manager") && <Button size="sm" variant="ghost" title="Restricted financial profile" onClick={() => setFinancial(v)}>Financial</Button>}
            <Button size="sm" variant="ghost" title="Audit history" onClick={() => setAudit({ type: "vendor", id: v.id, title: v.vendorName })}><History className="h-4 w-4" /></Button>
          </div></td>
        </tr>)}</tbody></table></div>}
      {save.isError && <ActionsError message={(save.error as Error).message} />}
      {actionError && !review && <ActionsError message={actionError} />}
    </Panel>
    {vendors.map((v) => <div key={`scopes-${v.id}`} className="rounded-lg border border-border bg-card">
      <details>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-primary" />{v.vendorName} · exact product and service scopes <span className="ml-auto text-xs text-muted-foreground">{v.scopes?.length || 0} scopes</span></summary>
        <div className="space-y-3 border-t border-border p-4">
          {!v.scopes?.length && <p className="text-sm text-muted-foreground">No approved sourcing scope exists. This supplier cannot be used for offers yet.</p>}
          {v.scopes?.map((s: any) => <div key={s.id} className="grid gap-2 rounded-md bg-muted/35 p-3 text-sm md:grid-cols-[1.2fr_1fr_auto]">
            <div><div className="font-medium">{s.scopeDescription}</div><div className="text-xs text-muted-foreground">{labelCase(s.scopeType)} · {s.organicRequirement} · {s.certificationScheme || "No scheme specified"}</div></div>
            <div className="text-xs text-muted-foreground">Scope #{s.id} · Quality {s.qualityRequired ? "required" : "not required"}{s.validUntil ? ` · expires ${new Date(s.validUntil).toLocaleDateString()}` : ""}{s.reviewNotes ? ` · ${s.reviewNotes}` : ""}</div>
            <div className="flex flex-wrap items-center gap-2"><Status value={s.approvalStatus} />
              {purchaseEdit(role) && <label className="cursor-pointer text-xs font-medium text-primary hover:underline">Upload certificate<input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadMutation.mutate({ vendorId: v.id, file, scopeId: s.id, type: "certification" }); e.currentTarget.value = ""; }} /></label>}
              {(v.documents || []).filter((d: any) => d.approvalScopeId === s.id).map((d: any) => <a key={d.id} href={`/api/purchase/documents/${d.id}`} target="_blank" rel="noreferrer" className="text-xs text-primary underline">{d.fileName}</a>)}
            </div>
          </div>)}
        </div>
      </details>
    </div>)}
    {showCreate && <Modal title={editing ? "Edit supplier registration" : "Register supplier"} close={() => setShowCreate(false)}>
      <div className="grid gap-3 sm:grid-cols-2">{[
        ["vendorName", "Legal supplier name"], ["contactPerson", "Contact person"], ["contactEmail", "Contact email"], ["contactPhone", "Contact phone"], ["taxRegistrationNumber", "Tax registration number"], ["registrationNumber", "Business registration"], ["website", "Website"],
      ].map(([key, label]) => <Field key={key} label={label}><Input value={vendorForm[key] || ""} onChange={(e) => setVendorForm({ ...vendorForm, [key]: e.target.value })} type={key === "contactEmail" ? "email" : "text"} /></Field>)}
        <div className="sm:col-span-2"><Field label="Business address"><Textarea rows={2} value={vendorForm.address || ""} onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })} /></Field></div>
        <div className="sm:col-span-2"><Field label="Products, materials or services supplied"><Textarea rows={2} value={vendorForm.materialSupplied || ""} onChange={(e) => setVendorForm({ ...vendorForm, materialSupplied: e.target.value })} /></Field></div>
        <div className="sm:col-span-2"><Field label="Internal notes"><Textarea rows={2} value={vendorForm.notes || ""} onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })} /></Field></div></div>
      <ActionsError message={actionError} /><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={submitVendor} disabled={save.isPending}>{save.isPending ? "Saving…" : editing ? "Save changes" : "Create pending registration"}</Button></div>
    </Modal>}
    {showScope && <Modal title={`Add sourcing scope · ${showScope.vendorName}`} close={() => setShowScope(null)}>
      <p className="mb-4 text-xs text-muted-foreground">Materials and packaging always require Quality approval. Admin cannot review technical scopes.</p>
      <div className="space-y-3">
        <Field label="Scope type"><Select value={scopeForm.scopeType} onValueChange={(scopeType) => setScopeForm({ ...scopeForm, scopeType, productId: "" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="product">Product / raw material</SelectItem><SelectItem value="packaging">Packaging</SelectItem><SelectItem value="service">Service</SelectItem></SelectContent></Select></Field>
        {scopeForm.scopeType !== "service" && <Field label="Catalog product"><Select value={scopeForm.productId} onValueChange={(productId) => { const product = productOptions.find((p) => String(p.id) === productId); setScopeForm({ ...scopeForm, productId, organicRequirement: product?.isOrganic ? "organic" : "conventional" }); }}><SelectTrigger><SelectValue placeholder={productsQuery.isLoading ? "Loading catalog…" : "Select exact product"} /></SelectTrigger><SelectContent>{productOptions.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name} · #{p.id}{p.isOrganic ? " · organic" : ""}</SelectItem>)}</SelectContent></Select></Field>}
        <Field label="Scope description"><Textarea value={scopeForm.scopeDescription} onChange={(e) => setScopeForm({ ...scopeForm, scopeDescription: e.target.value })} placeholder="Exact material, grade, process or service specification" /></Field>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Organic / material classification"><Select value={scopeForm.organicRequirement} onValueChange={(organicRequirement) => setScopeForm({ ...scopeForm, organicRequirement })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["organic", "conventional", "natural", "synthetic", "nature_identical", "unknown"].map((x) => <SelectItem key={x} value={x}>{labelCase(x)}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Certification scheme"><Input value={scopeForm.certificationScheme} onChange={(e) => setScopeForm({ ...scopeForm, certificationScheme: e.target.value })} placeholder="Scheme / applicable standard" /></Field>
          <Field label="Certificate valid until"><Input type="date" value={scopeForm.validUntil} onChange={(e) => setScopeForm({ ...scopeForm, validUntil: e.target.value })} /></Field>
          {scopeForm.scopeType === "service" && <Field label="Technical Quality review"><Select value={String(scopeForm.qualityRequired)} onValueChange={(v) => setScopeForm({ ...scopeForm, qualityRequired: v === "true" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Required</SelectItem><SelectItem value="false">Not required</SelectItem></SelectContent></Select></Field>}
        </div>
        {scopeForm.organicRequirement === "organic" && <p className="rounded bg-amber-50 p-2 text-xs text-amber-900">Organic scopes require a certification scheme, expiry date and an uploaded certificate before Quality can approve.</p>}
        <ActionsError message={actionError} /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowScope(null)}>Cancel</Button><Button onClick={addScope} disabled={save.isPending || productsQuery.isError || productsQuery.isLoading}>Add pending scope</Button></div>
      </div>
    </Modal>}
    {review && !("__status" in review) && <Modal title={`General registration review · ${review.vendorName}`} close={() => setReview(null)}>
      <p className="mb-3 text-sm text-muted-foreground">This decision applies only to general legal registration. Technical scope approval remains with Quality.</p>
      <Field label="Decision"><Select value={decision} onValueChange={setDecision}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="approved">Approve registration</SelectItem><SelectItem value="rejected">Reject registration</SelectItem><SelectItem value="returned">Return for correction</SelectItem></SelectContent></Select></Field>
      <div className="mt-3"><Field label="Review notes (required)"><Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field></div>
      <ActionsError message={actionError} /><div className="mt-4 flex justify-end"><Button onClick={reviewVendor} disabled={save.isPending || notes.trim().length < 3}>Record decision</Button></div>
    </Modal>}
    {review && "__status" in review && <Modal title={`${review.vendorStatus === "active" ? "Deactivate" : "Activate"} supplier · ${review.vendorName}`} close={() => setReview(null)}>
      <p className="mb-3 text-sm text-muted-foreground">Provide the reason for this status change. Reactivation returns approval to pending; it does not approve the vendor.</p>
      <Field label="Reason (required)"><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field><ActionsError message={actionError} />
      <div className="mt-4 flex justify-end"><Button disabled={reason.trim().length < 3 || save.isPending} onClick={() => save.mutate({ url: `/api/purchase/vendors/${review.id}/status`, body: { status: review.vendorStatus === "active" ? "inactive" : "active", reason: reason.trim() } }, { onSuccess: () => setReview(null) })}>Confirm status change</Button></div>
    </Modal>}
    {financial && <FinancialDialog vendor={financial} close={() => setFinancial(null)} onChanged={onChanged} />}
    {audit && <AuditDialog item={audit} close={() => setAudit(null)} />}
    {uploadMutation.isError && <ActionsError message={(uploadMutation.error as Error).message} />}
  </div>;
}

function FinancialDialog({ vendor, close, onChanged }: { vendor: Vendor; close: () => void; onChanged: () => void }) {
  const query = useQuery<any>({ queryKey: [`/api/purchase/vendors/${vendor.id}/financial`] });
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const save = useSave(onChanged);
  const fields = ["beneficiaryName", "bankName", "accountNumber", "routingCode", "swiftCode", "currency", "paymentTerms"];
  const current = form || Object.fromEntries(fields.map((f) => [f, query.data?.[f] || ""]));
  return <Modal title={`Restricted payment profile · ${vendor.vendorName}`} close={close}>
    <p className="mb-4 rounded bg-muted p-3 text-xs text-muted-foreground">Visible only to Admin and Purchase Manager. These details are not present in the vendor list response.</p>
    <State loading={query.isLoading} error={query.isError ? query.error : undefined} retry={() => query.refetch()} />
    {!query.isLoading && <div className="grid gap-3 sm:grid-cols-2">{fields.map((key) => <div key={key} className={key === "paymentTerms" ? "sm:col-span-2" : ""}><Field label={labelCase(key)}>{key === "paymentTerms" ? <Textarea rows={3} value={current[key]} onChange={(e) => setForm({ ...current, [key]: e.target.value })} /> : <Input value={current[key]} onChange={(e) => setForm({ ...current, [key]: e.target.value })} />}</Field></div>)}</div>}
    {query.data?.updatedAt && <p className="mt-3 text-xs text-muted-foreground">Updated {new Date(query.data.updatedAt).toLocaleString()}</p>}
    {save.isError && <ActionsError message={(save.error as Error).message} />}
    <div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={close}>Close</Button><Button disabled={save.isPending || query.isLoading} onClick={() => save.mutate({ url: `/api/purchase/vendors/${vendor.id}/financial`, method: "PUT", body: current }, { onSuccess: () => { onChanged(); close(); } })}>Save payment profile</Button></div>
  </Modal>;
}
function AuditDialog({ item, close }: { item: { type: string; id: number; title: string }; close: () => void }) {
  const query = useQuery<any[]>({ queryKey: [`/api/purchase/audit/${item.type}/${item.id}`] });
  return <Modal title={`Audit history · ${item.title}`} close={close}>
    <State loading={query.isLoading} error={query.isError ? query.error : undefined} retry={() => query.refetch()} empty={!query.isLoading && !query.isError && !query.data?.length ? "No audit events recorded." : undefined} />
    <div className="space-y-2">{query.data?.map((e) => <div key={e.id} className="rounded border border-border p-3 text-sm"><div className="flex justify-between gap-3"><strong>{labelCase(e.action)}</strong><time className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</time></div><p className="mt-1 text-xs text-muted-foreground">Actor {e.actorId}</p>{e.metadata && <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">{JSON.stringify(e.metadata, null, 2)}</pre>}</div>)}</div>
  </Modal>;
}
