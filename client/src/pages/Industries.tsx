import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Leaf, 
  Package, 
  Pill, 
  Coffee, 
  Sparkles, 
  Heart,
  ArrowRight,
  CheckCircle,
  Globe,
  Award
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

interface IndustryCard {
  title: string;
  slug: string;
  description: string;
  icon: typeof Leaf;
  features: string[];
  certifications: string[];
  color: string;
}

const industries: IndustryCard[] = [
  {
    title: "Food & Beverage",
    slug: "food-ingredients",
    description: "Premium food-grade organic ingredients for manufacturers, processors, and food service companies worldwide.",
    icon: Coffee,
    features: [
      "HACCP & GMP Certified",
      "Food Safety Standards",
      "Bulk & Custom Packaging",
      "Global Food Compliance"
    ],
    certifications: ["EU Organic", "USDA Organic", "HACCP", "ISO 22000"],
    color: "from-amber-500 to-orange-600"
  },
  {
    title: "Pharmaceutical",
    slug: "pharmaceutical-ingredients",
    description: "Pharmaceutical-grade herbal raw materials and botanical extracts for drug manufacturing and nutraceuticals.",
    icon: Pill,
    features: [
      "cGMP Compliant",
      "Pharmaceutical Grade",
      "COA & Testing Reports",
      "Regulatory Support"
    ],
    certifications: ["GMP", "ISO 9001", "Kosher", "Halal"],
    color: "from-blue-500 to-indigo-600"
  },
  {
    title: "Organic Herbs & Spices",
    slug: "organic-herbs",
    description: "Certified organic herbs and spices sourced directly from organic farms for superior quality and authenticity.",
    icon: Leaf,
    features: [
      "Farm-to-Factory Traceability",
      "Organic Certified",
      "Premium Quality",
      "Sustainable Sourcing"
    ],
    certifications: ["USDA Organic", "EU Organic", "India Organic"],
    color: "from-green-500 to-emerald-600"
  },
  {
    title: "EU Organic Spices",
    slug: "eu-organic-spices",
    description: "EU-certified organic spices meeting strict European Union regulations for quality and sustainability.",
    icon: Sparkles,
    features: [
      "EU Regulation Compliant",
      "Pesticide-Free",
      "Quality Tested",
      "Europe-Ready"
    ],
    certifications: ["EU Organic", "Ecocert", "BRC", "IFS"],
    color: "from-purple-500 to-pink-600"
  },
  {
    title: "Cosmetics & Personal Care",
    slug: "cosmetic-ingredients",
    description: "Natural and organic botanical ingredients for cosmetics, skincare, and personal care formulations.",
    icon: Sparkles,
    features: [
      "Cosmetic Grade",
      "Natural Extracts",
      "Custom Processing",
      "Beauty Industry Certified"
    ],
    certifications: ["COSMOS", "Ecocert", "ISO 9001", "Organic"],
    color: "from-rose-500 to-red-600"
  },
  {
    title: "Nutraceuticals & Dietary Supplements",
    slug: "nutraceutical-ingredients",
    description: "High-potency botanical extracts and herbal powders for dietary supplement manufacturers.",
    icon: Heart,
    features: [
      "High Potency Extracts",
      "Standardized Quality",
      "Lab Tested",
      "Supplement Grade"
    ],
    certifications: ["NSF", "GMP", "Organic", "Non-GMO"],
    color: "from-teal-500 to-cyan-600"
  }
];

export default function Industries() {
  useSEO({
    title: "Industries We Serve - B2B Organic Ingredients Supplier | Bright Fame Organic",
    description: "Bright Fame Organic supplies certified organic ingredients to pharmaceutical, food & beverage, nutraceutical, cosmetic, and herbal industries worldwide. ISO certified, GMP compliant.",
    keywords: "organic ingredients supplier, pharmaceutical ingredients, food grade herbs, nutraceutical raw materials, cosmetic ingredients, B2B organic supplier, certified organic herbs",
    canonicalUrl: `${window.location.origin}/industries`,
    pageType: "website",
    pageId: "industries"
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-4 border-green-600 text-green-700 dark:text-green-400">
                <Globe className="w-3 h-3 mr-1" />
                Serving 50+ Countries Worldwide
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
                Industries We Serve
              </h1>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                Bright Fame Organic is a trusted B2B supplier of certified organic ingredients serving diverse industries worldwide. 
                With ISO certifications, state-of-the-art facilities, and rigorous quality control, we deliver premium organic 
                raw materials tailored to your industry's specific requirements.
              </p>
              
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">ISO 9001:2015 Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">GMP Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">1000+ Products</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Industries Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {industries.map((industry) => {
                const Icon = industry.icon;
                const isExternal = !industry.slug.startsWith('food-ingredients') && 
                                   !industry.slug.startsWith('organic-herbs') && 
                                   !industry.slug.startsWith('eu-organic-spices');
                
                return (
                  <Card 
                    key={industry.slug} 
                    className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200 dark:hover:border-green-800 overflow-hidden"
                    data-testid={`card-industry-${industry.slug}`}
                  >
                    <div className={`h-2 bg-gradient-to-r ${industry.color}`} />
                    
                    <CardHeader>
                      <div className="mb-4">
                        <div className={`w-14 h-14 rounded-lg bg-gradient-to-r ${industry.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      <CardTitle className="text-2xl mb-2">{industry.title}</CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        {industry.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Features */}
                      <div>
                        <h4 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Key Features
                        </h4>
                        <ul className="space-y-2">
                          {industry.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Certifications */}
                      <div>
                        <h4 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Certifications
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {industry.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* CTA Button */}
                      {isExternal ? (
                        <Button 
                          className="w-full group/btn"
                          variant="outline"
                          disabled
                          data-testid={`button-view-${industry.slug}`}
                        >
                          Coming Soon
                        </Button>
                      ) : (
                        <Link href={`/${industry.slug}`}>
                          <Button 
                            className="w-full group/btn"
                            data-testid={`button-view-${industry.slug}`}
                          >
                            Explore Products
                            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-green-600 to-emerald-700 dark:from-green-800 dark:to-emerald-900 py-16 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Partner With Us?
            </h2>
            <p className="text-lg text-green-50 mb-8 max-w-2xl mx-auto">
              Whether you're in pharmaceuticals, food manufacturing, or cosmetics, we have the organic ingredients 
              and expertise to support your business growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" variant="secondary" className="text-base" data-testid="button-contact-us">
                  Contact Our Team
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/products">
                <Button size="lg" variant="outline" className="text-base bg-white/10 hover:bg-white/20 text-white border-white/30" data-testid="button-browse-products">
                  Browse All Products
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
