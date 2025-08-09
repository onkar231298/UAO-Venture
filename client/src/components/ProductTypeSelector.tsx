import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ProductType } from "@shared/schema";
import { CheckCircle, Circle, Star } from "lucide-react";

interface ProductTypeSelectorProps {
  productId: number;
  onTypesUpdate?: (types: (ProductType & { isPrimary: boolean })[]) => void;
}

export function ProductTypeSelector({ productId, onTypesUpdate }: ProductTypeSelectorProps) {
  const queryClient = useQueryClient();
  const [selectedTypes, setSelectedTypes] = useState<Set<number>>(new Set());
  const [primaryType, setPrimaryType] = useState<number | null>(null);

  // Fetch all available product types
  const { data: allTypes = [] } = useQuery<ProductType[]>({
    queryKey: ["/api/product-types"],
  });

  // Fetch current product types for this product
  const { data: currentTypes = [], isLoading } = useQuery<(ProductType & { isPrimary: boolean })[]>({
    queryKey: ["/api/products", productId, "types"],
    enabled: !!productId,
  });

  // Update local state when currentTypes changes
  useEffect(() => {
    if (currentTypes.length > 0) {
      const typeIds = new Set(currentTypes.map(t => t.id));
      const primary = currentTypes.find(t => t.isPrimary)?.id || null;
      setSelectedTypes(typeIds);
      setPrimaryType(primary);
    }
  }, [currentTypes]);

  // Add product to type
  const addToTypeMutation = useMutation({
    mutationFn: ({ typeId, isPrimary }: { typeId: number; isPrimary: boolean }) =>
      apiRequest(`/api/products/${productId}/types`, {
        method: "POST",
        body: JSON.stringify({ typeId, isPrimary }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "types"] });
    },
  });

  // Remove product from type
  const removeFromTypeMutation = useMutation({
    mutationFn: (typeId: number) =>
      apiRequest(`/api/products/${productId}/types/${typeId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "types"] });
    },
  });

  // Update type relationship (change primary status)
  const updateTypeMutation = useMutation({
    mutationFn: ({ typeId, isPrimary }: { typeId: number; isPrimary: boolean }) =>
      apiRequest(`/api/products/${productId}/types/${typeId}`, {
        method: "PUT",
        body: JSON.stringify({ isPrimary }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "types"] });
    },
  });

  const handleTypeToggle = (typeId: number, checked: boolean) => {
    if (checked) {
      // Add type to product
      const isPrimary = selectedTypes.size === 0; // First type becomes primary
      addToTypeMutation.mutate({ typeId, isPrimary });
      setSelectedTypes(prev => new Set(Array.from(prev).concat(typeId)));
      if (isPrimary) {
        setPrimaryType(typeId);
      }
    } else {
      // Remove type from product
      removeFromTypeMutation.mutate(typeId);
      setSelectedTypes(prev => {
        const newSet = new Set(prev);
        newSet.delete(typeId);
        return newSet;
      });
      if (primaryType === typeId) {
        setPrimaryType(null);
      }
    }
  };

  const handlePrimaryChange = (typeId: number) => {
    if (primaryType === typeId) return; // Already primary

    // Update the previous primary type to non-primary
    if (primaryType) {
      updateTypeMutation.mutate({ typeId: primaryType, isPrimary: false });
    }

    // Set new primary type
    updateTypeMutation.mutate({ typeId, isPrimary: true });
    setPrimaryType(typeId);
  };

  // Notify parent component of changes
  useEffect(() => {
    if (onTypesUpdate && currentTypes.length > 0) {
      onTypesUpdate(currentTypes);
    }
  }, [currentTypes, onTypesUpdate]);

  if (isLoading) {
    return <div className="text-center p-4">Loading product types...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Product Types
        </CardTitle>
        <CardDescription>
          Select the types that apply to this product. One type can be set as primary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {allTypes.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No product types available. Create some types first.
          </p>
        ) : (
          <div className="space-y-3">
            {allTypes.map((type) => {
              const isSelected = selectedTypes.has(type.id);
              const isPrimary = primaryType === type.id;

              return (
                <div
                  key={type.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? isPrimary
                        ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                        : "bg-muted/50 border-muted-foreground/20"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`type-${type.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        handleTypeToggle(type.id, checked as boolean)
                      }
                      disabled={addToTypeMutation.isPending || removeFromTypeMutation.isPending}
                    />
                    <div>
                      <Label
                        htmlFor={`type-${type.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {type.name}
                      </Label>
                      {type.description && (
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPrimary && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Primary
                      </Badge>
                    )}
                    {isSelected && !isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrimaryChange(type.id)}
                        disabled={updateTypeMutation.isPending}
                        className="text-xs"
                      >
                        Set as Primary
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedTypes.size > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Selected Types:</Label>
              <div className="flex flex-wrap gap-2">
                {currentTypes.map((type) => (
                  <Badge
                    key={type.id}
                    variant={type.isPrimary ? "default" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {type.isPrimary && <Star className="h-3 w-3" />}
                    {type.name}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}