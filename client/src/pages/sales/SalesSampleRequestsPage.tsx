import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CANONICAL_COUNTRIES } from "@shared/countries";
import { SalesLayout } from "@/components/layouts/SalesLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Eye, PackagePlus, Search } from "lucide-react";

interface SampleRequest {
  id: number;
  requestId: string;
  contactName: string;
  companyName: string;
  phoneNumber: string;
  emailAddress: string;
  sampleSize: string;
  purpose: string;
  expectedOrderQuantity?: string | null;
  message?: string | null;
  shippingAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  status: string;
  source?: string | null;
  productName?: string | null;
  customerName?: string | null;
  leadId?: number | null;
  leadName?: string | null;
  notes?: string | null;
  trackingNumber?: string | null;
  dhlNumber?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductOption {
  id: number;
  name: string;
  productId?: string | null;
}

const blankForm = {
  contactName: "", companyName: "", phoneNumber: "", emailAddress: "", sampleSize: "25g",
  purpose: "", expectedOrderQuantity: "", message: "", shippingAddress: "", city: "", state: "",
  postalCode: "", country: "", leadId: "", productId: "",
};

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800", approved: "bg-blue-100 text-blue-800",
    shipped: "bg-violet-100 text-violet-800", completed: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800", in_testing: "bg-cyan-100 text-cyan-800",
    sample_received: "bg-indigo-100 text-indigo-800",
  };
  return <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>{status.replace(/_/g, " ")}</Badge>;
}

function sourceBadge(source?: string | null) {
  const label = source?.replace(/_/g, " ") || "Sales";
  return <Badge variant="outline" className="capitalize">{label}</Badge>;
}

export default function SalesSampleRequestsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<SampleRequest | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const pageSize = 50;

  const { data, isLoading, isError, error } = useQuery<{ requests: SampleRequest[]; total: number }>({
    queryKey: ["/api/sales/sample-requests", {
      status: status === "all" ? undefined : status,
      source: source === "all" ? undefined : source,
      search: search || undefined,
      limit: pageSize,
      offset: page * pageSize,
    }],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  const { data: productsData } = useQuery<{ products: ProductOption[] }>({
    queryKey: ["/api/products", { limit: 500 }],
    enabled: createOpen,
  });
  const requests = data?.requests || [];
  const products = productsData?.products || [];
  const total = data?.total || 0;

  const createMutation = useMutation({
    mutationFn: async () => {
      const { leadId, productId, expectedOrderQuantity, message, ...required } = form;
      const body = {
        ...required,
        productId: Number(productId),
        ...(leadId ? { leadId: Number(leadId) } : {}),
        ...(expectedOrderQuantity ? { expectedOrderQuantity } : {}),
        ...(message ? { message } : {}),
      };
      const response = await apiRequest("/api/sales/sample-requests", { method: "POST", body: JSON.stringify(body) });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales/sample-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/my-samples"] });
      toast({ title: "Sample request created", description: "Quality can now process this request." });
      setForm(blankForm);
      setCreateOpen(false);
    },
    onError: (error: Error) => toast({ title: "Could not create sample request", description: error.message, variant: "destructive" }),
  });

  const update = (key: keyof typeof blankForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return <SalesLayout title="Sample Requests" subtitle="Create and track customer samples through Quality and shipping">
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-semibold">Customer sample requests</h2><p className="text-sm text-muted-foreground">Monitor status, Quality feedback, and delivery details.</p></div>
        <Button size="lg" onClick={() => setCreateOpen(true)} data-testid="button-create-sample-request"><PackagePlus className="mr-2 h-5 w-5" />Create sample request</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Requests</CardTitle><CardDescription>{requests.length} request{requests.length === 1 ? "" : "s"} shown</CardDescription></CardHeader>
        <CardContent>
          <div className="mb-5 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search request, customer, product, or lead" aria-label="Search sample requests" /></div>
            <Select value={status} onValueChange={(value) => { setStatus(value); setPage(0); }}><SelectTrigger className="lg:w-44"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{["pending", "approved", "sample_received", "in_testing", "shipped", "completed", "rejected"].map((item) => <SelectItem key={item} value={item}>{item.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
            <Select value={source} onValueChange={(value) => { setSource(value); setPage(0); }}><SelectTrigger className="lg:w-40"><SelectValue placeholder="All sources" /></SelectTrigger><SelectContent><SelectItem value="all">All sources</SelectItem><SelectItem value="sales">Sales</SelectItem><SelectItem value="lead">Lead</SelectItem><SelectItem value="website">Website</SelectItem></SelectContent></Select>
          </div>
          {isLoading ? <p className="py-10 text-center text-muted-foreground">Loading sample requests…</p> : isError ? <p className="py-10 text-center text-red-600">{error instanceof Error ? error.message : "Could not load sample requests."}</p> : requests.length === 0 ? <p className="py-10 text-center text-muted-foreground">No sample requests match the current filters.</p> : <div className="overflow-x-auto"><Table className="min-w-[1080px]"><TableHeader><TableRow><TableHead>Request</TableHead><TableHead>Customer / product</TableHead><TableHead>Lead</TableHead><TableHead>Status / source</TableHead><TableHead>Quality fulfillment</TableHead><TableHead>Latest update</TableHead><TableHead><span className="sr-only">View details</span></TableHead></TableRow></TableHeader><TableBody>
            {requests.map((request) => <TableRow key={request.id}><TableCell><p className="font-medium">{request.requestId}</p><p className="text-xs text-muted-foreground">{format(new Date(request.createdAt), "PP")}</p></TableCell><TableCell><p>{request.customerName || request.contactName}</p><p className="text-xs text-muted-foreground">{request.productName || request.companyName}</p></TableCell><TableCell>{request.leadId ? <><p>{request.leadName || `Lead #${request.leadId}`}</p><p className="text-xs text-muted-foreground">Linked lead</p></> : <span className="text-muted-foreground">—</span>}</TableCell><TableCell><div className="flex flex-wrap gap-1">{statusBadge(request.status)}{sourceBadge(request.source)}</div></TableCell><TableCell className="text-sm">{request.trackingNumber || request.dhlNumber ? <><p>Tracking: {request.trackingNumber || "—"}</p><p className="text-xs text-muted-foreground">DHL: {request.dhlNumber || "—"}</p></> : <span className="text-muted-foreground">Awaiting Quality</span>}</TableCell><TableCell className="text-sm">{format(new Date(request.updatedAt), "PP p")}</TableCell><TableCell><Button variant="ghost" size="icon" onClick={() => setSelected(request)} aria-label={`View ${request.requestId}`}><Eye className="h-4 w-4" /></Button></TableCell></TableRow>)}
          </TableBody></Table></div>}
          {total > pageSize && <div className="mt-4 flex items-center justify-between border-t pt-4"><p className="text-sm text-muted-foreground">Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</Button><Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= total} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div>}
        </CardContent>
      </Card>
    </div>

    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Sample request details</DialogTitle><DialogDescription>{selected?.requestId}</DialogDescription></DialogHeader>{selected && <div className="space-y-5">
      <div className="flex flex-wrap gap-2">{statusBadge(selected.status)}{sourceBadge(selected.source)}</div>
      <div className="grid gap-4 sm:grid-cols-2"><Detail label="Customer" value={selected.customerName || selected.contactName} /><Detail label="Company" value={selected.companyName} /><Detail label="Product" value={selected.productName || "Not specified"} /><Detail label="Lead" value={selected.leadId ? selected.leadName || `Lead #${selected.leadId}` : "Not linked"} /><Detail label="Contact" value={`${selected.emailAddress} · ${selected.phoneNumber}`} /><Detail label="Sample" value={`${selected.sampleSize} for ${selected.purpose.replace(/_/g, " ")}`} /></div>
      <div><Label>Shipping address</Label><p className="mt-1 rounded-md bg-muted p-3 text-sm">{selected.shippingAddress}<br />{selected.city}, {selected.state} {selected.postalCode}<br />{selected.country}</p></div>
      {selected.message && <div><Label>Request message</Label><p className="mt-1 rounded-md bg-muted p-3 text-sm">{selected.message}</p></div>}
      <div className="grid gap-4 sm:grid-cols-2"><Detail label="Quality notes" value={selected.notes || "No Quality notes yet"} /><Detail label="Tracking number" value={selected.trackingNumber || "Not available"} /><Detail label="DHL number" value={selected.dhlNumber || "Not available"} /><Detail label="Processed time" value={selected.processedAt ? format(new Date(selected.processedAt), "PPpp") : "Not processed"} /><Detail label="Latest update" value={format(new Date(selected.updatedAt), "PPpp")} /></div>
    </div>}<DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Close</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Create sample request</DialogTitle><DialogDescription>Provide complete contact and delivery details so Quality can prepare and ship the sample.</DialogDescription></DialogHeader>
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); createMutation.mutate(); }}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Contact name" value={form.contactName} onChange={(v) => update("contactName", v)} required /><Field label="Company name" value={form.companyName} onChange={(v) => update("companyName", v)} required /><Field label="Phone number" type="tel" value={form.phoneNumber} onChange={(v) => update("phoneNumber", v)} required /><Field label="Email address" type="email" value={form.emailAddress} onChange={(v) => update("emailAddress", v)} required /><div className="sm:col-span-2"><Label htmlFor="sample-product">Product</Label><Select value={form.productId} onValueChange={(v) => update("productId", v)} required><SelectTrigger id="sample-product"><SelectValue placeholder="Select the sample product" /></SelectTrigger><SelectContent>{products.map((product) => <SelectItem key={product.id} value={String(product.id)}>{product.name}{product.productId ? ` (${product.productId})` : ""}</SelectItem>)}</SelectContent></Select></div><Field label="Sample size" value={form.sampleSize} onChange={(v) => update("sampleSize", v)} required /><Field label="Purpose" value={form.purpose} onChange={(v) => update("purpose", v)} required placeholder="e.g. product testing" /><Field label="Expected quantity (optional)" value={form.expectedOrderQuantity} onChange={(v) => update("expectedOrderQuantity", v)} /><Field label="Lead ID (optional)" type="number" value={form.leadId} onChange={(v) => update("leadId", v)} /></div>
        <div><Label htmlFor="sample-message">Message (optional)</Label><Textarea id="sample-message" value={form.message} onChange={(event) => update("message", event.target.value)} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Shipping address" value={form.shippingAddress} onChange={(v) => update("shippingAddress", v)} required /></div><Field label="City" value={form.city} onChange={(v) => update("city", v)} required /><Field label="State / province" value={form.state} onChange={(v) => update("state", v)} required /><Field label="Postal code" value={form.postalCode} onChange={(v) => update("postalCode", v)} required /><div><Label htmlFor="country">Country</Label><Select value={form.country} onValueChange={(v) => update("country", v)} required><SelectTrigger id="country"><SelectValue placeholder="Select a country" /></SelectTrigger><SelectContent>{CANONICAL_COUNTRIES.map((country) => <SelectItem key={country} value={country}>{country}</SelectItem>)}</SelectContent></Select></div></div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={createMutation.isPending || !form.country || !form.productId}>{createMutation.isPending ? "Creating…" : "Create request"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
  </SalesLayout>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><Label>{label}</Label><p className="mt-1 break-words text-sm">{value}</p></div>; }
function Field({ label, value, onChange, required, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; placeholder?: string }) {
  const id = `sample-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return <div><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} /></div>;
}