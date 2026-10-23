import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ManualSalesOrderForm from "@/components/crm/ManualSalesOrderForm";
import type { ManualSalesOrder } from "../../../../shared/salesOrderContract";

interface QuotationToSalesOrderButtonProps {
  quotationId: number;
  quotationNumber: string;
  className?: string;
  disabled?: boolean;
  disabledReason?: string;
  onConverted?: () => void;
}

export default function QuotationToSalesOrderButton({
  quotationId,
  quotationNumber,
  className,
  disabled = false,
  disabledReason,
  onConverted,
}: QuotationToSalesOrderButtonProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const convertMutation = useMutation({
    mutationFn: async (manualOrder: ManualSalesOrder) => {
      const response = await fetch("/api/sales-orders/convert-from-quotation", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotationId, manualOrder }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Could not create this Sales Order");
      }
      return result as { soNumber?: string };
    },
    onSuccess: (salesOrder) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-metrics"] });
      setOpen(false);
      toast({
        title: "Sales Order created",
        description: `${salesOrder.soNumber || "Draft order"} was created from ${quotationNumber}.`,
      });
      onConverted?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Could not create Sales Order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <span
        className="inline-flex"
        title={disabled ? (disabledReason || "Record customer acceptance before creating a Sales Order.") : undefined}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={className}
          onClick={() => setOpen(true)}
          disabled={disabled || convertMutation.isPending}
          title={disabled ? undefined : "Create a Sales Order only after customer acceptance has been recorded."}
          data-testid={`button-convert-quotation-to-sales-order-${quotationId}`}
        >
          <ShoppingCart className="mr-1 h-4 w-4" />
          Create SO
        </Button>
      </span>
      <ManualSalesOrderForm
        open={open}
        quotationNumber={quotationNumber}
        pending={convertMutation.isPending}
        onOpenChange={setOpen}
        onSubmit={(order) => convertMutation.mutate(order)}
      />
    </>
  );
}
