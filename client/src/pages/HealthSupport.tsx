import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, Search, Filter, Star } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

interface HealthSupport {
  id: number;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
}

export default function HealthSupport() {
  // SEO optimization for health support main page
  useSEO({
    title: "Health Support Categories - Organic Ingredients for Wellness | Atlas Ingredients",
    description: "Explore our comprehensive range of organic ingredients categorized by health benefits. Find natural solutions for immune health, digestive wellness, stress relief, energy support, and more. Premium B2B organic ingredients for your wellness products.",
    keywords: "health support ingredients, organic wellness solutions, immune health herbs, digestive health supplements, stress relief natural ingredients, energy support botanicals, anti-inflammatory herbs, antioxidant extracts",
    canonicalUrl: `${window.location.origin}/health-support`,
    pageType: "category",
    pageId: "health-support-main"
  });

  const { data: healthSupports, isLoading } = useQuery<HealthSupport[]>({
    queryKey: ["/api/health-supports"],
    queryFn: async () => {
      const response = await fetch("/api/health-supports");
      if (!response.ok) throw new Error('Failed to fetch health supports');
      return response.json();
    },
  });

  const { data: featuredProducts } = useQuery({
    queryKey: ["/api/products", { limit: 8, featured: true }],
  });

  return (
    <div className="atlas-public-theme min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Health Support Categories
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Discover premium organic ingredients organized by health benefits. 
              From immune support to stress relief, find natural solutions for your wellness products.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="secondary" className="bg-white/20 text-white px-4 py-2">
                {healthSupports?.length || 0} Health Categories
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white px-4 py-2">
                Organic Certified
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white px-4 py-2">
                B2B Wholesale
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Health Support Categories Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Health Benefit</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our organic ingredients are carefully categorized by their primary health benefits, 
              making it easy to find the perfect natural solutions for your formulations.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : healthSupports?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {healthSupports.map((healthSupport) => (
                <Link key={healthSupport.id} href={`/health-support/${healthSupport.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Heart className="w-8 h-8 text-green-600 group-hover:text-green-700" />
                        <Badge variant="outline" className="text-xs">
                          {healthSupport.productCount || 0} products
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                        {healthSupport.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        {healthSupport.description || `Explore premium organic ingredients specifically formulated for ${healthSupport.name.toLowerCase()} support.`}
                      </p>
                      <div className="flex items-center text-green-600 text-sm font-medium group-hover:text-green-700">
                        View Products
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Health Support Categories Available
              </h3>
              <p className="text-gray-600 mb-6">
                Health support categories will appear here once they are added.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Health Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Health Support Ingredients?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our organic ingredients are sourced with care and backed by science to deliver optimal health benefits.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Star,
                title: "Scientifically Backed",
                description: "Each ingredient is selected based on extensive research and traditional use for specific health benefits."
              },
              {
                icon: Search,
                title: "Quality Tested",
                description: "Rigorous testing ensures purity, potency, and consistency in every batch of our organic ingredients."
              },
              {
                icon: Filter,
                title: "Expertly Sourced",
                description: "Direct relationships with certified organic farms ensure the highest quality and sustainable practices."
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center p-6">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find Your Perfect Health Support Ingredients?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Browse our categories or contact our experts for personalized recommendations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-green-600 hover:bg-gray-100"
              >
                Browse All Products
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-green-600"
              >
                Contact Our Experts
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}