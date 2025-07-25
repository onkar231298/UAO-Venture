import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "./ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Grid, List } from "lucide-react";
import type { Product, Category } from "@shared/schema";

interface ProductCatalogProps {
  showHeader?: boolean;
  limit?: number;
}

export default function ProductCatalog({ showHeader = true, limit }: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [organicFilter, setOrganicFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = limit || 12;

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: productsData, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", {
      search: searchQuery || undefined,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      isOrganic: organicFilter === 'true' ? true : organicFilter === 'false' ? false : undefined,
      limit: productsPerPage,
      offset: (currentPage - 1) * productsPerPage,
    }],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const totalPages = productsData ? Math.ceil(productsData.total / productsPerPage) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {showHeader && (
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Product Catalog</h2>
          <p className="text-sm sm:text-base text-gray-600">Discover our premium organic ingredients</p>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative sm:col-span-2 lg:col-span-1">
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 text-sm sm:text-base"
              />
              <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            </form>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value);
              handleFilterChange();
            }}>
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category: Category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Organic Filter */}
            <Select value={organicFilter} onValueChange={(value) => {
              setOrganicFilter(value);
              handleFilterChange();
            }}>
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="true">Organic Only</SelectItem>
                <SelectItem value="false">Conventional Only</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="text-xs sm:text-sm"
              >
                <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1">Grid</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="text-xs sm:text-sm"
              >
                <List className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1">List</span>
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Search: {searchQuery}</span>
                <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
            {selectedCategory && selectedCategory !== 'all' && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Category: {categories?.find((c: Category) => c.id.toString() === selectedCategory)?.name}</span>
                <button onClick={() => setSelectedCategory("all")} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
            {organicFilter && organicFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>{organicFilter === 'true' ? 'Organic Only' : 'Conventional Only'}</span>
                <button onClick={() => setOrganicFilter("all")} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {productsData && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((currentPage - 1) * productsPerPage) + 1} to {Math.min(currentPage * productsPerPage, productsData.total)} of {productsData.total} products
          </p>
        </div>
      )}

      {/* Products Grid/List */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" : "space-y-3 sm:space-y-4"}>
          {Array.from({ length: productsPerPage }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <Skeleton className="h-36 sm:h-40 md:h-48 w-full rounded-t-xl" />
              <CardContent className="p-3 sm:p-4">
                <Skeleton className="h-3 sm:h-4 w-3/4 mb-2" />
                <Skeleton className="h-2 sm:h-3 w-1/2 mb-3 sm:mb-4" />
                <Skeleton className="h-8 sm:h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : productsData?.products?.length ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" : "space-y-3 sm:space-y-4"}>
          {productsData.products.map((product: Product) => (
            viewMode === 'grid' ? (
              <ProductCard key={product.id} product={product} />
            ) : (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    {(product.images as string[] | null)?.[0] ? (
                      <img
                        src={(product.images as string[])[0]}
                        alt={product.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`${(product.images as string[] | null)?.[0] ? 'hidden' : 'flex'} w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg items-center justify-center`}>
                      <span className="text-gray-400 text-xs">📷</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1">{product.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">SKU: {product.productId}</p>
                      {product.botanicalName && (
                        <p className="text-xs text-gray-500 italic line-clamp-1">{product.botanicalName}</p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
                      {product.isOrganic && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Organic</Badge>
                      )}
                      <Button size="sm" className="text-xs">Get Quote</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse our categories
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
                setOrganicFilter("");
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            );
          })}
          
          {totalPages > 5 && (
            <>
              <span className="text-gray-500">...</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
