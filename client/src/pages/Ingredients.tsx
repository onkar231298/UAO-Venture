import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoriesSection from "@/components/CategoriesSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Leaf, Award, Globe, ShieldCheck, Beaker, Factory } from "lucide-react";
import type { Category } from "@shared/schema";

export default function Ingredients() {
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  useEffect(() => {
    document.title = "Organic Ingredients - Premium Herbs, Extracts & Nutraceuticals | BFI Organic";
    
    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Explore our comprehensive range of certified organic ingredients including herbs, botanical extracts, essential oils, and nutraceuticals. Premium B2B supplier serving 50+ countries.');
    }
  }, []);

  const totalCategories = categories?.filter(cat => cat.isActive)?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Premium Organic Ingredients
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Discover our comprehensive collection of certified organic herbs, botanical extracts, 
              essential oils, and nutraceuticals sourced from the finest farms worldwide.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                1000+ Products
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {totalCategories}+ Categories
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Certified Organic
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Global Shipping
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Overview */}
      <section className="py-16 section-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Explore Our Ingredient Categories
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From adaptogenic herbs to culinary spices, our diverse range of organic 
                ingredients meets the highest quality standards for your formulation needs.
              </p>
            </div>

            {/* Categories Grid */}
            <div className="mb-16">
              <CategoriesSection />
            </div>

            {/* Product Types Overview */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <Card className="text-center p-6">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Raw Botanicals</h3>
                <p className="text-gray-600 mb-4">
                  Whole herbs, dried leaves, roots, and bark sourced directly from 
                  certified organic farms worldwide.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Adaptogenic herbs</li>
                  <li>• Culinary herbs & spices</li>
                  <li>• Medicinal plants</li>
                  <li>• Aromatic herbs</li>
                </ul>
              </Card>

              <Card className="text-center p-6">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Beaker className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Botanical Extracts</h3>
                <p className="text-gray-600 mb-4">
                  Concentrated extracts, standardized compounds, and active 
                  ingredients for supplement formulations.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Standardized extracts</li>
                  <li>• Liquid concentrates</li>
                  <li>• Powdered extracts</li>
                  <li>• Custom formulations</li>
                </ul>
              </Card>

              <Card className="text-center p-6">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Factory className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Value-Added Products</h3>
                <p className="text-gray-600 mb-4">
                  Processed ingredients ready for direct use in food, cosmetic, 
                  and nutraceutical applications.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Essential oils</li>
                  <li>• Organic powders</li>
                  <li>• Custom blends</li>
                  <li>• Encapsulated products</li>
                </ul>
              </Card>
            </div>

            {/* Quality Assurance */}
            <Card className="p-8 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                  Quality & Certifications
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Every ingredient meets stringent quality standards and certifications
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6 text-center">
                  <div>
                    <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold mb-2">Organic Certified</h4>
                    <p className="text-sm text-gray-600">
                      USDA, EU, India Organic, and JAS certifications
                    </p>
                  </div>
                  <div>
                    <Beaker className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold mb-2">Lab Tested</h4>
                    <p className="text-sm text-gray-600">
                      Third-party testing for purity and potency
                    </p>
                  </div>
                  <div>
                    <ShieldCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold mb-2">GMP Compliant</h4>
                    <p className="text-sm text-gray-600">
                      Good Manufacturing Practices certified
                    </p>
                  </div>
                  <div>
                    <Globe className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold mb-2">Global Standards</h4>
                    <p className="text-sm text-gray-600">
                      FDA, FSSAI, and international compliance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Source Premium Ingredients?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Get competitive quotes, free samples, and expert consultation for your ingredient needs
          </p>
          <div className="space-x-4">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-green-600 hover:bg-gray-100"
              onClick={() => window.location.href = '/contact'}
            >
              Request Quote
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-green-600"
              onClick={() => window.location.href = '/products'}
            >
              Browse All Products
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}