import { useState, useEffect } from "react";
import { Switch, Route, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import type { Product } from "@shared/schema";

function MobileProductPage() {
  const { slug } = useParams();

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/slug/${slug}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="text-sm text-gray-600">
          Products → <span className="text-gray-900">{product.name}</span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Product Image */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="h-64 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Product Image</span>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          
          {product.botanicalName && (
            <p className="text-lg text-gray-600 italic">{product.botanicalName}</p>
          )}
          
          <p className="text-gray-600">SKU: {product.productId}</p>

          {product.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{product.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4">
            {product.origin && (
              <div>
                <span className="font-semibold">Origin:</span>
                <p className="text-gray-700">{product.origin}</p>
              </div>
            )}
            {product.form && (
              <div>
                <span className="font-semibold">Form:</span>
                <p className="text-gray-700">{product.form}</p>
              </div>
            )}
            {product.shelfLife && (
              <div>
                <span className="font-semibold">Shelf Life:</span>
                <p className="text-gray-700">{product.shelfLife}</p>
              </div>
            )}
            {product.moq && (
              <div>
                <span className="font-semibold">MOQ:</span>
                <p className="text-gray-700">{product.moq}</p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Get a Quote</h3>
          <p className="text-green-700 mb-4">Contact us for pricing and availability information.</p>
          <button className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700">
            Request Quote
          </button>
        </div>

        {/* Contact Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700">
            📞 Call Now
          </button>
          <button className="bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-700">
            ✉️ Email Us
          </button>
        </div>
      </div>
    </div>
  );
}

function MinimalHomePage() {
  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <h1 className="text-3xl font-bold">BFI Organic - Mobile Test</h1>
      <p className="mb-4">Testing mobile-responsive product page.</p>
      <a href="/product/jatamansi-powder" className="text-blue-600 underline">
        Go to Jatamansi Product Page
      </a>
    </div>
  );
}

function AppContent() {
  return (
    <Switch>
      <Route path="/" component={MinimalHomePage} />
      <Route path="/product/:slug" component={MobileProductPage} />
    </Switch>
  );
}

export default function MinimalApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}