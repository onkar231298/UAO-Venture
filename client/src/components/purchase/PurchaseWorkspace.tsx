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
  const vendors = useMemo(() => (data || [])
    .filter((v) => filter === "all" || v.approvalStatus === filter)
    .filter((v) => `${v.vendorName} ${v.vendorCode || ""}`.toLowerCase().includes(search.toLowerCase())), [data, search, filter]);
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

export function PurchaseFulfillment({ canPurchase, canSync, onChanged }: { canPurchase: boolean; canSync: boolean; onChanged: () => void }) {
  const query = useQuery<any[]>({ queryKey: ["/api/purchase/fulfillment"] });
  const sync = useSave(onChanged);
  const createReq = useMutation({
    mutationFn: (id: number) => send(`/api/purchase/fulfillment/${id}/requisition`, "POST", {}),
    onSuccess: () => onChanged(),
  });
  const rows = query.data || [];
  return <Panel title="Confirmed Sales Order fulfillment" description="Sales Order number is the cross-team reference; customer details stay in Sales. Only released, eligible finished goods reduce purchasing needs." action={canSync ? <Button size="sm" variant="outline" disabled={sync.isPending} onClick={() => sync.mutate({ url: "/api/purchase/fulfillment/sync-confirmed" })}>Sync confirmed orders</Button> : undefined}>
    <State loading={query.isLoading} error={query.isError ? query.error : undefined} retry={() => query.refetch()} empty={!query.isLoading && !query.isError && !rows.length ? "No confirmed Sales Orders are linked to fulfillment requirements yet." : undefined} />
    {rows.length > 0 && <div className="space-y-3">
      {rows.map((row) => {
        const stock = row.stockAnalysis || {};
        const blocked = ["inventory_review", "production_review"].includes(row.fulfillmentStatus);
        return <article key={row.id} className="rounded-md border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2"><span className="font-mono font-semibold">{row.soNumber}</span><Status value={row.fulfillmentStatus} /></div>
            <span className="text-xs text-muted-foreground">Required by {row.requiredBy ? new Date(row.requiredBy).toLocaleDateString() : "not set"}</span>
          </div>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><span className="text-xs text-muted-foreground">Product</span><div className="font-medium">{row.productName} · #{row.productId ?? "unlinked"}</div>{row.specification && <div className="text-xs text-muted-foreground">{row.specification}</div>}</div>
            <div><span className="text-xs text-muted-foreground">Required</span><div>{row.requiredQuantity} {row.unit}</div></div>
            <div><span className="text-xs text-muted-foreground">Released FG free / allocated</span><div>{stock.finishedGoodsAvailable ?? 0} / {row.allocatedQuantity ?? 0} {row.unit}</div></div>
            <div><span className="text-xs text-muted-foreground">Outstanding / purchase shortage</span><div className="font-semibold">{row.outstandingQuantity ?? row.requiredQuantity} / {stock.purchaseShortage ?? 0} {row.unit}</div></div>
          </div>
          {stock.reasons?.length > 0 && <ul className="mt-3 space-y-1 text-xs text-amber-900">{stock.reasons.map((reason: string, i: number) => <li key={i}>• {reason}</li>)}</ul>}
          <div className="mt-3 flex flex-wrap gap-2">
            {canPurchase && row.fulfillmentStatus === "purchase_required" && <Button size="sm" disabled={createReq.isPending} onClick={() => createReq.mutate(row.id)}>{createReq.isPending ? "Creating…" : "Create shortage requisition"}</Button>}
            {blocked && <span className="self-center text-xs text-muted-foreground">Do not source until stock classification or the production requirement is verified.</span>}
          </div>
        </article>;
      })}
      {createReq.isError && <ActionsError message={(createReq.error as Error).message} />}
      {sync.isError && <ActionsError message={(sync.error as Error).message} />}
    </div>}
  </Panel>;
}

export function PurchaseRequisitions({ role, onChanged }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewing, setReviewing] = useState<Requisition | null>(null);
  const [offersFor, setOffersFor] = useState<Requisition | null>(null);
  const [editingOffer, setEditingOffer] = useState<{ requisition: Requisition; offer: any } | null>(null);
  const [notes, setNotes] = useState("");
  const query = useQuery<Requisition[]>({ queryKey: ["/api/purchase/requisitions"] });
  const canEdit = purchaseEdit(role);
  const save = useSave(onChanged);
  return <div className="space-y-4">
    <Panel title="Material requisitions" description="Requests are internal planning records. Approval does not create stock or issue a Purchase Order." action={canEdit ? <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="mr-1.5 h-4 w-4" />New requisition</Button> : undefined}>
      <State loading={query.isLoading} error={query.isError ? query.error : undefined} retry={() => query.refetch()} empty={!query.isLoading && !query.isError && !query.data?.length ? "No requisitions yet." : undefined} />
      {!!query.data?.length && <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm">
        <thead className="border-y bg-muted/40 text-[11px] uppercase text-muted-foreground"><tr>{["Requisition", "Material / SO", "Quantity", "Needed by", "Status", "Actions"].map((x) => <th key={x} className="px-3 py-2.5">{x}</th>)}</tr></thead>
        <tbody>{query.data.map((r) => <tr key={r.id} className="border-b align-top">
          <td className="px-3 py-3 font-mono">{r.requisitionNumber}</td>
          <td className="px-3 py-3"><div className="font-medium">{r.productName}</div><div className="text-xs text-muted-foreground">{r.soNumber ? `SO ${r.soNumber}` : "Internal request"}</div>{r.specification && <div className="text-xs text-muted-foreground">{r.specification}</div>}</td>
          <td className="px-3 py-3">{r.quantity} {r.unit}</td><td className="px-3 py-3">{r.requiredBy ? new Date(r.requiredBy).toLocaleDateString() : "—"}</td><td className="px-3 py-3"><Status value={r.status} /></td>
          <td className="px-3 py-3"><div className="flex flex-wrap gap-1.5">
            {canEdit && ["draft", "returned"].includes(r.status) && <Button size="sm" variant="outline" disabled={save.isPending} onClick={() => save.mutate({ url: `/api/purchase/requisitions/${r.id}/submit` })}>Submit</Button>}
            {manager(role) && r.status === "pending_approval" && <Button size="sm" variant="outline" onClick={() => { setReviewing(r); setNotes(""); }}>Review</Button>}
            {canEdit && r.status === "approved" && <Button size="sm" variant="outline" onClick={() => setOffersFor(r)}>Offers / compare</Button>}
          </div></td>
        </tr>)}</tbody>
      </table></div>}
      {save.isError && <ActionsError message={(save.error as Error).message} />}
    </Panel>
    {createOpen && <RequisitionDialog close={() => setCreateOpen(false)} onChanged={onChanged} />}
    {reviewing && <Modal title={`Review ${reviewing.requisitionNumber}`} close={() => setReviewing(null)}>
      <p className="mb-3 text-sm text-muted-foreground">Record a decision and reason. Approval only permits offer comparison; it does not authorize issuing a PO.</p>
      <Field label="Review notes"><Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <div className="mt-4 flex flex-wrap justify-end gap-2">{["returned", "rejected", "approved"].map((decision) => <Button key={decision} variant={decision === "approved" ? "default" : "outline"} disabled={save.isPending || notes.trim().length < 3} onClick={() => save.mutate({ url: `/api/purchase/requisitions/${reviewing.id}/review`, body: { decision, notes: notes.trim() } }, { onSuccess: () => setReviewing(null) })}>{labelCase(decision)}</Button>)}</div>
      {save.isError && <ActionsError message={(save.error as Error).message} />}
    </Modal>}
    {offersFor && <OffersDialog requisition={offersFor} close={() => setOffersFor(null)} onCreatePO={(offer) => setEditingOffer({ requisition: offersFor, offer })} onChanged={onChanged} />}
    {editingOffer && <PurchaseOrderDialog requisition={editingOffer.requisition} offer={editingOffer.offer} close={() => setEditingOffer(null)} onChanged={onChanged} />}
  </div>;
}

function RequisitionDialog({ close, onChanged }: { close: () => void; onChanged: () => void }) {
  const products = useQuery<Product[]>({ queryKey: ["/api/purchase/catalog-products"] });
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [requiredBy, setRequiredBy] = useState("");
  const [reason, setReason] = useState("");
  const save = useSave(onChanged);
  const submit = () => save.mutate({ url: "/api/purchase/requisitions", body: { productId: Number(productId), quantity: Number(quantity), unit: unit.trim(), requiredBy: requiredBy ? new Date(`${requiredBy}T00:00:00.000Z`).toISOString() : null, reason: reason.trim() } }, { onSuccess: close });
  return <Modal title="Create material requisition" close={close}>
    <div className="space-y-3">
      <Field label="Catalog product"><Select value={productId} onValueChange={(value) => { setProductId(value); const p = products.data?.find((x) => String(x.id) === value); if (p) setUnit(p.stockUnit || p.unit || "kg"); }}><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger><SelectContent>{products.data?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name} · #{p.id}</SelectItem>)}</SelectContent></Select></Field>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Quantity"><Input type="number" min="0.001" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field><Field label="Unit"><Input value={unit} onChange={(e) => setUnit(e.target.value)} /></Field></div>
      <Field label="Required by"><Input type="date" value={requiredBy} onChange={(e) => setRequiredBy(e.target.value)} /></Field>
      <Field label="Reason"><Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain the internal requirement" /></Field>
      <ActionsError message={save.isError ? (save.error as Error).message : undefined} />
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={close}>Cancel</Button><Button disabled={save.isPending || !productId || !(Number(quantity) > 0) || unit.trim().length < 1 || reason.trim().length < 5 || products.isError} onClick={submit}>{save.isPending ? "Saving…" : "Save draft requisition"}</Button></div>
    </div>
  </Modal>;
}

function OffersDialog({ requisition, close, onCreatePO, onChanged }: { requisition: Requisition; close: () => void; onCreatePO: (offer: any) => void; onChanged: () => void }) {
  const query = useQuery<any[]>({ queryKey: [`/api/purchase/requisitions/${requisition.id}/offers`] });
  const vendorsQuery = useQuery<Vendor[]>({ queryKey: ["/api/purchase/vendors", { status: "all" }] });
  const eligible = useMemo(() => (vendorsQuery.data || []).flatMap((v) => (v.scopes || [])
    .filter((s: any) => v.vendorStatus === "active" && v.generalApprovalStatus === "approved" && s.productId === requisition.productId &&
      s.approvalStatus === "approved" && (!s.validUntil || new Date(s.validUntil).getTime() >= Date.now()))
    .map((scope: any) => ({ vendor: v, scope }))), [vendorsQuery.data, requisition.productId]);
  const [vendorScopeId, setVendorScopeId] = useState("");
  const [quantity, setQuantity] = useState(requisition.quantity);
  const [unitPrice, setUnitPrice] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [leadTime, setLeadTime] = useState("");
  const [payment, setPayment] = useState("");
  const [delivery, setDelivery] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const save = useSave(onChanged);
  const selected = eligible.find(({ scope }) => String(scope.id) === vendorScopeId);
  const add = () => {
    if (!selected) return;
    save.mutate({ url: `/api/purchase/requisitions/${requisition.id}/offers`, body: {
      vendorId: selected.vendor.id, vendorScopeId: selected.scope.id, quantity: Number(quantity), unit: requisition.unit,
      unitPrice: Number(unitPrice), currency: currencyCode, leadTimeDays: leadTime ? Number(leadTime) : null,
      paymentTerms: payment, deliveryTerms: delivery, validUntil: validUntil ? new Date(`${validUntil}T23:59:59.000Z`).toISOString() : null, notes,
    } }, { onSuccess: () => { setVendorScopeId(""); setUnitPrice(""); query.refetch(); } });
  };
  return <Modal title={`Supplier offers · ${requisition.requisitionNumber}`} close={close}>
    <p className="mb-3 text-sm text-muted-foreground">{requisition.productName} · {requisition.quantity} {requisition.unit} · only approved exact product scopes are selectable.</p>
    <State loading={vendorsQuery.isLoading || query.isLoading} error={vendorsQuery.isError ? vendorsQuery.error : query.isError ? query.error : undefined} retry={() => { vendorsQuery.refetch(); query.refetch(); }} />
    {eligible.length === 0 && !vendorsQuery.isLoading && <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">No active supplier is approved for this exact product scope yet.</p>}
    <div className="space-y-3">
      {query.data?.map((item) => <div key={item.offer.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3 text-sm">
        <div><div className="font-medium">{item.vendorName} · {currency(item.offer.unitPrice, item.offer.currency)}/{item.offer.unit}</div><div className="text-xs text-muted-foreground">{item.offer.quantity} {item.offer.unit} · {item.offer.leadTimeDays ?? "—"} day lead · {item.offer.paymentTerms || "terms not listed"}</div></div>
        <div className="flex items-center gap-2"><Status value={item.offer.status} />{item.offer.status === "received" && <Button size="sm" onClick={() => onCreatePO(item.offer)}>Create draft PO</Button>}</div>
      </div>)}
      {eligible.length > 0 && <div className="rounded-md border border-border p-3">
        <h3 className="mb-3 text-sm font-semibold">Record supplier quotation</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Approved supplier scope"><Select value={vendorScopeId} onValueChange={setVendorScopeId}><SelectTrigger><SelectValue placeholder="Choose supplier" /></SelectTrigger><SelectContent>{eligible.map(({ vendor, scope }) => <SelectItem key={scope.id} value={String(scope.id)}>{vendor.vendorName} · {scope.scopeDescription}</SelectItem>)}</SelectContent></Select></Field>
          <Field label={`Quantity (${requisition.unit})`}><Input type="number" step="any" min="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field>
          <Field label="Unit price"><Input type="number" step="any" min="0.0001" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} /></Field>
          <Field label="Currency (ISO 4217)"><Input maxLength={3} value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())} /></Field>
          <Field label="Lead time (days)"><Input type="number" min="0" max="3650" step="1" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} /></Field>
          <Field label="Valid until"><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>
          <Field label="Payment terms"><Input value={payment} onChange={(e) => setPayment(e.target.value)} /></Field>
          <Field label="Delivery terms"><Input value={delivery} onChange={(e) => setDelivery(e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Offer notes"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field></div>
        </div>
        <ActionsError message={save.isError ? (save.error as Error).message : undefined} />
        <div className="mt-3 flex justify-end"><Button size="sm" disabled={save.isPending || !selected || !(Number(quantity) > 0) || !(Number(unitPrice) > 0) || currencyCode.length !== 3} onClick={add}>{save.isPending ? "Saving…" : "Save supplier offer"}</Button></div>
      </div>}
    </div>
  </Modal>;
}

function PurchaseOrderDialog({ requisition, offer, close, onChanged }: { requisition: Requisition; offer: any; close: () => void; onChanged: () => void }) {
  const [quantity, setQuantity] = useState(String(offer.quantity));
  const [tax, setTax] = useState("0");
  const [expected, setExpected] = useState("");
  const [delivery, setDelivery] = useState(offer.deliveryTerms || "");
  const [terms, setTerms] = useState(offer.paymentTerms || "");
  const [notes, setNotes] = useState("");
  const save = useSave(onChanged);
  const total = Number(quantity || 0) * Number(offer.unitPrice || 0) * (1 + Number(tax || 0) / 100);
  return <Modal title={`Draft PO · ${requisition.requisitionNumber}`} close={close}>
    <p className="mb-4 text-sm text-muted-foreground">Supplier: {offer.vendorName || "Selected approved supplier"} · {requisition.productName} · {currency(offer.unitPrice, offer.currency)}/{offer.unit}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={`Quantity (${requisition.unit})`}><Input type="number" min="0.001" step="any" max={offer.quantity} value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field>
      <Field label="Tax %"><Input type="number" min="0" max="100" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} /></Field>
      <Field label="Expected delivery"><Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} /></Field>
      <Field label="Delivery terms"><Input value={delivery} onChange={(e) => setDelivery(e.target.value)} /></Field>
      <div className="sm:col-span-2"><Field label="Payment terms"><Textarea rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} /></Field></div>
      <div className="sm:col-span-2"><Field label="Internal notes"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field></div>
    </div>
    <div className="my-4 rounded bg-muted/50 p-3 text-right text-sm"><span className="text-muted-foreground">Estimated total: </span><strong>{currency(total, offer.currency)}</strong></div>
    <p className="mb-3 rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">No PO approval matrix is configured. This saves a draft only; it cannot be approved or issued.</p>
    <ActionsError message={save.isError ? (save.error as Error).message : undefined} />
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={close}>Cancel</Button><Button disabled={save.isPending || !(Number(quantity) > 0) || Number(quantity) > Number(offer.quantity)} onClick={() => save.mutate({ url: "/api/purchase-orders", body: { vendorOfferId: offer.id, quantity: Number(quantity), taxPercent: Number(tax), expectedDelivery: expected ? new Date(`${expected}T00:00:00.000Z`).toISOString() : null, deliveryTerms: delivery, terms, notes } }, { onSuccess: close })}>{save.isPending ? "Saving…" : "Save draft PO"}</Button></div>
  </Modal>;
}

export function PurchaseOrders({ role, onChanged }: Props) {
  const query = useQuery<any>({ queryKey: ["/api/purchase-orders", { status: "all" }] });
  const [selected, setSelected] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const orders: any[] = query.data?.orders || [];
  return <div className="space-y-4">
    <Panel title="Purchase orders" description="Drafts retain supplier and requisition links. Approval, issue, receipt/GRN, inventory posting, and payment are not available until their controls are configured.">
      <State loading={query.isLoading} error={query.isError ? query.error : undefined} retry={() => query.refetch()} empty={!query.isLoading && !query.isError && !orders.length ? "No Purchase Orders have been created." : undefined} />
      {!!orders.length && <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm">
        <thead className="border-y bg-muted/40 text-[11px] uppercase text-muted-foreground"><tr>{["PO number", "Supplier", "Item", "Quantity", "Total", "Status", "Actions"].map((x) => <th key={x} className="px-3 py-2.5">{x}</th>)}</tr></thead>
        <tbody>{orders.map((o) => <tr key={o.id} className="border-b align-top">
          <td className="px-3 py-3 font-mono">{o.poId}</td><td className="px-3 py-3">{o.vendorName}</td>
          <td className="px-3 py-3">{o.items?.map((i: any) => <div key={i.id}>{i.description}</div>)}</td>
          <td className="px-3 py-3">{o.items?.map((i: any) => <div key={i.id}>{i.quantity} {i.unit}</div>)}</td>
          <td className="px-3 py-3">{currency(o.totalAmount, o.currency)}</td><td className="px-3 py-3"><Status value={o.status} /></td>
          <td className="px-3 py-3"><div className="flex flex-wrap gap-1.5"><Button size="sm" variant="outline" onClick={() => setSelected(o)}>View</Button>{o.status === "draft" && <Button size="sm" variant="outline" onClick={() => setEditing(o)}>Edit</Button>}</div></td>
        </tr>)}</tbody></table></div>}
    </Panel>
    {selected && <PurchaseOrderDetails order={selected} close={() => setSelected(null)} onChanged={onChanged} role={role} />}
    {editing && <EditPurchaseOrder order={editing} close={() => setEditing(null)} onChanged={onChanged} />}
  </div>;
}

function EditPurchaseOrder({ order, close, onChanged }: { order: any; close: () => void; onChanged: () => void }) {
  const [delivery, setDelivery] = useState(dateInput(order.expectedDelivery));
  const [deliveryTerms, setDeliveryTerms] = useState(order.deliveryTerms || "");
  const [terms, setTerms] = useState(order.terms || "");
  const [notes, setNotes] = useState(order.notes || "");
  const [taxPercent, setTaxPercent] = useState(String(order.taxPercent ?? 0));
  const save = useSave(onChanged);
  return <Modal title={`Edit draft ${order.poId}`} close={close}>
    <div className="space-y-3"><Field label="Expected delivery"><Input type="date" value={delivery} onChange={(e) => setDelivery(e.target.value)} /></Field>
      <Field label="Delivery terms"><Input value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} /></Field>
      <Field label="Tax %"><Input type="number" min="0" max="100" step="0.01" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} /></Field>
      <Field label="Payment terms"><Textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} /></Field>
      <Field label="Internal notes"><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
    </div>
    <ActionsError message={save.isError ? (save.error as Error).message : undefined} />
    <div className="mt-4 flex justify-end"><Button disabled={save.isPending || Number(taxPercent) < 0 || Number(taxPercent) > 100} onClick={() => save.mutate({ url: `/api/purchase-orders/${order.id}`, method: "PATCH", body: { expectedDelivery: delivery ? new Date(`${delivery}T00:00:00.000Z`).toISOString() : null, deliveryTerms, taxPercent: Number(taxPercent), terms, notes } }, { onSuccess: close })}>Save draft edits</Button></div>
  </Modal>;
}

function PurchaseOrderDetails({ order, close, onChanged, role }: { order: any; close: () => void; onChanged: () => void; role: string }) {
  const query = useQuery<any>({ queryKey: [`/api/purchase-orders/${order.id}`] });
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const save = useSave(onChanged);
  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Select a document first.");
      return upload(`/api/purchase-orders/${order.id}/documents`, file, {});
    },
    onSuccess: () => { setFile(null); query.refetch(); onChanged(); },
  });
  const detail = query.data || order;
  return <Modal title={`Purchase Order · ${detail.poId}`} close={close}>
    <State loading={query.isLoading} error={query.isError ? query.error : undefined} retry={() => query.refetch()} />
    <div className="mb-4 grid gap-3 rounded border p-3 text-sm sm:grid-cols-2">
      <div>Supplier<br /><strong>{detail.vendorName}</strong></div><div>Status<br /><Status value={detail.status} /></div>
      <div>Subtotal<br /><strong>{currency(detail.subtotal, detail.currency)}</strong></div><div>Tax<br /><strong>{detail.taxPercent || "0"}% · {currency(detail.taxAmount, detail.currency)}</strong></div>
      <div>Total<br /><strong>{currency(detail.totalAmount, detail.currency)}</strong></div><div>Expected delivery<br /><strong>{detail.expectedDelivery ? new Date(detail.expectedDelivery).toLocaleDateString() : "—"}</strong></div>
      <div>Delivery terms<br /><strong>{detail.deliveryTerms || "—"}</strong></div><div>Payment terms<br /><strong>{detail.terms || "—"}</strong></div>
    </div>
    <h3 className="mb-2 text-sm font-semibold">Items</h3>
    <div className="mb-4 space-y-2">{detail.items?.map((item: any) => <div key={item.id} className="grid gap-2 rounded border p-3 text-sm sm:grid-cols-4"><span>{item.description}</span><span>{item.quantity} {item.unit}</span><span>{currency(item.unitPrice, detail.currency)} each</span><strong>{currency(item.lineTotal, detail.currency)}</strong></div>)}</div>
    <h3 className="mb-2 text-sm font-semibold">Supporting documents</h3>
    {detail.documents?.map((doc: any) => <a key={doc.id} className="mr-3 text-sm text-primary underline" href={`/api/purchase/documents/${doc.id}`} target="_blank" rel="noreferrer">{doc.fileName}</a>)}
    {detail.status === "draft" && <div className="mt-3 flex flex-wrap items-center gap-2"><Input className="max-w-sm" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files?.[0] || null)} /><Button size="sm" variant="outline" disabled={!file || uploadMutation.isPending} onClick={() => uploadMutation.mutate()}>{uploadMutation.isPending ? "Uploading…" : "Upload supplier document"}</Button></div>}
    {uploadMutation.isError && <ActionsError message={(uploadMutation.error as Error).message} />}
    {detail.status === "draft" && <div className="mt-4 border-t pt-4">
      <Field label="Cancellation reason (required)"><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <Button className="mt-2" variant="destructive" size="sm" disabled={reason.trim().length < 3 || save.isPending} onClick={() => save.mutate({ url: `/api/purchase-orders/${detail.id}/cancel`, body: { reason: reason.trim() } }, { onSuccess: close })}>Cancel draft PO</Button>
    </div>}
    {save.isError && <ActionsError message={(save.error as Error).message} />}
  </Modal>;
}
