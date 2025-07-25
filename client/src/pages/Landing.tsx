import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import ParallaxHero from "@/components/ParallaxHero";
import ProductCard from "@/components/ProductCard";
import InquiryForm from "@/components/InquiryForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Leaf, Search, Star, Shield, Truck, Users, BarChart3, Globe, Phone, Mail, MapPin, Package } from "lucide-react";
import type { Product, Category } from "@shared/schema";

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: productsData, isLoading: productsLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", { limit: 8, isOrganic: true }],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: popularProducts } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ["/api/products", { limit: 4 }],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Search:", searchQuery);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Bright Fame Organics Parallax Hero */}
      <ParallaxHero />

      {/* Product Categories */}
      <section className="py-8 sm:py-12 lg:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Browse by Category</h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
              Discover our comprehensive range of certified organic ingredients for your business needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories?.slice(0, 4).map((category: Category) => (
              <Card key={category.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <img
                    src={`https://images.unsplash.com/photo-${
                      category.name.includes('Essential') ? '1608571423902-eed4a5ad8108' :
                      category.name.includes('Extracts') ? '1596040033229-a9821ebd058d' :
                      category.name.includes('Herbs') ? '1583947215259-38e31be8751f' :
                      '1506905925346-21bda4d32df4'
                    }?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250`}
                    alt={category.name}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">Premium organic {category.name.toLowerCase()} for your business needs</p>
                  <div className="text-green-600 text-sm font-medium">View Products →</div>
                </CardContent>
              </Card>
            )) || (
              // Loading skeleton for categories
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 text-center">
                    <div className="w-full h-32 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                  </CardContent>
                </Card>
              ))
            )}
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Why Choose BFI Organic?</h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
              We provide comprehensive B2B solutions with cutting-edge technology and uncompromising quality standards
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
                text: "BFI Organic has been our reliable partner for organic ingredients. Their quality is consistently excellent, and their customer service is top-notch. The CRM platform makes ordering so much easier.",
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

      {/* Footer */}
      <footer className="bg-green-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Leaf className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">BFI Organic</h3>
                  <p className="text-xs text-green-200">Pvt. Ltd.</p>
                </div>
              </div>
              <p className="text-green-200 text-sm mb-4">
                Your trusted partner for premium organic ingredients with comprehensive B2B solutions.
              </p>
              <div className="flex space-x-3">
                <a href="#" className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center hover:bg-white hover:text-green-600 transition-colors">
                  <span className="text-sm font-bold">f</span>
                </a>
                <a href="#" className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center hover:bg-white hover:text-green-600 transition-colors">
                  <span className="text-sm font-bold">t</span>
                </a>
                <a href="#" className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center hover:bg-white hover:text-green-600 transition-colors">
                  <span className="text-sm font-bold">in</span>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-sm text-green-200">
                <li><a href="#" className="hover:text-white transition-colors">Herbal Powders</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Liquid Extracts</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Essential Oils</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Raw Materials</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Custom Blends</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-green-200">
                <li><a href="#" className="hover:text-white transition-colors">Quality Testing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">R&D Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Regulatory Compliance</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Custom Packaging</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Logistics Solutions</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <div className="space-y-3 text-sm text-green-200">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 mt-1" />
                  <div>
                    <p>123 Organic Industry Hub</p>
                    <p>Mumbai, Maharashtra 400001</p>
                    <p>India</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>+91-98765-43210</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>info@bfiorganic.com</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-green-500 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-green-200">
            <p>&copy; 2024 BFI Organic Pvt. Ltd. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
