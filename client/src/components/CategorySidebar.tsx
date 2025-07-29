import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronRight, Menu, X } from "lucide-react";
import type { Category } from "@shared/schema";

interface CategorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategorySidebar({ isOpen, onClose }: CategorySidebarProps) {
  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

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
        fixed top-0 left-0 h-full bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-full sm:w-80 md:w-72 max-w-sm
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-green-600 text-white">
          <h2 className="text-base sm:text-lg font-semibold flex items-center">
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="text-sm sm:text-base">ALL CATEGORIES</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-green-700 p-1 sm:p-2"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4">
            {/* All Products Link */}
            <Link href="/products">
              <div 
                className="flex items-center justify-between p-3 sm:p-4 hover:bg-green-50 rounded-lg cursor-pointer mb-3 bg-green-100 border border-green-200"
                onClick={handleCategoryClick.bind(null, "all")}
              >
                <span className="font-semibold text-green-800 text-sm sm:text-base">All Products</span>
                <ChevronRight className="w-4 h-4 text-green-600" />
              </div>
            </Link>

            {/* Simple Category List */}
            <div className="space-y-1">
              <h3 className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2 px-2">
                Browse by Category
              </h3>
              {categories.map((category) => (
                <Link key={category.id} href={`/products?category=${encodeURIComponent(category.name)}`}>
                  <div 
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border-l-4 border-transparent hover:border-green-500 transition-all duration-200"
                    onClick={handleCategoryClick.bind(null, category.name)}
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 text-sm sm:text-base block">
                        {category.name}
                      </span>
                      {category.description && (
                        <span className="text-xs text-gray-500 mt-1 block truncate">
                          {category.description.substring(0, 50)}...
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Loading State */}
            {categories.length === 0 && (
              <div className="space-y-2 mt-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-10 sm:h-12 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              {categories.length} categories • Organic ingredients
            </p>
            <div className="flex items-center justify-center mt-2 space-x-4">
              <span className="text-xs text-gray-500">✓ Quality Assured</span>
              <span className="text-xs text-gray-500">✓ Lab Tested</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}