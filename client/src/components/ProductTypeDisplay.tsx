import { Badge } from "@/components/ui/badge";
import { Leaf, Circle, TreePine } from "lucide-react";
import type { ProductType } from "@shared/schema";

interface ProductTypeDisplayProps {
  types: (ProductType & { isPrimary?: boolean })[];
  showPrimaryOnly?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  appearance?: "default" | "catalog";
}

const typeIcons: Record<string, any> = {
  leaf: Leaf,
  circle: Circle,
  "tree-pine": TreePine,
};

export function ProductTypeDisplay({ 
  types, 
  showPrimaryOnly = false, 
  className = "",
  size = "sm",
  appearance = "default"
}: ProductTypeDisplayProps) {
  if (!types || types.length === 0) return null;

  const displayTypes = showPrimaryOnly 
    ? types.filter(type => type.isPrimary)
    : types;

  if (displayTypes.length === 0) return null;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayTypes.map((type, index) => {
        const IconComponent = typeIcons[type.icon || "leaf"];
        const isPrimary = type.isPrimary;
        
        return (
          <Badge
            key={`${type.id}-${index}`}
            variant={isPrimary ? "default" : "secondary"}
            className={`${sizeClasses[size]} flex items-center gap-1 ${isPrimary ? 'bg-green-600 hover:bg-green-700' : ''} ${appearance === "catalog" ? "catalog-type-badge" : ""}`}
            style={{
              backgroundColor: isPrimary && type.color ? type.color : undefined,
            }}
          >
            {IconComponent && (
              <IconComponent className={iconSizes[size]} />
            )}
            {type.name}
          </Badge>
        );
      })}
    </div>
  );
}

// Simplified version for just displaying the primary type
export function PrimaryProductType({ 
  types, 
  className = "",
  size = "sm",
  appearance = "default"
}: Pick<ProductTypeDisplayProps, 'types' | 'className' | 'size' | 'appearance'>) {
  return (
    <ProductTypeDisplay 
      types={types} 
      showPrimaryOnly={true} 
      className={className}
      size={size}
      appearance={appearance}
    />
  );
}

// Hook to get product types for a specific product
export function useProductTypes(productId: number) {
  // This would be used in components that need to fetch product types
  // For now, return empty array as placeholder
  return { types: [], isLoading: false };
}