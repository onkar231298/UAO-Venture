import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import Header from "@/components/Header";

export default function SimpleProductDetail() {
  const { slug } = useParams();

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/slug/${slug}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading product...</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Product not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          
          {product.botanicalName && (
            <p className="text-lg text-gray-600 italic mb-4">{product.botanicalName}</p>
          )}
          
          <p className="text-gray-600 mb-6">SKU: {product.productId}</p>

          {product.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{product.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {product.origin && (
              <div>
                <strong>Origin:</strong> {product.origin}
              </div>
            )}
            {product.form && (
              <div>
                <strong>Form:</strong> {product.form}
              </div>
            )}
            {product.shelfLife && (
              <div>
                <strong>Shelf Life:</strong> {product.shelfLife}
              </div>
            )}
            {product.moq && (
              <div>
                <strong>MOQ:</strong> {product.moq}
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Get a Quote</h3>
            <p className="text-green-700">Contact us for pricing and availability information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}