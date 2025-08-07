import React, { useState } from "react";
import { Switch, Route, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import type { Product } from "@shared/schema";
import { ChevronLeft, ChevronRight, Heart, Share2, Download, MessageCircle, Phone, Mail, CheckCircle, Truck } from "lucide-react";

function MobileProductPage() {
  const { slug } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/slug/${slug}`],
  });

  const galleryImages = [
    "/api/placeholder/600/400",
    "/api/placeholder/600/400", 
    "/api/placeholder/600/400"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
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

  const TabButton = ({ tabId, label, isActive, onClick }: { tabId: string; label: string; isActive: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
        isActive ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

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
        <div className="relative bg-white rounded-lg overflow-hidden shadow-sm">
          <img 
            src={galleryImages[currentImageIndex]} 
            alt={product.name}
            className="w-full h-64 object-cover"
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm">
              <Heart className="w-4 h-4 text-gray-700" />
            </button>
            <button className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm">
              <Share2 className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          
          {product.botanicalName && (
            <p className="text-lg text-gray-600 italic">{product.botanicalName}</p>
          )}
          
          <p className="text-gray-600">SKU: {product.productId}</p>

          {/* Pricing Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-lg font-semibold text-green-800 mb-2">
              Pricing: Contact for Quote
            </div>
            <div className="text-sm text-green-700 mb-2">
              MOQ: {product.moq || 'Contact for MOQ'}
            </div>
            <div className="flex items-center text-sm text-green-700 mt-2">
              <Truck className="w-4 h-4 mr-2" />
              <span>Free shipping on bulk orders</span>
            </div>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <TabButton tabId="overview" label="Overview" isActive={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
              <TabButton tabId="specs" label="Specifications" isActive={activeTab === "specs"} onClick={() => setActiveTab("specs")} />
              <TabButton tabId="documents" label="Documents" isActive={activeTab === "documents"} onClick={() => setActiveTab("documents")} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <TabButton tabId="applications" label="Applications" isActive={activeTab === "applications"} onClick={() => setActiveTab("applications")} />
              <TabButton tabId="packaging" label="Packaging" isActive={activeTab === "packaging"} onClick={() => setActiveTab("packaging")} />
              <TabButton tabId="faqs" label="FAQs" isActive={activeTab === "faqs"} onClick={() => setActiveTab("faqs")} />
            </div>
          </div>

          <div className="p-4">
            {activeTab === "overview" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Product Overview</h3>
                {product.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-gray-700">{product.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {product.origin && (
                    <div>
                      <h4 className="font-semibold mb-1">Origin</h4>
                      <p className="text-gray-700">{product.origin}</p>
                    </div>
                  )}
                  {product.form && (
                    <div>
                      <h4 className="font-semibold mb-1">Form</h4>
                      <p className="text-gray-700">{product.form}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "specs" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Technical Specifications</h3>
                <div className="space-y-3">
                  {product.physicalAppearance && (
                    <div>
                      <h4 className="font-semibold mb-1">Physical Appearance</h4>
                      <p className="text-gray-700">{product.physicalAppearance}</p>
                    </div>
                  )}
                  {product.moisture && (
                    <div>
                      <h4 className="font-semibold mb-1">Moisture Content</h4>
                      <p className="text-gray-700">{product.moisture}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Documents & Certificates</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <Download className="w-4 h-4 mr-3 text-gray-600" />
                    <span>Certificate of Analysis (COA)</span>
                  </button>
                  <button className="w-full flex items-center justify-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <Download className="w-4 h-4 mr-3 text-gray-600" />
                    <span>Technical Data Sheet</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "applications" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Applications & Uses</h3>
                <div className="space-y-2">
                  <p className="text-gray-700">• Dietary supplements and nutraceuticals</p>
                  <p className="text-gray-700">• Food and beverage industry</p>
                  <p className="text-gray-700">• Cosmetic and personal care products</p>
                </div>
              </div>
            )}

            {activeTab === "packaging" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Packaging Information</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">Standard Packaging</h4>
                    <p className="text-gray-700">25kg multi-wall paper bags</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Bulk Packaging</h4>
                    <p className="text-gray-700">500kg to 1000kg super sacks</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "faqs" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">FAQs</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">What is the minimum order quantity?</h4>
                    <p className="text-gray-700">{product.moq || "Please contact us for MOQ information."}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">What certifications do you provide?</h4>
                    <p className="text-gray-700">We provide organic certificates, COA, and other industry-standard certifications.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Buttons */}
        <div className="space-y-3">
          <button className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            Request Quote
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center">
              <Phone className="w-4 h-4 mr-2" />
              Call Now
            </button>
            <button className="bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-700 flex items-center justify-center">
              <Mail className="w-4 h-4 mr-2" />
              Email Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <h1 className="text-3xl font-bold mb-4">BFI Organic - Mobile Product Page</h1>
      <p className="mb-4">Testing comprehensive mobile-responsive product page.</p>
      <a href="/product/jatamansi-powder" className="text-blue-600 underline text-lg">
        → View Jatamansi Product Page
      </a>
    </div>
  );
}

function AppContent() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/product/:slug" component={MobileProductPage} />
    </Switch>
  );
}

export default function TestApp() {
  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <h1 className="text-3xl font-bold mb-4">BFI Organic - Mobile Product Page Working!</h1>
      <p className="mb-4">React is mounting correctly.</p>
      
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </div>
  );
}