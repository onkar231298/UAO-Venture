import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCatalog from "@/components/ProductCatalog";
import FeaturedProducts from "@/components/FeaturedProducts";
import FeaturedProductsTest from "@/components/FeaturedProductsTest";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel";
import FeaturedProductsSimple from "@/components/FeaturedProductsSimple";
import FeaturedProductsCarouselNew from "@/components/FeaturedProductsCarouselNew";
import StandaloneFeaturedCarousel from "@/components/StandaloneFeaturedCarousel";
import TestCarousel from "@/components/TestCarousel";
import FeaturedProductsCarouselWorking from "@/components/FeaturedProductsCarouselWorking";
import SimpleCarouselTest from "@/components/SimpleCarouselTest";
import FeaturedCarouselSection from "@/components/FeaturedCarouselSection";
import CategoriesSection from "@/components/CategoriesSection";
import HomeStructuredData from "@/components/HomeStructuredData";
import WebsiteSchema from "@/components/WebsiteSchema";
import SitemapGenerator from "@/components/SitemapGenerator";
import SimpleHeroSlider from "@/components/SimpleHeroSlider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, MessageSquare, FileText, ShoppingCart, BarChart3, Bell, Award, Globe, Users, TrendingUp } from "lucide-react";
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
      <SitemapGenerator />
      <Header />
      
      {/* Simple Hero Slider with H1 */}
      <SimpleHeroSlider />
      
      {/* Main Heading - Critical for SEO */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Premium Organic Ingredients Supplier - BFI Organic
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
            Leading B2B supplier of certified organic herbs, spices, extracts, and nutraceuticals for pharmaceutical, supplement, and food industries worldwide.
          </p>
        </div>
      </section>

      {/* Featured Products Section - Positioned between header and about */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Featured Products</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our most popular <strong>organic ingredients</strong> trusted by manufacturers worldwide.
            </p>
          </div>
          <FeaturedCarouselSection />
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
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Partner with Us?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied customers who trust Bright Fame Organics for their ingredient needs
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