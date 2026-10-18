import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { Loader2, MessageSquarePlus, TrendingUp } from "lucide-react";

type RequestType = "high_volume_bid" | "quote_request";

interface CustomerRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestType: RequestType;
  onSubmitted: () => void;
}

interface RequestForm {
  productId: string;
  quantity: string;
  unit: string;
  targetPrice: string;
  expectedDelivery: string;
  urgency: string;
  message: string;
  notes: string;
}

const emptyForm: RequestForm = {
  productId: "",
  quantity: "",
  unit: "kg",
  targetPrice: "",
  expectedDelivery: "",
  urgency: "normal",
  message: "",
  notes: "",
};

export default function CustomerRequestDialog({
  open,
  onOpenChange,
  requestType,
  onSubmitted,
}: CustomerRequestDialogProps) {
  const { customer } = useCustomerAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<RequestForm>(emptyForm);
  const { data: productData, isLoading: productsLoading, isError: productsFailed } = useQuery({
    queryKey: ["/api/products", "customer-request-picker"],
    enabled: open,
    queryFn: async () => {
      const response = await fetch("/api/products?limit=500&offset=0");
      if (!response.ok) throw new Error("Could not load products");
      return response.json();
    },
  });

  const products = useMemo(() => {
    if (Array.isArray(productData)) return productData;
    return Array.isArray((productData as any)?.products) ? (productData as any).products : [];
  }, [productData]);

  const selectedProduct = products.find((product: any) => String(product.id) === form.productId);

  useEffect(() => {
    if (open) setForm(emptyForm);
  }, [open, requestType]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(form.productId),
          inquiryType: requestType,
          quantity: form.quantity,
          unit: form.unit,
          targetPrice: form.targetPrice || null,
          expectedDelivery: form.expectedDelivery || null,
          urgency: form.urgency,
          message: form.message.trim(),
          notes: form.notes.trim() || null,
          contactName: `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim(),
          companyName: customer?.companyName || "",
          phoneNumber: customer?.phoneNumber || "",
          emailAddress: customer?.email || "",
          requiresApproval: requestType === "high_volume_bid",
          bidStatus: requestType === "high_volume_bid" ? "pending" : null,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || "Your request could not be submitted");
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: requestType === "high_volume_bid" ? "Bid request submitted" : "Quote request submitted",
        description: "You can follow its status from My Inquiries.",
      });
      onOpenChange(false);
      onSubmitted();
    },
    onError: (error: Error) => {
      toast({
        title: "Could not submit request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customer) {
      toast({
        title: "Sign in required",
        description: "Please sign in again before submitting a request.",
        variant: "destructive",
      });
      return;
    }
    if (!form.productId || !form.quantity || !form.message.trim()) {
      toast({
        title: "Complete the required fields",
        description: "Choose a product, enter a quantity, and describe your requirements.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate();
  };

  const isBid = requestType === "high_volume_bid";
  const Icon = isBid ? TrendingUp : MessageSquarePlus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {isBid ? "New High Volume Bid" : "Request a Quote"}
          </DialogTitle>
          <DialogDescription>
            Select a product and share the quantities and requirements. The request will be linked to your customer account.
          </DialogDescription>
        </DialogHeader>

        {productsLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading products…
          </div>
        ) : productsFailed ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-700">Products could not be loaded. Please try again.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">No products are available right now.</div>
        ) : (
          <form id="customer-request-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-request-product">Product *</Label>
              <select
                id="customer-request-product"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.productId}
                onChange={(event) => setForm({ ...form, productId: event.target.value })}
                required
              >
                <option value="">Choose a product</option>
                {products.map((product: any) => (
                  <option key={product.id} value={product.id}>
                    {product.name}{product.productId ? ` (${product.productId})` : ""}
                  </option>
                ))}
              </select>
              {selectedProduct?.moq && (
                <p className="text-xs text-gray-500">
                  Minimum order: {selectedProduct.moq} {selectedProduct.priceUnit || selectedProduct.stockUnit || "kg"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-request-quantity">Quantity *</Label>
                <Input
                  id="customer-request-quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                  placeholder="Quantity required"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-request-unit">Unit</Label>
                <select
                  id="customer-request-unit"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.unit}
                  onChange={(event) => setForm({ ...form, unit: event.target.value })}
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="mt">Metric tons (mt)</option>
                  <option value="lbs">Pounds (lbs)</option>
                  <option value="g">Grams (g)</option>
                </select>
              </div>
              {isBid && (
                <div className="space-y-2">
                  <Label htmlFor="customer-request-target-price">Target unit price (optional)</Label>
                  <Input
                    id="customer-request-target-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.targetPrice}
                    onChange={(event) => setForm({ ...form, targetPrice: event.target.value })}
                    placeholder="Your target price"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="customer-request-delivery">Expected delivery (optional)</Label>
                <Input
                  id="customer-request-delivery"
                  type="date"
                  value={form.expectedDelivery}
                  onChange={(event) => setForm({ ...form, expectedDelivery: event.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-request-message">Requirements *</Label>
              <Textarea
                id="customer-request-message"
                rows={4}
                required
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                placeholder="Include quality, packaging, destination, certification, or other requirements."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-request-notes">Additional notes</Label>
              <Textarea
                id="customer-request-notes"
                rows={2}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-request-urgency">Urgency</Label>
              <select
                id="customer-request-urgency"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.urgency}
                onChange={(event) => setForm({ ...form, urgency: event.target.value })}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </form>
        )}

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="customer-request-form"
            disabled={productsLoading || productsFailed || products.length === 0 || submitMutation.isPending}
          >
            {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitMutation.isPending ? "Submitting…" : isBid ? "Submit Bid Request" : "Request Quote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
