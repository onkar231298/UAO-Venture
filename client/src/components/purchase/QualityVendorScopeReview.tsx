import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type ReviewItem = {
  scope: {
    id: number;
    vendorId: number;
    scopeType: string;
    productId: number | null;
    scopeDescription: string;
    organicRequirement: string;
    certificationScheme: string | null;
    qualityRequired: boolean;
    validUntil: string | null;
    approvalStatus: string;
    reviewNotes: string | null;
  };
  vendorName: string;
  vendorCode: string | null;
  vendorStatus: string;
  generalApprovalStatus: string;
};

export default function QualityVendorScopeReview() {
  const [notes, setNotes] = useState<Record<number, string>>({});
  const queue = useQuery<ReviewItem[]>({ queryKey: ["/api/purchase/vendor-scopes/review-queue"] });
  const vendors = useQuery<any[]>({ queryKey: ["/api/purchase/vendors", { status: "all" }] });
  const review = useMutation({
    mutationFn: async ({ id, decision, comment }: { id: number; decision: "approved" | "rejected" | "returned"; comment: string }) => {
      const response = await apiRequest(`/api/purchase/vendor-scopes/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ decision, notes: comment }),
      });
      return response.json();
    },
    onSuccess: () => {
      void queue.refetch();
      setNotes({});
    },
  });
  const documents = (vendorId: number, scopeId: number) => vendors.data?.find((v) => v.id === vendorId)?.documents?.filter((d: any) => d.approvalScopeId === scopeId) || [];
  return <section className="rounded-lg border border-border bg-card">
    <div className="border-b border-border px-4 py-4">
      <h2 className="font-semibold">Supplier technical scope review</h2>
      <p className="mt-1 text-xs text-muted-foreground">Review submitted supplier evidence by exact product or service scope. A decision applies only to that scope.</p>
    </div>
    <div className="p-4">
      {queue.isLoading && <p className="text-sm text-muted-foreground">Loading review queue…</p>}
      {(queue.isError || vendors.isError) && <div role="alert" className="rounded border border-destructive/40 p-3 text-sm text-destructive">Could not load scope reviews or supplier documents. Refresh and try again.</div>}
      {!queue.isLoading && !queue.isError && !queue.data?.length && <div className="rounded border border-dashed p-8 text-center text-sm text-muted-foreground">No supplier technical scopes are waiting for review.</div>}
      <div className="space-y-3">
        {queue.data?.map(({ scope, vendorName, vendorCode, vendorStatus, generalApprovalStatus }) => {
          const scopeDocs = documents(scope.vendorId, scope.id);
          const comment = notes[scope.id] || "";
          const busy = review.isPending;
          return <article key={scope.id} className="rounded-md border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h3 className="font-semibold">{vendorName} <span className="font-mono text-xs text-muted-foreground">{vendorCode || `#${scope.vendorId}`}</span></h3>
                <p className="mt-1 text-sm">{scope.scopeDescription}</p>
              </div>
              <Badge variant="outline" className="capitalize">{scope.approvalStatus.replaceAll("_", " ")}</Badge>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <div>Scope: {scope.scopeType}{scope.productId ? ` · Product #${scope.productId}` : ""} · {scope.organicRequirement}</div>
              <div>General registration: {generalApprovalStatus.replaceAll("_", " ")} · Vendor: {vendorStatus}</div>
              <div>Certification: {scope.certificationScheme || "not specified"}</div>
              <div>Valid until: {scope.validUntil ? new Date(scope.validUntil).toLocaleDateString() : "not specified"}</div>
            </div>
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium">Scope evidence</p>
              {scopeDocs.length ? <div className="flex flex-wrap gap-2">{scopeDocs.map((doc: any) => <a key={doc.id} href={`/api/purchase/documents/${doc.id}`} target="_blank" rel="noreferrer" className="text-xs text-primary underline">{doc.fileName}</a>)}</div> : <p className="text-xs text-amber-800">No document is attached to this scope yet.</p>}
            </div>
            {scope.reviewNotes && <p className="mt-2 rounded bg-muted/40 p-2 text-xs">Previous note: {scope.reviewNotes}</p>}
            <div className="mt-3 space-y-2">
              <Textarea rows={2} value={comment} onChange={(e) => setNotes((current) => ({ ...current, [scope.id]: e.target.value }))} placeholder="Review notes are required" aria-label={`Review notes for ${vendorName}`} />
              {review.isError && <p role="alert" className="text-xs text-destructive">{(review.error as Error).message}</p>}
              <div className="flex flex-wrap justify-end gap-2">
                {(["returned", "rejected", "approved"] as const).map((decision) => <Button key={decision} size="sm" variant={decision === "approved" ? "default" : "outline"} disabled={busy || comment.trim().length < 3 || (decision === "approved" && !vendorStatus.includes("active"))}
                  onClick={() => review.mutate({ id: scope.id, decision, comment: comment.trim() })}>{decision.replace("_", " ")}</Button>)}
              </div>
            </div>
          </article>;
        })}
      </div>
      {queue.isError && <Button variant="outline" size="sm" className="mt-3" onClick={() => queue.refetch()}>Retry</Button>}
    </div>
  </section>;
}
