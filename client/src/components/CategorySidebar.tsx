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
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white z-50 shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64 sm:w-72
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            By Category
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto">
          <div className="py-2">
            {categories.map((category) => (
              <Link key={category.id} href={`/products?category=${encodeURIComponent(category.name)}`}>
                <div 
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700 hover:text-gray-900 text-sm border-l-4 border-transparent hover:border-green-500 transition-colors"
                  onClick={handleCategoryClick.bind(null, category.name)}
                >
                  {category.name}
                </div>
              </Link>
            ))}
          </div>

          {/* Loading State */}
          {categories.length === 0 && (
            <div className="py-2">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="animate-pulse px-4 py-2">
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