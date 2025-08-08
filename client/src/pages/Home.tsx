import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
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
import HomeStructuredData from "@/components/HomeStructuredData";
import Dashboard from "@/pages/Dashboard";
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

  // Allow admin users to view homepage - removed automatic redirect

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // For customers, show product catalog
  if (user?.role === 'customer') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Simple Hero Slider for customers */}
        <SimpleHeroSlider />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.firstName || 'Valued Customer'}!
            </h1>
            <p className="text-gray-600">
              Discover our premium organic ingredients and manage your orders
            </p>
          </div>

          {/* Customer Quick Actions */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">My Inquiries</h3>
                <p className="text-sm text-gray-600 mb-3">Track your product inquiries</p>
                <Button size="sm" variant="outline">View</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Quotations</h3>
                <p className="text-sm text-gray-600 mb-3">View your price quotes</p>
                <Button size="sm" variant="outline">View</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <ShoppingCart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Orders</h3>
                <p className="text-sm text-gray-600 mb-3">Track your orders</p>
                <Button size="sm" variant="outline">View</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Documents</h3>
                <p className="text-sm text-gray-600 mb-3">Download COAs & certificates</p>
                <Button size="sm" variant="outline">View</Button>
              </CardContent>
            </Card>
          </div>

          {/* Featured Products for Customers */}
          <div className="mb-8">
            <div style={{ padding: '10px', background: 'lightblue', textAlign: 'center' }}>
              🔵 CUSTOMER CAROUSEL TEST MARKER
            </div>
            <FeaturedProductsCarouselWorking />
          </div>
          
          <ProductCatalog />
        </div>
      </div>
    );
  }

  // For non-authenticated users, show public landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <HomeStructuredData />
        <Header />
        
        {/* Simple Hero Slider */}
        <SimpleHeroSlider />
        
        {/* About Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Leading the Future of Organic Ingredients
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From farm to formula, we deliver premium organic herbs, extracts, and nutraceuticals 
                that meet the highest global standards for food, pharma, and wellness industries.
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Certified Quality</h3>
                <p className="text-gray-600">USDA Organic, EU Organic, and other international certifications</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Global Reach</h3>
                <p className="text-gray-600">Serving customers in over 50 countries worldwide</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Trusted Partner</h3>
                <p className="text-gray-600">Preferred supplier for leading brands and manufacturers</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Innovation Driven</h3>
                <p className="text-gray-600">State-of-the-art R&D facilities and continuous innovation</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Featured Products Carousel */}
        <FeaturedCarouselSection />
        
        {/* Browse by Category */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
              <p className="text-lg text-gray-600">Explore our complete range of organic ingredients</p>
            </div>
            <ProductCatalog />
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
      </div>
    );
  }

  // For internal users, show role-based dashboard
  return <Dashboard />;
}
