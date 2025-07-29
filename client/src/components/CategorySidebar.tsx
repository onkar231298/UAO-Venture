import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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
      {/* Backdrop for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
      />
      
      {/* Dropdown Sidebar */}
      <div className={`
        absolute top-full left-0 bg-white shadow-lg border border-gray-200 rounded-lg mt-1 z-50 transition-all duration-200 ease-in-out
        ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
        w-64 sm:w-80 max-h-96 overflow-hidden
      `}>
        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700">
            By Category
          </h3>
        </div>

        {/* Categories List */}
        <div className="max-h-80 overflow-y-auto">
          <div className="py-1">
            {categories.map((category) => (
              <Link key={category.id} href={`/products?category=${encodeURIComponent(category.name)}`}>
                <div 
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 hover:text-gray-900 text-sm transition-colors"
                  onClick={handleCategoryClick.bind(null, category.name)}
                >
                  {category.name}
                </div>
              </Link>
            ))}
          </div>

          {/* Loading State */}
          {categories.length === 0 && (
            <div className="py-1">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-pulse px-3 py-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}