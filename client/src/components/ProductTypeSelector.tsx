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
          Select product types and designate one as primary. Primary type shows as badge, secondary types are for filtering only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Explanation */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">How Product Types Work:</p>
              <ul className="text-xs space-y-1 text-blue-700 dark:text-blue-300">
                <li>• <strong>Primary type:</strong> Shows as badge on product cards everywhere</li>
                <li>• <strong>Secondary types:</strong> Used for filtering - product appears in all relevant filters</li>
                <li>• Example: Licorice with Wild Crafted (primary) + Natural (secondary) shows Wild Crafted badge but appears in both filters</li>
              </ul>
            </div>
          </div>
        </div>

        {allTypes.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No product types available. Create some types first.
          </p>
        ) : (
          <div className="space-y-4">
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
                        ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 shadow-sm"
                        : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/50"
                      : "hover:bg-muted/30 border-muted-foreground/10"
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
                        className="font-medium cursor-pointer flex items-center gap-2"
                      >
                        {type.name}
                        {isPrimary && (
                          <Badge variant="default" className="text-xs flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Primary Badge
                          </Badge>
                        )}
                        {isSelected && !isPrimary && (
                          <Badge variant="secondary" className="text-xs">
                            Secondary Filter
                          </Badge>
                        )}
                      </Label>
                      {type.description && (
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected && !isPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrimaryChange(type.id)}
                        disabled={updateTypeMutation.isPending}
                        className="text-xs h-8"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Make Primary
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {selectedTypes.size > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium">Current Type Configuration:</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-green-700 dark:text-green-400">Primary Type (Badge Display)</Label>
                  <div className="min-h-[32px] flex items-center">
                    {currentTypes.filter(t => t.isPrimary).map((type) => (
                      <Badge
                        key={type.id}
                        variant="default"
                        className="flex items-center gap-1"
                      >
                        <Star className="h-3 w-3" />
                        {type.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-amber-700 dark:text-amber-400">Secondary Types (Filter Only)</Label>
                  <div className="min-h-[32px] flex flex-wrap gap-1">
                    {currentTypes.filter(t => !t.isPrimary).map((type) => (
                      <Badge
                        key={type.id}
                        variant="secondary"
                        className="text-xs"
                      >
                        {type.name}
                      </Badge>
                    ))}
                    {currentTypes.filter(t => !t.isPrimary).length === 0 && (
                      <span className="text-xs text-muted-foreground">None selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}