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
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Featured Products</h3>
            <div id="customer-featured-carousel" className="relative">
              <div className="overflow-hidden rounded-lg">
                <div id="customer-featured-track" className="flex transition-transform duration-300">
                  {/* Products loaded via script */}
                </div>
              </div>
              <button id="customer-prev" className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center shadow">←</button>
              <button id="customer-next" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center shadow">→</button>
            </div>
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
        <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover our premium selection of organic ingredients, carefully sourced and quality-tested for your business needs.
              </p>
            </div>
            
            <div className="relative max-w-6xl mx-auto">
              {/* Carousel Container */}
              <div id="featured-products-carousel" className="overflow-hidden rounded-lg">
                <div id="featured-products-track" className="flex transition-transform duration-300 ease-in-out">
                  {/* Products will be loaded here via JavaScript */}
                </div>
              </div>
              
              {/* Navigation Arrows */}
              <button 
                id="prev-btn" 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white border-2 border-green-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-green-50 transition-colors z-10"
              >
                ←
              </button>
              <button 
                id="next-btn" 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white border-2 border-green-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-green-50 transition-colors z-10"
              >
                →
              </button>
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

        <script dangerouslySetInnerHTML={{
          __html: `
            console.log('🚀 Featured Products Carousel Script Loading...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', initCarousel);
            } else {
              initCarousel();
            }
            
            function initCarousel() {
              console.log('🎯 Initializing Featured Products Carousel...');
              
              // Fetch featured products
              fetch('/api/products/featured?limit=8')
                .then(response => {
                  console.log('📡 API Response Status:', response.status);
                  return response.json();
                })
                .then(products => {
                  console.log('✅ Featured Products Loaded:', products.length, 'items');
                  renderProducts(products);
                  setupNavigation(products);
                })
                .catch(error => {
                  console.error('❌ Error loading featured products:', error);
                });
            }
            
            function renderProducts(products) {
              const track = document.getElementById('featured-products-track');
              if (!track) return;
              
              track.innerHTML = products.map(product => \`
                <div class="flex-none w-1/4 px-3">
                  <div class="bg-white rounded-lg shadow-md overflow-hidden h-96 cursor-pointer hover:shadow-lg transition-shadow" onclick="window.location.href='/product/\${product.slug}'">
                    <div class="h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center relative">
                      \${product.mainImage ? 
                        \`<img src="\${product.mainImage}" alt="\${product.name}" class="w-full h-full object-cover">\` :
                        \`<div class="text-4xl font-bold text-green-600">\${product.name.charAt(0)}</div>\`
                      }
                      <div class="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                        \${product.productId}
                      </div>
                    </div>
                    <div class="p-4 flex flex-col h-48">
                      <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">\${product.name}</h3>
                      \${product.origin ? \`<p class="text-sm text-gray-600 mb-2">Origin: \${product.origin}</p>\` : ''}
                      \${product.description ? \`<p class="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">\${product.description}</p>\` : ''}
                      <div class="flex justify-between items-center mt-auto">
                        <div>
                          <span class="text-lg font-bold text-green-600">$\${product.priceUSD}</span>
                          <span class="text-sm text-gray-500">/kg</span>
                        </div>
                        \${product.moq ? \`<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">MOQ: \${product.moq}kg</span>\` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              \`).join('');
            }
            
            let currentIndex = 0;
            
            function setupNavigation(products) {
              const prevBtn = document.getElementById('prev-btn');
              const nextBtn = document.getElementById('next-btn');
              const track = document.getElementById('featured-products-track');
              
              if (!prevBtn || !nextBtn || !track) return;
              
              function updateCarousel() {
                const translateX = -currentIndex * 25;
                track.style.transform = \`translateX(\${translateX}%)\`;
                
                prevBtn.style.display = currentIndex > 0 ? 'flex' : 'none';
                nextBtn.style.display = currentIndex < products.length - 4 ? 'flex' : 'none';
              }
              
              prevBtn.addEventListener('click', () => {
                if (currentIndex > 0) {
                  currentIndex--;
                  console.log('⬅️ Moving to slide:', currentIndex);
                  updateCarousel();
                }
              });
              
              nextBtn.addEventListener('click', () => {
                if (currentIndex < products.length - 4) {
                  currentIndex++;
                  console.log('➡️ Moving to slide:', currentIndex);
                  updateCarousel();
                }
              });
              
              updateCarousel();
            }
          `
        }} />
        
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
