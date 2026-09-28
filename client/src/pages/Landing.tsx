import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SimpleHeroSlider from "@/components/SimpleHeroSlider";
import ProductCard from "@/components/ProductCard";
import InquiryForm from "@/components/InquiryForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Leaf, Search, Star, Shield, Truck, Users, BarChart3, Globe, Phone, Mail, MapPin, Package } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import type { Product, Category } from "@shared/schema";

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // SEO optimization for the homepage
  useSEO({
    title: "Cape NatureX Organic - Premium B2B Organic Ingredients",
    description: "Cape NatureX Organic Pvt. Ltd. (Cape NatureX Organic) - Leading B2B supplier of certified organic ingredients from Gujarat, India. Specializing in herbal extracts, nutraceutical raw materials, and pharmaceutical-grade organic compounds. Trusted by 500+ global clients.",
    keywords: "Cape NatureX Organic, Cape NatureX Organic, Gujarat organic supplier, B2B organic ingredients, herbal extracts India, nutraceutical raw materials, pharmaceutical organic compounds, organic herbs Gujarat, certified organic supplier India, Mehsana organic company",
    canonicalUrl: `${window.location.origin}/`,
    pageType: "website",
    pageId: "homepage"
  });

  const { data: productsData, isLoading: productsLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", { limit: 8, isOrganic: true }],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: popularProducts } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", { limit: 4, sortBy: "popular" }],
  });

  const { data: allProducts, isLoading: allProductsLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", { limit: 20 }],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Search:", searchQuery);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Cape NatureX Organics Hero Slider with Warehouse Image */}
      <SimpleHeroSlider />

      {/* Product Categories */}
      <section className="py-8 sm:py-12 lg:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Browse by Category</h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
              Discover our comprehensive range of certified organic ingredients for your business needs
            </p>
          </div>
          
          {/* Show categories in multiple rows - 8 categories total (2 rows of 4) */}
          <div className="space-y-6">
            {/* First row - 4 categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {categories?.slice(0, 4).map((category: Category) => (
                <Link key={category.id} href={`/products?category=${encodeURIComponent(category.name)}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                    <CardContent className="p-4 text-center">
                      <img
                        src={category.imageUrl || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250`}
                        alt={category.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250`;
                        }}
                      />
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">{category.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">Premium organic {category.name.toLowerCase()} for your business needs</p>
                      <div className="text-green-600 text-sm font-medium group-hover:text-green-700">View Products →</div>
                    </CardContent>
                  </Card>
                </Link>
              )) || (
                // Loading skeleton for first row
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 text-center">
                      <div className="w-full h-32 bg-gray-200 rounded-lg mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Second row - 4 more categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {categories?.slice(4, 8).map((category: Category) => (
                <Link key={category.id} href={`/products?category=${encodeURIComponent(category.name)}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                    <CardContent className="p-4 text-center">
                      <img
                        src={category.imageUrl || `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250`}
                        alt={category.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250`;
                        }}
                      />
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">{category.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">Premium organic {category.name.toLowerCase()} for your business needs</p>
                      <div className="text-green-600 text-sm font-medium group-hover:text-green-700">View Products →</div>
                    </CardContent>
                  </Card>
                </Link>
              )) || (
                // Loading skeleton for second row
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={`second-${i}`} className="animate-pulse">
                    <CardContent className="p-4 text-center">
                      <div className="w-full h-32 bg-gray-200 rounded-lg mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* View All Categories Button */}
            <div className="text-center">
              <Link href="/products">
                <Button variant="outline" size="lg" className="mt-4">
                  View All Categories →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
              <p className="text-sm sm:text-base text-gray-600">Discover our premium organic ingredients</p>
            </div>
            <Button variant="outline" className="text-sm">
              View All Products →
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {popularProducts?.products?.length ? (
              popularProducts.products.slice(0, 4).map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-36 sm:h-48 bg-gray-200 rounded-t-xl"></div>
                  <CardContent className="p-3 sm:p-4">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded mb-3 sm:mb-4"></div>
                    <div className="h-8 sm:h-10 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {/* Show no products message if API returns empty */}
          {popularProducts?.products?.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Package className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products available</h3>
              <p className="text-gray-600">Products will appear here once they are added and made visible.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 sm:py-12 lg:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Why Choose Cape NatureX Organic (Cape NatureX Organic)?</h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              <strong>Cape NatureX Organic Pvt. Ltd.</strong> specializes exclusively in pharmaceutical-grade organic ingredients and nutraceutical compounds. Unlike traditional spice suppliers, we focus on advanced herbal extracts, standardized botanical compounds, and certified organic raw materials for pharmaceutical, nutraceutical, and wellness industries.
            </p>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto mt-4 px-4 sm:px-0">
              <em>Located in Mehsana, Gujarat, India | USDA Organic & ISO 9001 Certified | Serving 500+ Global Clients</em>
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Shield,
                title: "Certified Quality",
                description: "USDA Organic, ISO 9001, HACCP certified with complete traceability"
              },
              {
                icon: BarChart3,
                title: "R&D Excellence",
                description: "In-house laboratory with advanced testing and product development capabilities"
              },
              {
                icon: Truck,
                title: "Fast Delivery",
                description: "24-48 hour shipping with real-time tracking and inventory management"
              },
              {
                icon: Users,
                title: "Expert Support",
                description: "Dedicated account managers and technical support team available 24/7"
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Real-time inventory tracking, order management, and business intelligence"
              },
              {
                icon: Globe,
                title: "Global Reach",
                description: "Worldwide shipping with regulatory compliance and documentation support"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition-colors">
                  <feature.icon className="text-green-600 group-hover:text-white text-2xl" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Products Listing */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Our Complete Product Range</h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Browse our extensive collection of certified organic ingredients, from traditional herbs to innovative extracts
            </p>
          </div>
          
          {allProductsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-36 sm:h-48 bg-gray-200 rounded-t-xl"></div>
                  <CardContent className="p-3 sm:p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : allProducts?.products?.length ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {allProducts.products.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              {/* View All Products Button */}
              <div className="text-center mt-8 sm:mt-12">
                <Link href="/products">
                  <Button size="lg" className="px-8 py-3">
                    View All {allProducts.total} Products →
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Package className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products available</h3>
              <p className="text-gray-600">Products will appear here once they are added and made visible.</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products - Most Popular/Searched */}
      <section className="py-8 sm:py-12 lg:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Most Popular Products</h2>
              <p className="text-sm sm:text-base text-gray-600">Our highest searched and most requested organic ingredients</p>
            </div>
            <Button variant="outline" className="text-sm">
              View All Popular Products →
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {popularProducts?.products?.length ? (
              popularProducts.products.slice(0, 4).map((product: Product) => (
                <div key={product.id} className="relative">
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      Popular
                    </div>
                  </div>
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-36 sm:h-48 bg-gray-200 rounded-t-xl"></div>
                  <CardContent className="p-3 sm:p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="flex space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-2xl font-bold text-gray-900">4.9</span>
              <span className="text-gray-600">/ 5 based on 150+ reviews</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                rating: 5,
                text: "Cape NatureX Organic has been our reliable partner for organic ingredients. Their quality is consistently excellent, and their customer service is top-notch. The CRM platform makes ordering so much easier.",
                author: "David Chen",
                position: "Procurement Manager, NutriCorp",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
              },
              {
                rating: 5,
                text: "The range of organic products and the documentation provided is exceptional. We've been able to expand our product line significantly thanks to their comprehensive catalog and support.",
                author: "Sarah Williams",
                position: "R&D Director, GreenVitals",
                avatar: "https://images.unsplash.com/photo-1494790108755-2616b332e234?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
              },
              {
                rating: 5,
                text: "Fast delivery, excellent quality control, and transparent pricing. The online platform is intuitive and makes reordering seamless. Highly recommend for serious businesses.",
                author: "Michael Rodriguez",
                position: "CEO, OrganicPlus Solutions",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardContent className="p-0">
                  <div className="flex space-x-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 text-sm">{testimonial.text}</p>
                  <div className="flex items-center space-x-3">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{testimonial.author}</div>
                      <div className="text-xs text-gray-600">{testimonial.position}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
