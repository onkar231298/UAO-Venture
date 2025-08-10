import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Heart, X } from "lucide-react";

interface HealthSupport {
  id: number;
  name: string;
  slug: string;
  productCount?: number;
}

interface HealthSupportSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlug?: string;
}

export default function HealthSupportSidebar({ isOpen, onClose, currentSlug }: HealthSupportSidebarProps) {
  // Fetch health supports
  const { data: healthSupports = [] } = useQuery<HealthSupport[]>({
    queryKey: ["/api/health-supports"],
    queryFn: async () => {
      const response = await fetch("/api/health-supports");
      if (!response.ok) throw new Error('Failed to fetch health supports');
      return response.json();
    },
  });

  const handleHealthSupportClick = (healthSupportSlug: string) => {
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
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Heart className="w-4 h-4 text-green-600" />
            Health Support Categories
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Health Supports List */}
        <div className="max-h-80 overflow-y-auto">
          <div className="py-1">
            {healthSupports.map((healthSupport) => (
              <Link key={healthSupport.id} href={`/health-support/${healthSupport.slug}`}>
                <div 
                  className={`px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm transition-colors flex items-center justify-between ${
                    currentSlug === healthSupport.slug 
                      ? 'bg-green-50 text-green-700 border-r-2 border-green-500' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                  onClick={() => handleHealthSupportClick(healthSupport.slug)}
                >
                  <span className="flex-1">{healthSupport.name}</span>
                  {healthSupport.productCount !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {healthSupport.productCount}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Loading State */}
          {healthSupports.length === 0 && (
            <div className="py-1">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-pulse px-3 py-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
          <Link href="/health-support">
            <button 
              className="text-xs text-green-600 hover:text-green-700 font-medium"
              onClick={onClose}
            >
              View All Health Support Categories →
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}