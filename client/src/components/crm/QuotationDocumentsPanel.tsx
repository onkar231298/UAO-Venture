import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function QuotationDocumentsPanel({
  quotationId,
  quotationStatus,
  mode,
}: QuotationDocumentsPanelProps) {
  const [customerDocumentType, setCustomerDocumentType] = useState("signed_quotation");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Document uploaded",
        description: "The document is attached to this quotation for the customer and assigned sales team.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

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
            ? "Return your signed quotation or purchase order here. Uploading a file does not automatically accept the quotation."
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
          {data.documents.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/30 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{DOCUMENT_LABELS[item.documentType] || "Quotation attachment"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.fileName} · {item.uploaderRole === "customer" ? "Customer upload" : "Sales upload"}
                  {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ""}
                </p>
              </div>
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
          ))}
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
    </section>
  );
}
