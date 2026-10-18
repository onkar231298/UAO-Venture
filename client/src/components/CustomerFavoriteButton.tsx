import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface CustomerFavoriteButtonProps {
  productId: number;
  productName: string;
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
}

export default function CustomerFavoriteButton({
  productId,
  productName,
  className,
  iconClassName = "h-4 w-4",
  showLabel = false,
}: CustomerFavoriteButtonProps) {
  const { customer } = useCustomerAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const savedProductsKey = `/api/customer/saved-products/${customer?.id}`;
  const { data: savedProducts = [] } = useQuery<any[]>({
    queryKey: [savedProductsKey],
    enabled: !!customer?.id,
  });
  const isSaved = savedProducts.some((product) => product.id === productId);

  const saveMutation = useMutation({
    mutationFn: async (shouldSave: boolean) => {
      if (!customer?.id) throw new Error("Sign in to save products");
      const response = await fetch(
        `/api/customer/saved-products/${customer.id}/${productId}`,
        { method: shouldSave ? "POST" : "DELETE", credentials: "include" },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "Could not update saved products");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [savedProductsKey] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/saved-products"] });
      toast({
        title: isSaved ? "Removed from saved products" : "Product saved",
        description: productName,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not update saved products",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className={className}
      aria-label={`${isSaved ? "Remove" : "Save"} ${productName} ${isSaved ? "from" : "to"} saved products`}
      aria-pressed={isSaved}
      title={isSaved ? "Remove from saved products" : "Save product"}
      disabled={saveMutation.isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!customer?.id) {
          setLocation("/login");
          return;
        }
        saveMutation.mutate(!isSaved);
      }}
    >
      <Heart className={`${iconClassName} ${isSaved ? "fill-current text-red-500" : ""}`} />
      {showLabel && <span className="ml-2">{isSaved ? "Saved" : "Wishlist"}</span>}
    </Button>
  );
}
