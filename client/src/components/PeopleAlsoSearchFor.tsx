import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import type { Product } from "@shared/schema";

interface PeopleAlsoSearchForProps {
  currentProduct: Product;
}

export default function PeopleAlsoSearchFor({ currentProduct }: PeopleAlsoSearchForProps) {
  // Get products with similar keywords or from related categories
  const { data: searchedProducts } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", { 
      limit: 6,
      excludeId: currentProduct.id,
      // This could be enhanced with actual search analytics
      sortBy: "popular" 
    }],
  });

  if (!searchedProducts?.products?.length) return null;

  const suggestedProducts = searchedProducts.products.slice(0, 6);

  // Generate search terms based on current product
  const getSearchTerms = () => {
    const terms = [];
    
    // Add category-based terms
    if (currentProduct.categoryName) {
      terms.push(currentProduct.categoryName);
    }
    
    // Add form-based terms  
    if (currentProduct.form) {
      terms.push(`${currentProduct.form} products`);
    }
    
    // Add health support terms
    if (currentProduct.healthSupport) {
      terms.push(currentProduct.healthSupport);
    }
    
    // Add origin-based terms
    if (currentProduct.origin) {
      terms.push(`${currentProduct.origin} herbs`);
    }
    
    // Generic related terms
    terms.push("organic herbs", "natural extracts", "herbal supplements");
    
    return terms.slice(0, 8); // Limit to 8 terms
  };

  const searchTerms = getSearchTerms();

  return (
    <div className="space-y-6">
      {/* People Also Search For - Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            People Also Search For
          </CardTitle>
          <p className="text-sm text-gray-600">
            Discover related products our customers frequently explore
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedProducts.map((product) => (
              <Link key={product.id} href={`/product/${product.slug}`}>
                <div className="group border border-gray-200 rounded-lg p-3 hover:border-green-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                      {product.mainImageMedium ? (
                        <img 
                          src={product.mainImageMedium} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 group-hover:text-green-600 text-sm truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-600 truncate">{product.categoryName}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600">Popular</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Popular Search Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            Popular Search Terms
          </CardTitle>
          <p className="text-sm text-gray-600">
            Trending keywords related to this product
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {searchTerms.map((term, index) => (
              <Link key={index} href={`/products?search=${encodeURIComponent(term)}`}>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-green-100 hover:text-green-800 transition-colors"
                >
                  <Search className="w-3 h-3 mr-1" />
                  {term}
                </Badge>
              </Link>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Click on any term to search for related products
          </p>
        </CardContent>
      </Card>
    </div>
  );
}