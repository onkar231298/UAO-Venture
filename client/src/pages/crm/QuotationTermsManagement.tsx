import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface TermsVersion {
  id: number;
  templateName: string;
  version: string;
  effectiveDate: string | null;
  approvalStatus: string;
  termsText: string;
  revisionNotes: string | null;
  supersedesId: number | null;
  isActive: boolean;
  createdBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  legalReviewNote: string | null;
  createdAt: string;
}

interface TermsResponse {
  versions: TermsVersion[];
  activeVersion: TermsVersion | null;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }
  return payload as T;
}

const statusLabel: Record<string, string> = {
  pending_legal_review: "Pending legal review",
  approved: "Approved",
  superseded: "Superseded",
};

export default function QuotationTermsManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [termsText, setTermsText] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [legalReviewNote, setLegalReviewNote] = useState("");
  const [legalReviewConfirmed, setLegalReviewConfirmed] = useState(false);

  const versionsQuery = useQuery<TermsResponse>({
    queryKey: ["/api/admin/quotation-terms"],
    queryFn: () => requestJson("/api/admin/quotation-terms"),
  });
  const versions = versionsQuery.data?.versions || [];
  const selectedVersion = versions.find((version) => version.id === selectedId) || null;

  useEffect(() => {
    if (!versions.length) {
      setSelectedId(null);
      setTermsText("");
      return;
    }
    if (!selectedId || !versions.some((version) => version.id === selectedId)) {
      setSelectedId(versions[0].id);
      setTermsText(versions[0].termsText);
      return;
    }
    const current = versions.find((version) => version.id === selectedId);
    if (current) setTermsText(current.termsText);
  }, [versions, selectedId]);

  const wordCount = useMemo(
    () => termsText.trim().split(/\s+/).filter(Boolean).length,
    [termsText],
  );

  const refreshVersions = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/quotation-terms"] });
  const initialDraftMutation = useMutation({
    mutationFn: () => requestJson<TermsVersion>("/api/admin/quotation-terms/initial-draft", { method: "POST" }),
    onSuccess: async (created) => {
      await refreshVersions();
      setSelectedId(created.id);
      setTermsText(created.termsText);
      toast({ title: "Draft created", description: "The supplied terms are pending legal review and are not in customer PDFs." });
    },
    onError: (error: Error) => toast({ title: "Could not create draft", description: error.message, variant: "destructive" }),
  });
  const revisionMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersion) throw new Error("Select a terms version first");
      return requestJson<TermsVersion>(`/api/admin/quotation-terms/${selectedVersion.id}/revisions`, {
        method: "POST",
        body: JSON.stringify({ termsText, revisionNotes }),
      });
    },
    onSuccess: async (created) => {
      await refreshVersions();
      setSelectedId(created.id);
      setTermsText(created.termsText);
      setRevisionNotes("");
      setLegalReviewNote("");
      setLegalReviewConfirmed(false);
      toast({ title: `Version ${created.version} saved`, description: "It remains pending legal review." });
    },
    onError: (error: Error) => toast({ title: "Could not save revision", description: error.message, variant: "destructive" }),
  });
  const approveMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersion) throw new Error("Select a terms version first");
      return requestJson<TermsVersion>(`/api/admin/quotation-terms/${selectedVersion.id}/approve`, {
        method: "POST",
        body: JSON.stringify({
          legalReviewConfirmed,
          legalReviewNote,
          effectiveDate,
        }),
      });
    },
    onSuccess: (approved) => {
      refreshVersions();
      toast({ title: `Version ${approved.version} activated`, description: "New quotations can now include this approved terms version." });
    },
    onError: (error: Error) => toast({ title: "Could not activate version", description: error.message, variant: "destructive" }),
  });
  const deactivateMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersion) throw new Error("Select a terms version first");
      return requestJson<TermsVersion>(`/api/admin/quotation-terms/${selectedVersion.id}/deactivate`, { method: "POST" });
    },
    onSuccess: () => {
      refreshVersions();
      toast({ title: "Terms deactivated", description: "Future quotations will not receive a general terms page until another version is active." });
    },
    onError: (error: Error) => toast({ title: "Could not deactivate terms", description: error.message, variant: "destructive" }),
  });

  if (versionsQuery.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading quotation terms…</div>;
  }

  if (versionsQuery.isError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          {(versionsQuery.error as Error).message}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Quotation Terms &amp; Conditions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage immutable versions for future sales quotation PDFs. Only an approved, active version is attached to customer quotations.
        </p>
      </div>

      <Card className="border-amber-300 bg-amber-50/70">
        <CardContent className="flex gap-3 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="text-sm text-amber-950">
            The supplied wording is a draft, not legal advice or an approved contract. It stays out of customer PDFs until an administrator records legal review and activates a version.
          </div>
        </CardContent>
      </Card>

      {versions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />No terms versions yet</CardTitle>
            <CardDescription>Create the initial pending-review draft from the provided Atlas terms prompt.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => initialDraftMutation.mutate()} disabled={initialDraftMutation.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              {initialDraftMutation.isPending ? "Creating draft…" : "Create initial draft"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Version history</CardTitle>
              <CardDescription>{versions.length} saved version{versions.length === 1 ? "" : "s"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {versions.map((version) => (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setSelectedId(version.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    version.id === selectedId ? "border-emerald-700 bg-emerald-50" : "border-border hover:bg-muted/60"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold">Version {version.version}</span>
                    {version.isActive && <Badge className="bg-emerald-700">Active</Badge>}
                  </span>
                  <span className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {version.approvalStatus === "approved"
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                      : <Clock3 className="h-3.5 w-3.5 text-amber-700" />}
                    {statusLabel[version.approvalStatus] || version.approvalStatus}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Created {new Date(version.createdAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          {selectedVersion && (
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>Version {selectedVersion.version}</CardTitle>
                      <CardDescription className="mt-1">
                        {selectedVersion.revisionNotes || "No revision note"}
                      </CardDescription>
                    </div>
                    <Badge variant={selectedVersion.isActive ? "default" : "secondary"}>
                      {selectedVersion.isActive ? "Active for new quotations" : statusLabel[selectedVersion.approvalStatus] || selectedVersion.approvalStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedVersion.isActive && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                      Effective {selectedVersion.effectiveDate ? new Date(selectedVersion.effectiveDate).toLocaleDateString() : "date not set"}.
                      {" "}Previously issued quotations retain their stored text and version.
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="terms-text">Full clause text</Label>
                      <span className="text-xs text-muted-foreground">{wordCount.toLocaleString()} words</span>
                    </div>
                    <Textarea
                      id="terms-text"
                      value={termsText}
                      onChange={(event) => setTermsText(event.target.value)}
                      className="min-h-[420px] font-mono text-xs leading-relaxed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Edits here are only a working copy. Save them as a new version; this saved version will not be changed.
                    </p>
                    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                      <Input
                        value={revisionNotes}
                        onChange={(event) => setRevisionNotes(event.target.value)}
                        placeholder="Revision note (what changed)"
                        aria-label="Revision note"
                      />
                      <Button
                        variant="outline"
                        onClick={() => revisionMutation.mutate()}
                        disabled={revisionMutation.isPending || termsText.trim().length < 1000}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Save as next pending version
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedVersion.approvalStatus === "pending_legal_review" && (
                <Card className="border-emerald-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5" />Legal review and activation</CardTitle>
                    <CardDescription>
                      Approval activates this immutable version for newly issued quotations. Review governing law, CISG treatment, arbitration seat, rules and jurisdiction before proceeding.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="terms-effective-date">Effective date</Label>
                        <Input id="terms-effective-date" type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="terms-review-note">Legal review record</Label>
                        <Input
                          id="terms-review-note"
                          value={legalReviewNote}
                          onChange={(event) => setLegalReviewNote(event.target.value)}
                          placeholder="Reviewer or approval reference"
                        />
                      </div>
                    </div>
                    <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm">
                      <Checkbox checked={legalReviewConfirmed} onCheckedChange={(checked) => setLegalReviewConfirmed(checked === true)} />
                      <span>I confirm legal counsel reviewed this exact version and its international governing-law and dispute-resolution provisions.</span>
                    </label>
                    <Button
                      onClick={() => approveMutation.mutate()}
                      disabled={!legalReviewConfirmed || legalReviewNote.trim().length < 8 || !effectiveDate || approveMutation.isPending}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {approveMutation.isPending ? "Activating…" : "Approve and activate"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {selectedVersion.isActive && (
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <p className="text-sm text-muted-foreground">
                      Active since {selectedVersion.approvedAt ? new Date(selectedVersion.approvedAt).toLocaleString() : "approval"}.
                      {selectedVersion.legalReviewNote ? ` Review record: ${selectedVersion.legalReviewNote}` : ""}
                    </p>
                    <Button variant="outline" onClick={() => deactivateMutation.mutate()} disabled={deactivateMutation.isPending}>
                      {deactivateMutation.isPending ? "Deactivating…" : "Deactivate for new quotations"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
