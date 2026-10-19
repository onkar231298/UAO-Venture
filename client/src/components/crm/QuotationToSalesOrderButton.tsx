import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QuotationToSalesOrderButtonProps {
  quotationId: number;
  quotationNumber: string;
  className?: string;
  onConverted?: () => void;
}

export default function QuotationToSalesOrderButton({
  quotationId,
  quotationNumber,
  className,
  onConverted,
}: QuotationToSalesOrderButtonProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const convertMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/sales-orders/convert-from-quotation", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotationId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Could not convert this quotation");
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
        title: "Could not convert quotation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
        disabled={convertMutation.isPending}
        title="Use after the customer has confirmed, including by email or another channel."
        data-testid={`button-convert-quotation-to-sales-order-${quotationId}`}
      >
        <ShoppingCart className="mr-1 h-4 w-4" />
        Convert to Sales Order
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!convertMutation.isPending) setOpen(nextOpen);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert this quotation to a Sales Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This creates a draft Sales Order from <strong>{quotationNumber}</strong> and links it to the quotation.
              Continue only after the customer has confirmed, either in the dashboard or through email or another channel.
              A quotation can be converted only once.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={convertMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                convertMutation.mutate();
              }}
              disabled={convertMutation.isPending}
              data-testid={`button-confirm-convert-quotation-to-sales-order-${quotationId}`}
            >
              {convertMutation.isPending ? "Converting..." : "Create Sales Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
