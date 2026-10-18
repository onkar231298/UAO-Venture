import { useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Globe, Users, TrendingUp, Leaf, Shield, Star, Clock } from "lucide-react";

export default function About() {
  useEffect(() => {
    document.title = "About Atlas Ingredients - Leading Organic Ingredients Supplier";
    
    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Learn about Atlas Ingredients, a leading B2B supplier of premium organic herbs, extracts, and nutraceuticals. 25+ years of experience serving 50+ countries worldwide.');
    }
  }, []);

  return (
    <div className="atlas-public-theme min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About Atlas Ingredients
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Leading the future of organic ingredients with 25+ years of expertise in 
              premium herbs, extracts, and nutraceuticals for B2B customers worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-16 section-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Our Story
                </h2>
                <p className="text-gray-600 mb-4">
                  Founded with a vision to bridge the gap between traditional organic farming 
                  and modern manufacturing needs, Atlas Ingredients has grown to become a trusted
                  partner for businesses seeking premium organic ingredients.
                </p>
                <p className="text-gray-600 mb-4">
                  We specialize in sourcing, processing, and supplying high-quality organic 
                  herbs, botanical extracts, essential oils, and nutraceutical ingredients 
                  to manufacturers, formulators, and distributors globally.
                </p>
                <p className="text-gray-600">
                  Our commitment to quality, sustainability, and customer success has made 
                  us a preferred supplier for over 5,000 satisfied customers across 50+ countries.
                </p>
              </div>
              <div>
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-green-600" />
                      Our Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Years of Experience</span>
                      <Badge variant="secondary">25+</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Countries Served</span>
                      <Badge variant="secondary">50+</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Premium Products</span>
                      <Badge variant="secondary">1000+</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Happy Customers</span>
                      <Badge variant="secondary">5000+</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Values Section */}
            <div className="grid md:grid-cols-4 gap-6 mb-16">
              <Card className="text-center p-6">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Organic Purity</h3>
                <p className="text-gray-600 text-sm">
                  Certified organic ingredients without synthetic chemicals or pesticides
                </p>
              </Card>
              
              <Card className="text-center p-6">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Quality Assurance</h3>
                <p className="text-gray-600 text-sm">
                  Rigorous testing and quality control at every stage of production
                </p>
              </Card>
              
              <Card className="text-center p-6">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Global Reach</h3>
                <p className="text-gray-600 text-sm">
                  Worldwide distribution network serving customers across continents
                </p>
              </Card>
              
              <Card className="text-center p-6">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Excellence</h3>
                <p className="text-gray-600 text-sm">
                  Commitment to exceeding customer expectations in every interaction
                </p>
              </Card>
            </div>

            {/* Certifications */}
            <Card className="p-8">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Certifications & Standards</CardTitle>
                <p className="text-gray-600">
                  We maintain the highest industry standards and certifications
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Organic Certifications</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>USDA Organic</li>
                      <li>EU Organic</li>
                      <li>India Organic</li>
                      <li>JAS Organic (Japan)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Quality Standards</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>ISO 9001:2015</li>
                      <li>HACCP</li>
                      <li>GMP Certified</li>
                      <li>Kosher Certified</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Food Safety</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>FDA Registered</li>
                      <li>FSSAI Licensed</li>
                      <li>BRC Certified</li>
                      <li>Halal Certified</li>
                    </ul>
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
          <h2 className="text-3xl font-bold mb-4">Ready to Partner with Us?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied customers who trust Atlas Ingredients for their ingredient needs
          </p>
          <div className="space-x-4">
            <a 
              href="/contact"
              className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Us Today
            </a>
            <a 
              href="/products"
              className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
            >
              View Our Products
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}