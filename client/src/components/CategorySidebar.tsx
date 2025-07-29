import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import type { Category } from "@shared/schema";

interface CategorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategorySidebar({ isOpen, onClose }: CategorySidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryClick = (categoryName: string) => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white z-50 shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-80 lg:w-72
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-green-600 text-white">
          <h2 className="text-lg font-semibold flex items-center">
            <Menu className="w-5 h-5 mr-2" />
            ALL CATEGORIES
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-green-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Categories List */}
        <div className="flex-1 h-full overflow-y-auto">
          <div className="p-4">
            {/* All Products Link */}
            <Link href="/products">
              <div 
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer mb-2 border border-gray-200"
                onClick={handleCategoryClick.bind(null, "all")}
              >
                <span className="font-medium text-gray-900">All Products</span>
                <span className="text-sm text-gray-500">View All</span>
              </div>
            </Link>

            {/* Category Groups */}
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <Collapsible
                    open={expandedCategories.includes(category.id)}
                    onOpenChange={() => toggleCategory(category.id)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          {category.imageUrl && (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="w-8 h-8 rounded-md object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="font-medium text-gray-900 text-left">
                            {category.name}
                          </span>
                        </div>
                        {expandedCategories.includes(category.id) ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="bg-gray-50 p-3 border-t border-gray-200">
                        {/* Category Description */}
                        {category.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {category.description}
                          </p>
                        )}
                        
                        {/* View Category Link */}
                        <Link href={`/products?category=${encodeURIComponent(category.name)}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-green-600 border-green-600 hover:bg-green-50"
                            onClick={handleCategoryClick.bind(null, category.name)}
                          >
                            View {category.name} Products
                          </Button>
                        </Link>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>

            {/* Loading State */}
            {categories.length === 0 && (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-12 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Browse our complete range of organic ingredients
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {categories.length} categories available
            </p>
          </div>
        </div>
      </div>
    </>
  );
}