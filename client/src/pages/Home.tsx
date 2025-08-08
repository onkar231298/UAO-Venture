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

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user && ((user as any).role === 'admin' || (user as any).role === 'super_admin')) {
      console.log('Home: Redirecting admin user to admin dashboard');
      window.location.replace('/#/admin/dashboard');
      return;
    }
  }, [user]);

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
        <section className="py-16" style={{background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)"}}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover our premium selection of organic ingredients, carefully sourced and quality-tested for your business needs.
              </p>
            </div>
            
            <div className="relative max-w-6xl mx-auto">
              {/* Navigation Arrows */}
              <button 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white border-2 border-green-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-green-50 transition-colors z-10"
                onClick={() => console.log('⬅️ Previous clicked')}
              >
                ←
              </button>
              <button 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white border-2 border-green-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-green-50 transition-colors z-10"
                onClick={() => console.log('➡️ Next clicked')}
              >
                →
              </button>
              
              {/* Carousel Container */}
              <div className="overflow-hidden rounded-lg">
                <div className="flex transition-transform duration-300 ease-in-out gap-6">
                  {/* Product Card 1 */}
                  <div className="flex-none w-1/4 bg-white rounded-lg shadow-md overflow-hidden h-96 cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center relative">
                      <div className="text-4xl font-bold text-green-600">T</div>
                      <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                        BFI001
                      </div>
                    </div>
                    <div className="p-4 flex flex-col h-48">
                      <h3 className="font-semibold text-gray-900 mb-2">Turmeric Powder</h3>
                      <p className="text-sm text-gray-600 mb-2">Origin: India</p>
                      <p className="text-sm text-gray-600 mb-4 flex-1">Premium quality turmeric powder with high curcumin content</p>
                      <div className="flex justify-between items-center mt-auto">
                        <div>
                          <span className="text-lg font-bold text-green-600">$12.50</span>
                          <span className="text-sm text-gray-500">/kg</span>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">MOQ: 100kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Product Card 2 */}
                  <div className="flex-none w-1/4 bg-white rounded-lg shadow-md overflow-hidden h-96 cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center relative">
                      <div className="text-4xl font-bold text-green-600">G</div>
                      <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                        BFI002
                      </div>
                    </div>
                    <div className="p-4 flex flex-col h-48">
                      <h3 className="font-semibold text-gray-900 mb-2">Ginger Powder</h3>
                      <p className="text-sm text-gray-600 mb-2">Origin: India</p>
                      <p className="text-sm text-gray-600 mb-4 flex-1">Premium quality organic ginger powder</p>
                      <div className="flex justify-between items-center mt-auto">
                        <div>
                          <span className="text-lg font-bold text-green-600">$15.00</span>
                          <span className="text-sm text-gray-500">/kg</span>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">MOQ: 50kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Product Card 3 */}
                  <div className="flex-none w-1/4 bg-white rounded-lg shadow-md overflow-hidden h-96 cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center relative">
                      <div className="text-4xl font-bold text-green-600">C</div>
                      <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                        BFI003
                      </div>
                    </div>
                    <div className="p-4 flex flex-col h-48">
                      <h3 className="font-semibold text-gray-900 mb-2">Cinnamon Bark</h3>
                      <p className="text-sm text-gray-600 mb-2">Origin: Sri Lanka</p>
                      <p className="text-sm text-gray-600 mb-4 flex-1">Premium Ceylon cinnamon bark powder</p>
                      <div className="flex justify-between items-center mt-auto">
                        <div>
                          <span className="text-lg font-bold text-green-600">$28.50</span>
                          <span className="text-sm text-gray-500">/kg</span>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">MOQ: 25kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Product Card 4 */}
                  <div className="flex-none w-1/4 bg-white rounded-lg shadow-md overflow-hidden h-96 cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center relative">
                      <div className="text-4xl font-bold text-green-600">A</div>
                      <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                        BFI004
                      </div>
                    </div>
                    <div className="p-4 flex flex-col h-48">
                      <h3 className="font-semibold text-gray-900 mb-2">Ashwagandha Extract</h3>
                      <p className="text-sm text-gray-600 mb-2">Origin: India</p>
                      <p className="text-sm text-gray-600 mb-4 flex-1">Premium adaptogenic herb extract</p>
                      <div className="flex justify-between items-center mt-auto">
                        <div>
                          <span className="text-lg font-bold text-green-600">$45.00</span>
                          <span className="text-sm text-gray-500">/kg</span>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">MOQ: 10kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <button 
                className="border-2 border-green-600 text-green-600 bg-transparent hover:bg-green-50 px-6 py-3 rounded-lg font-medium transition-colors"
                onClick={() => window.location.href = '/products'}
              >
                View All Products →
              </button>
            </div>
          </div>
        </section>
        
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
