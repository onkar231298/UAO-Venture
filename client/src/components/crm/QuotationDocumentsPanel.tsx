import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Download, FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type UploadMode = "customer" | "staff";

interface QuotationDocument {
  id: number;
  documentType: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploaderRole: string;
  createdAt: string;
}

interface QuotationDocumentsPanelProps {
  quotationId: number;
  quotationStatus: string;
  mode: UploadMode;
}

const DOCUMENT_LABELS: Record<string, string> = {
  customer_signed_quotation: "Customer-signed quotation",
  customer_purchase_order: "Customer purchase order",
  sales_signed_po: "Sales signed PO",
};

function localDateInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function QuotationDocumentsPanel({
  quotationId,
  quotationStatus,
  mode,
}: QuotationDocumentsPanelProps) {
  const [customerDocumentType, setCustomerDocumentType] = useState("signed_quotation");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [acceptanceDialogOpen, setAcceptanceDialogOpen] = useState(false);
  const [acceptanceChannel, setAcceptanceChannel] = useState<"email" | "phone" | "whatsapp" | "other" | "signed_quotation_upload">("email");
  const [acceptedDate, setAcceptedDate] = useState(localDateInputValue);
  const [acceptanceNotes, setAcceptanceNotes] = useState("");
  const [signedDocumentId, setSignedDocumentId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const basePath = mode === "customer"
    ? `/api/customer/quotations/${quotationId}`
    : `/api/quotations/${quotationId}`;
  const queryKey = [basePath, "documents"];

  const { data, isLoading, isError } = useQuery<{ documents: QuotationDocument[] }>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`${basePath}/documents`, { credentials: "include" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not load attached documents");
      return result;
    },
    enabled: Number.isInteger(quotationId) && quotationId > 0,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      if (mode === "customer") formData.append("documentType", customerDocumentType);
      const response = await fetch(`${basePath}/documents`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not upload this document");
      return result;
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: result?.document?.documentType === "customer_signed_quotation"
          ? "Signed quotation uploaded"
          : "Document uploaded",
        description: result?.document?.documentType === "customer_signed_quotation"
          ? "Your signed quotation is securely attached and waiting for the sales team to review."
          : "The document is attached to this quotation for the customer and assigned sales team.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const acceptanceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/quotations/${quotationId}/acceptance`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: acceptanceChannel,
          acceptedDate,
          documentId: signedDocumentId || undefined,
          notes: acceptanceNotes,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not record customer acceptance");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations", quotationId] });
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      setAcceptanceDialogOpen(false);
      setSignedDocumentId(null);
      setAcceptanceNotes("");
      toast({
        title: "Quotation accepted",
        description: "Customer acceptance is recorded. An authorized sales representative or admin can now create the Sales Order.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Could not record acceptance", description: error.message, variant: "destructive" });
    },
  });

  const openAcceptanceDialog = (document?: QuotationDocument) => {
    setSignedDocumentId(document?.id || null);
    setAcceptanceChannel(document ? "signed_quotation_upload" : "email");
    setAcceptedDate(localDateInputValue());
    setAcceptanceNotes("");
    setAcceptanceDialogOpen(true);
  };

  const canUpload = mode === "customer"
    ? ["sent", "accepted"].includes(quotationStatus)
    : ["sent", "accepted", "converted"].includes(quotationStatus);

  const downloadDocument = async (quoteDocument: QuotationDocument) => {
    setDownloadingId(quoteDocument.id);
    try {
      const response = await fetch(`${basePath}/documents/${quoteDocument.id}/download`, {
        credentials: "include",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Could not download this document");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = quoteDocument.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <section className="space-y-3 rounded-lg border p-4" aria-label="Quotation documents">
      <div>
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4" />
          Signed quotation &amp; purchase order
        </h4>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "customer"
            ? "Return your signed quotation or purchase order here. A signed quotation is reviewed by the sales team before the quotation is accepted."
            : "Review customer documents, or attach the signed PO. Creating a Sales Order is a separate action."}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Could not load documents. Refresh the quotation and try again.</p>
      ) : data?.documents?.length ? (
        <div className="space-y-2">
          {data.documents.map((item) => {
            const customerSignedCopy = item.documentType === "customer_signed_quotation" && item.uploaderRole === "customer";
            const awaitingReview = customerSignedCopy && ["sent", "expired"].includes(quotationStatus);
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/30 p-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{DOCUMENT_LABELS[item.documentType] || "Quotation attachment"}</p>
                    {awaitingReview && (
                      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                        <Clock className="mr-1 h-3 w-3" /> Awaiting review
                      </Badge>
                    )}
                    {customerSignedCopy && quotationStatus === "accepted" && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Acceptance recorded
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.fileName} · {item.uploaderRole === "customer" ? "Customer upload" : "Sales upload"}
                    {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {mode === "staff" && awaitingReview && (
                    <Button type="button" size="sm" onClick={() => openAcceptanceDialog(item)}>
                      Review &amp; accept
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => downloadDocument(item)}
                    disabled={downloadingId === item.id}
                  >
                    {downloadingId === item.id
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <Download className="mr-2 h-4 w-4" />}
                    Download
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No signed quotation or PO has been uploaded yet.</p>
      )}

      {canUpload ? (
        <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center">
          {mode === "customer" && (
            <select
              aria-label="Document type"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={customerDocumentType}
              onChange={(event) => setCustomerDocumentType(event.target.value)}
              disabled={uploadMutation.isPending}
            >
              <option value="signed_quotation">Signed quotation</option>
              <option value="purchase_order">Purchase order</option>
            </select>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="sr-only"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) uploadMutation.mutate(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Upload className="mr-2 h-4 w-4" />}
            {uploadMutation.isPending
              ? "Uploading…"
              : mode === "customer"
                ? "Upload signed document"
                : "Upload signed PO"}
          </Button>
          <span className="text-xs text-muted-foreground">PDF, JPG, or PNG · max 10 MB</span>
        </div>
      ) : (
        <p className="border-t pt-3 text-xs text-muted-foreground">
          Uploading is available after the quotation is sent to the customer.
        </p>
      )}

      {mode === "staff" && ["sent", "expired"].includes(quotationStatus) && (
        <div className="border-t pt-3">
          <Button type="button" variant="outline" size="sm" onClick={() => openAcceptanceDialog()}>
            Record acceptance from another channel
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Record a confirmed response received by email, phone, WhatsApp, or another channel.
          </p>
        </div>
      )}

      <Dialog
        open={acceptanceDialogOpen}
        onOpenChange={(open) => !acceptanceMutation.isPending && setAcceptanceDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {signedDocumentId ? "Review signed quotation" : "Record customer acceptance"}
            </DialogTitle>
            <DialogDescription>
              {signedDocumentId
                ? "Review the customer-uploaded file before recording the quotation as accepted."
                : "Record confirmed acceptance received outside the customer dashboard."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {signedDocumentId ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                Acceptance evidence: customer-uploaded signed quotation
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor={`acceptance-channel-${quotationId}`}>Confirmation channel</Label>
                <select
                  id={`acceptance-channel-${quotationId}`}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={acceptanceChannel}
                  onChange={(event) => setAcceptanceChannel(event.target.value as typeof acceptanceChannel)}
                  disabled={acceptanceMutation.isPending}
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="other">Other platform or method</option>
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor={`accepted-date-${quotationId}`}>Customer confirmation date</Label>
              <Input
                id={`accepted-date-${quotationId}`}
                type="date"
                value={acceptedDate}
                onChange={(event) => setAcceptedDate(event.target.value)}
                disabled={acceptanceMutation.isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`acceptance-notes-${quotationId}`}>Notes (optional)</Label>
              <Textarea
                id={`acceptance-notes-${quotationId}`}
                value={acceptanceNotes}
                onChange={(event) => setAcceptanceNotes(event.target.value)}
                placeholder="Add a brief reference to the customer's confirmation"
                maxLength={2000}
                rows={3}
                disabled={acceptanceMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAcceptanceDialogOpen(false)}
              disabled={acceptanceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => acceptanceMutation.mutate()}
              disabled={acceptanceMutation.isPending || !acceptedDate}
            >
              {acceptanceMutation.isPending ? "Saving…" : "Record acceptance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
