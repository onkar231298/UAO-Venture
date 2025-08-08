import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ChevronRight } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string | null;
  isActive: boolean;
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch('/api/categories')
      .then(response => response.json())
      .then(data => {
        // Filter only active categories
        const activeCategories = data.filter((cat: Category) => cat.isActive);
        setCategories(activeCategories);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
        setLoading(false);
      });
  }, []);

  const handleCategoryClick = (slug: string) => {
    navigate(`/products?category=${slug}`);
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-lg h-40 sm:h-48 animate-pulse shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
        {categories.map((category) => (
          <Card 
            key={category.id}
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105"
            onClick={() => handleCategoryClick(category.slug)}
          >
            <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-br from-green-50 to-emerald-50">
              {category.imageUrl ? (
                <OptimizedImage
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
                  lazy={true}
                  placeholder={
                    <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 text-green-400 animate-pulse">
                      <div className="text-center">
                        <Package className="w-8 h-8 mx-auto mb-2" />
                        <div className="text-xs font-medium">Loading...</div>
                      </div>
                    </div>
                  }
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 text-green-500">
                  <div className="text-center">
                    <Package className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2" />
                    <div className="text-xs sm:text-sm font-medium text-green-600">Category</div>
                  </div>
                </div>
              )}
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <ChevronRight className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </div>

            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 group-hover:text-green-600 transition-colors">
                  {category.name}
                </h3>

                {category.description && (
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                    {category.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                    Active
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {categories.length > 0 && (
        <div className="text-center mt-8 sm:mt-12">
          <button 
            className="border-2 border-green-600 text-green-600 bg-transparent hover:bg-green-50 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
            onClick={() => navigate('/products')}
          >
            Browse All Products →
          </button>
        </div>
      )}
    </div>
  );
}