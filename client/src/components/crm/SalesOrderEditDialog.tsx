import { useEffect, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type EditableOrder = {
  id: number;
  soNumber: string;
  expectedDeliveryDate?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  shippingMethod?: string | null;
  paymentTermsAdvancePercent?: string | number | null;
  paymentTermsCreditDays?: number | null;
  paymentTermsNotes?: string | null;
  internalNotes?: string | null;
  customerNotes?: string | null;
  termsAndConditions?: string | null;
};

interface Props {
  order: EditableOrder | null;
  open: boolean;
  onClose: () => void;
}

export default function SalesOrderEditDialog({ order, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<Record<string, string>>({});
  const selectedOrderId = order?.id;
  const { data: details, isLoading, isError } = useQuery<EditableOrder>({
    queryKey: ["/api/sales-orders", order?.id],
    enabled: open && !!order,
    queryFn: async () => {
      const response = await fetch(`/api/sales-orders/${order!.id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Could not load Sales Order details");
      return response.json();
    },
  });

  useEffect(() => {
    if (!open || !details || details.id !== selectedOrderId) return;
    const order = details;
    setForm({
      expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().slice(0, 10) : "",
      shippingAddress: order.shippingAddress || "",
      shippingCity: order.shippingCity || "",
      shippingState: order.shippingState || "",
      shippingPostalCode: order.shippingPostalCode || "",
      shippingCountry: order.shippingCountry || "",
      shippingMethod: order.shippingMethod || "",
      paymentTermsAdvancePercent: String(order.paymentTermsAdvancePercent ?? 0),
      paymentTermsCreditDays: String(order.paymentTermsCreditDays ?? 0),
      paymentTermsNotes: order.paymentTermsNotes || "",
      internalNotes: order.internalNotes || "",
      customerNotes: order.customerNotes || "",
      termsAndConditions: order.termsAndConditions || "",
    });
  }, [open, details, selectedOrderId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("Sales Order not selected");
      const response = await fetch(`/api/sales-orders/${order.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expectedDeliveryDate: form.expectedDeliveryDate || null,
          paymentTermsAdvancePercent: Number(form.paymentTermsAdvancePercent),
          paymentTermsCreditDays: Number(form.paymentTermsCreditDays),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not save Sales Order changes");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders", order?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-metrics"] });
      toast({ title: "Sales Order updated", description: `${order?.soNumber} was saved.` });
      onClose();
    },
    onError: (error: Error) => toast({
      title: "Could not update Sales Order",
      description: error.message,
      variant: "destructive",
    }),
  });

  const update = (name: string) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(current => ({ ...current, [name]: event.target.value }));
  const textField = (name: string, label: string, type = "text") => (
    <div className="space-y-1" key={name}>
      <Label htmlFor={`so-edit-${name}`}>{label}</Label>
      <Input id={`so-edit-${name}`} type={type} value={form[name] || ""} onChange={update(name)} />
    </div>
  );
  const notesField = (name: string, label: string) => (
    <div className="space-y-1" key={name}>
      <Label htmlFor={`so-edit-${name}`}>{label}</Label>
      <Textarea id={`so-edit-${name}`} value={form[name] || ""} onChange={update(name)} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !saveMutation.isPending) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Sales Order — {order?.soNumber}</DialogTitle>
        </DialogHeader>
        {isLoading ? <p className="py-6 text-sm text-muted-foreground">Loading saved order details...</p> :
          isError ? <p className="py-6 text-sm text-destructive">Could not load the order. Close this window and try again.</p> :
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (details?.id === order?.id) saveMutation.mutate(); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            {textField("expectedDeliveryDate", "Expected delivery date", "date")}
            {textField("shippingMethod", "Delivery method")}
            {textField("shippingAddress", "Shipping address")}
            {textField("shippingCity", "City")}
            {textField("shippingState", "State / province")}
            {textField("shippingPostalCode", "Postal code")}
            {textField("shippingCountry", "Country")}
            {textField("paymentTermsAdvancePercent", "Advance payment (%)", "number")}
            {textField("paymentTermsCreditDays", "Credit days", "number")}
          </div>
          {notesField("paymentTermsNotes", "Payment terms")}
          {notesField("termsAndConditions", "Terms and conditions")}
          {notesField("customerNotes", "Customer notes")}
          {notesField("internalNotes", "Internal notes")}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saveMutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending || details?.id !== order?.id}>
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  );
}
