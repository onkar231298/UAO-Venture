import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCatalog from "@/components/ProductCatalog";
// Removed unused carousel imports to avoid confusion
import FeaturedCarouselSection from "@/components/FeaturedCarouselSection";
import CategoriesSection from "@/components/CategoriesSection";
import HomeStructuredData from "@/components/HomeStructuredData";
import WebsiteSchema from "@/components/WebsiteSchema";
import CompanyStructuredData from "@/components/CompanyStructuredData";
import SimpleHeroSlider from "@/components/SimpleHeroSlider";
import HomepageAEO from "@/components/HomepageAEO";
import { KnowledgeHubAEO } from "@/components/KnowledgeHubAEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, MessageSquare, FileText, ShoppingCart, BarChart3, Bell, Award, Globe, Users, TrendingUp, Wheat, Leaf } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export default function Home() {
  console.log('🏠 Home component is rendering');
  
  const { user } = useAuth() as { user: any };

  // Show the same homepage for ALL users regardless of login status or role
  return (
    <div className="min-h-screen bg-background">
      <HomeStructuredData />
      <WebsiteSchema />
      <CompanyStructuredData />
      <Header />
      
      {/* Simple Hero Slider with H1 */}
      <SimpleHeroSlider />
      
      {/* Main Heading - Critical for SEO */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Premium Organic Ingredients Supplier - Cape NatureX Organic
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
            Leading B2B supplier of certified organic herbs, spices, extracts, and nutraceuticals for pharmaceutical, supplement, and food industries worldwide.
          </p>
        </div>
      </section>

      {/* Featured Products Section - Positioned between header and about */}
      <FeaturedCarouselSection />
      
      {/* Industry Focus Section for SEO */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Industry-Specific Organic Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Specialized organic ingredients for food manufacturing, pharmaceutical, and European markets
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <a href="/food-ingredients" className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700"><Wheat className="h-6 w-6" aria-hidden="true" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                Food Grade Ingredients
              </h3>
              <p className="text-gray-600 mb-4">
                EU certified organic herbs and spices for food manufacturers. HACCP compliant with complete documentation.
              </p>
              <div className="text-green-600 font-medium group-hover:text-green-700">
                Explore Food Ingredients →
              </div>
            </a>
            
            <a href="/organic-herbs" className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Leaf className="h-6 w-6" aria-hidden="true" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                Premium Organic Herbs
              </h3>
              <p className="text-gray-600 mb-4">
                Medicinal and Ayurvedic herbs for pharmaceutical and nutraceutical industries. Traditional expertise meets modern quality.
              </p>
              <div className="text-green-600 font-medium group-hover:text-green-700">
                Browse Organic Herbs →
              </div>
            </a>
            
            <a href="/eu-organic-spices" className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700"><Globe className="h-6 w-6" aria-hidden="true" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                EU Certified Spices
              </h3>
              <p className="text-gray-600 mb-4">
                European market ready organic spices meeting EU Regulation 834/2007. Direct from India to your facility.
              </p>
              <div className="text-green-600 font-medium group-hover:text-green-700">
                View EU Spices →
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* About Section - White background for contrast */}
      <section className="py-16 section-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Leading the Future of Organic Ingredients
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From farm to formula, we deliver premium organic herbs, extracts, and nutraceuticals 
              that meet the highest quality standards for your business needs.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">1000+</div>
              <div className="text-gray-600">Premium Products</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">50+</div>
              <div className="text-gray-600">Countries Served</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">25+</div>
              <div className="text-gray-600">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">5000+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
          </div>

          {/* Categories Section with Internal Links */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-4">Explore Our Categories</h2>
            <p className="text-center text-gray-600 mb-6 max-w-2xl mx-auto">
              Browse our comprehensive range of <strong>organic ingredients</strong> across multiple categories. 
              Each category features premium quality products sourced globally.
            </p>
            <CategoriesSection />
          </div>
          
          <div className="mb-8">
            <ProductCatalog />
          </div>
        </div>
      </section>
      
      {/* AEO - AI-Optimized FAQ and Company Information */}
      <HomepageAEO />

      {/* AI Knowledge Hub Content */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <KnowledgeHubAEO />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Partner with Us?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied customers who trust Cape NatureX Organics for their ingredient needs
          </p>
          <div className="space-x-4">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-green-600 hover:bg-gray-100"
              onClick={() => window.location.href = '/api/login'}
            >
              Get Started Today
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-green-600"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}