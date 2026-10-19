import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Eye, FileText, Plus, ShieldCheck } from "lucide-react";
import type { QuotationPdfTemplateSettings } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface PdfTemplateVersion {
  id: number;
  templateName: string;
  version: string;
  status: "draft" | "active" | "superseded";
  settings: QuotationPdfTemplateSettings;
  revisionNotes: string | null;
  isActive: boolean;
  createdAt: string;
  activatedAt: string | null;
}

interface PdfTemplateResponse {
  versions: PdfTemplateVersion[];
  activeVersion: PdfTemplateVersion | null;
  defaultSettings: QuotationPdfTemplateSettings;
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

const statusLabel: Record<PdfTemplateVersion["status"], string> = {
  draft: "Draft",
  active: "Active",
  superseded: "Previous version",
};

export default function QuotationPdfTemplateManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [settings, setSettings] = useState<QuotationPdfTemplateSettings | null>(null);
  const [draftRevisionNotes, setDraftRevisionNotes] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const versionsQuery = useQuery<PdfTemplateResponse>({
    queryKey: ["/api/admin/quotation-pdf-templates"],
    queryFn: () => requestJson("/api/admin/quotation-pdf-templates"),
  });
  const versions = versionsQuery.data?.versions || [];
  const activeVersion = versionsQuery.data?.activeVersion || null;
  const selectedVersion = versions.find((version) => version.id === selectedId) || null;
  const currentSettings = settings || versionsQuery.data?.defaultSettings || null;
  const isDirty = useMemo(
    () => Boolean(selectedVersion && currentSettings && (
      JSON.stringify(currentSettings) !== JSON.stringify(selectedVersion.settings) ||
      draftRevisionNotes !== (selectedVersion.revisionNotes || "")
    )),
    [currentSettings, draftRevisionNotes, selectedVersion],
  );

  useEffect(() => {
    if (!versions.length) {
      setSelectedId(null);
      setSettings(versionsQuery.data?.defaultSettings || null);
      setDraftRevisionNotes("");
      return;
    }
    if (!selectedId || !versions.some((version) => version.id === selectedId)) {
      setSelectedId(activeVersion?.id || versions[0].id);
      return;
    }
    const selected = versions.find((version) => version.id === selectedId);
    if (selected) {
      setSettings(selected.settings);
      setDraftRevisionNotes(selected.revisionNotes || "");
    }
  }, [versions, activeVersion, selectedId, versionsQuery.data?.defaultSettings]);

  const refreshVersions = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/admin/quotation-pdf-templates"] });

  const initialVersionMutation = useMutation({
    mutationFn: () => requestJson<PdfTemplateVersion>("/api/admin/quotation-pdf-templates/initial", { method: "POST" }),
    onSuccess: async (created) => {
      await refreshVersions();
      setSelectedId(created.id);
      setSettings(created.settings);
      toast({ title: "Current format registered", description: "Version 1.0 is now the active quotation PDF format." });
    },
    onError: (error: Error) => toast({ title: "Could not register format", description: error.message, variant: "destructive" }),
  });

  const revisionMutation = useMutation({
    mutationFn: () => {
      if (!activeVersion) throw new Error("There is no active format to revise");
      return requestJson<PdfTemplateVersion>(`/api/admin/quotation-pdf-templates/${activeVersion.id}/revisions`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess: async (created) => {
      await refreshVersions();
      setSelectedId(created.id);
      setSettings(created.settings);
      setDraftRevisionNotes(created.revisionNotes || "");
      toast({ title: `Version ${created.version} created`, description: "The new layout is a draft and is not active yet." });
    },
    onError: (error: Error) => toast({ title: "Could not create version", description: error.message, variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersion || selectedVersion.status !== "draft" || !currentSettings) {
        throw new Error("Select a draft version before saving");
      }
      return requestJson<PdfTemplateVersion>(`/api/admin/quotation-pdf-templates/${selectedVersion.id}`, {
        method: "PUT",
        body: JSON.stringify({ settings: currentSettings, revisionNotes: draftRevisionNotes }),
      });
    },
    onSuccess: async () => {
      await refreshVersions();
      toast({ title: "Draft saved", description: "Preview it before activating the new format." });
    },
    onError: (error: Error) => toast({ title: "Could not save draft", description: error.message, variant: "destructive" }),
  });

  const activateMutation = useMutation({
    mutationFn: () => {
      if (!selectedVersion || selectedVersion.status !== "draft" || isDirty) {
        throw new Error("Save the draft changes before activating this version");
      }
      return requestJson<PdfTemplateVersion>(`/api/admin/quotation-pdf-templates/${selectedVersion.id}/activate`, {
        method: "POST",
      });
    },
    onSuccess: async (activated) => {
      await refreshVersions();
      setSelectedId(activated.id);
      toast({ title: `Version ${activated.version} activated`, description: "New quotations will use this PDF format. Issued quotations keep their saved format." });
    },
    onError: (error: Error) => toast({ title: "Could not activate format", description: error.message, variant: "destructive" }),
  });

  const previewMutation = useMutation({
    mutationFn: async (previewSettings: QuotationPdfTemplateSettings) => {
      const response = await fetch("/api/admin/quotation-pdf-templates/preview", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: previewSettings }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || `Preview failed (${response.status})`);
      }
      return URL.createObjectURL(await response.blob());
    },
    onSuccess: (url) => {
      setPreviewUrl((oldUrl) => {
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return url;
      });
    },
    onError: (error: Error) => toast({ title: "Could not preview format", description: error.message, variant: "destructive" }),
  });

  const closePreview = (open: boolean) => {
    if (!open) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  if (versionsQuery.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading quotation PDF formats…</div>;
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

  if (!versions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Atlas Ingredients Quotation
          </CardTitle>
          <CardDescription>
            Register the current PDF design as the first managed version. This keeps the current appearance unchanged while enabling draft revisions and activation history.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={() => initialVersionMutation.mutate()}
            disabled={initialVersionMutation.isPending}
            data-testid="button-register-initial-quotation-pdf-format"
          >
            <Plus className="mr-2 h-4 w-4" />
            {initialVersionMutation.isPending ? "Registering…" : "Register current format as version 1.0"}
          </Button>
          <Button
            variant="outline"
            onClick={() => previewMutation.mutate(versionsQuery.data!.defaultSettings)}
            disabled={previewMutation.isPending}
            data-testid="button-preview-default-quotation-pdf-format"
          >
            <Eye className="mr-2 h-4 w-4" />
            {previewMutation.isPending ? "Preparing preview…" : "Preview current format"}
          </Button>
        </CardContent>
        <Dialog open={Boolean(previewUrl)} onOpenChange={closePreview}>
          <DialogContent className="flex h-[85vh] max-w-5xl flex-col">
            <DialogHeader><DialogTitle>Current quotation PDF preview</DialogTitle></DialogHeader>
            {previewUrl && <iframe title="Quotation PDF preview" src={previewUrl} className="min-h-0 flex-1 rounded-md border" />}
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  const canEdit = selectedVersion?.status === "draft";
  const canActivate = canEdit && !isDirty;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(250px,0.8fr)_minmax(0,1.6fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Format versions</CardTitle>
          <CardDescription>Issued quotations keep the PDF format version saved when they were sent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeVersion && (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => revisionMutation.mutate()}
              disabled={revisionMutation.isPending}
              data-testid="button-create-quotation-pdf-revision"
            >
              <Plus className="mr-2 h-4 w-4" />
              {revisionMutation.isPending ? "Creating version…" : "Create new version"}
            </Button>
          )}
          <div className="space-y-2">
            {versions.map((version) => (
              <button
                key={version.id}
                type="button"
                onClick={() => setSelectedId(version.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedId === version.id ? "border-primary bg-primary/5" : "hover:bg-muted/60"
                }`}
                data-testid={`button-select-quotation-pdf-version-${version.id}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold">Version {version.version}</span>
                  <Badge variant={version.isActive ? "default" : version.status === "draft" ? "secondary" : "outline"}>
                    {version.isActive ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <Clock3 className="mr-1 h-3 w-3" />}
                    {statusLabel[version.status]}
                  </Badge>
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {new Date(version.createdAt).toLocaleDateString()}
                </span>
                {version.revisionNotes && (
                  <span className="mt-2 line-clamp-2 block text-xs text-muted-foreground">{version.revisionNotes}</span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {selectedVersion ? `Quotation PDF · Version ${selectedVersion.version}` : "Quotation PDF"}
          </CardTitle>
          <CardDescription>
            Update the visual identity for a draft, preview the generated document, then activate it. The authorised acceptance page remains included.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!selectedVersion || !currentSettings ? (
            <p className="text-sm text-muted-foreground">Select a quotation format version to manage it.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={selectedVersion.isActive ? "default" : selectedVersion.status === "draft" ? "secondary" : "outline"}>
                  {statusLabel[selectedVersion.status]}
                </Badge>
                {selectedVersion.activatedAt && (
                  <span className="text-xs text-muted-foreground">
                    Activated {new Date(selectedVersion.activatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quotation-pdf-document-title">Document title</Label>
                  <Input
                    id="quotation-pdf-document-title"
                    value={currentSettings.documentTitle}
                    maxLength={40}
                    disabled={!canEdit}
                    onChange={(event) => setSettings({ ...currentSettings, documentTitle: event.target.value })}
                    data-testid="input-quotation-pdf-document-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quotation-pdf-section-heading">Main heading</Label>
                  <Input
                    id="quotation-pdf-section-heading"
                    value={currentSettings.sectionHeading}
                    maxLength={50}
                    disabled={!canEdit}
                    onChange={(event) => setSettings({ ...currentSettings, sectionHeading: event.target.value })}
                    data-testid="input-quotation-pdf-section-heading"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {([
                  ["forestColor", "Forest green"],
                  ["greenColor", "Accent green"],
                  ["goldColor", "Warm gold"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`quotation-pdf-${key}`}>{label}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`quotation-pdf-${key}`}
                        type="color"
                        value={currentSettings[key]}
                        disabled={!canEdit}
                        className="h-10 w-14 cursor-pointer p-1"
                        onChange={(event) => setSettings({ ...currentSettings, [key]: event.target.value })}
                        data-testid={`input-quotation-pdf-${key}`}
                      />
                      <Input
                        aria-label={`${label} hex value`}
                        value={currentSettings[key]}
                        maxLength={7}
                        disabled={!canEdit}
                        onChange={(event) => setSettings({ ...currentSettings, [key]: event.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {selectedVersion.status === "draft" && (
                <div className="space-y-2">
                  <Label htmlFor="quotation-pdf-revision-notes">Revision notes</Label>
                  <Textarea
                    id="quotation-pdf-revision-notes"
                    value={draftRevisionNotes}
                    maxLength={1000}
                    disabled={!canEdit}
                    placeholder="Describe what changed in this version"
                    onChange={(event) => setDraftRevisionNotes(event.target.value)}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => previewMutation.mutate(currentSettings)}
                  disabled={previewMutation.isPending}
                  data-testid="button-preview-quotation-pdf-format"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {previewMutation.isPending ? "Preparing preview…" : "Preview PDF"}
                </Button>
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || !currentSettings}
                    data-testid="button-save-quotation-pdf-draft"
                  >
                    {saveMutation.isPending ? "Saving…" : "Save draft"}
                  </Button>
                )}
                {canEdit && (
                  <Button
                    onClick={() => activateMutation.mutate()}
                    disabled={!canActivate || activateMutation.isPending}
                    data-testid="button-activate-quotation-pdf-version"
                  >
                    {activateMutation.isPending ? "Activating…" : "Activate version"}
                  </Button>
                )}
              </div>
              {canEdit && isDirty && (
                <p className="text-xs text-amber-700">Save your changes before activating this version.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(previewUrl)} onOpenChange={closePreview}>
        <DialogContent className="flex h-[85vh] max-w-5xl flex-col">
          <DialogHeader><DialogTitle>Quotation PDF preview</DialogTitle></DialogHeader>
          {previewUrl && <iframe title="Quotation PDF preview" src={previewUrl} className="min-h-0 flex-1 rounded-md border" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
