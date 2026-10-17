import { useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Award, Globe, Shield, FileCheck, Microscope } from "lucide-react";

export default function OrganicHerbs() {
  useEffect(() => {
    document.title = "Organic Herbs Supplier - EU Certified Medicinal & Culinary Herbs | Atlas Ingredients";
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Premium organic herbs supplier for pharmaceutical, nutraceutical & food industries. EU organic certified, sustainably sourced medicinal and culinary herbs from India.');
    }

    // Organic herbs structured data
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product", 
      "name": "Organic Medicinal and Culinary Herbs",
      "description": "Premium organic herbs including Ashwagandha, Turmeric, Brahmi, and traditional Ayurvedic herbs for pharmaceutical and nutraceutical applications",
      "category": "Organic Herbs",
      "brand": {
        "@type": "Brand",
        "name": "Atlas Ingredients"
      },
      "manufacturer": {
        "@type": "Organization",
        "name": "Atlas Ingredients",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "IN",
          "addressRegion": "Gujarat"
        }
      },
      "offers": {
        "@type": "AggregateOffer",
        "availability": "https://schema.org/InStock",
        "priceCurrency": "USD",
        "eligibleRegion": ["US", "EU", "CA", "AU", "IN", "GB"],
        "businessFunction": "http://purl.org/goodrelations/v1#Sell"
      },
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Certification",
          "value": "EU Organic, USDA Organic, India Organic"
        },
        {
          "@type": "PropertyValue",
          "name": "Application", 
          "value": "Pharmaceutical, Nutraceutical, Ayurvedic"
        },
        {
          "@type": "PropertyValue",
          "name": "Processing",
          "value": "Traditional & Modern Extraction Methods"
        }
      ],
      "keywords": "organic herbs supplier, medicinal herbs, Ayurvedic herbs, pharmaceutical herbs, nutraceutical ingredients, herbal extracts, EU organic certified herbs"
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    script.id = 'organic-herbs-schema';
    
    const existing = document.getElementById('organic-herbs-schema');
    if (existing) existing.remove();
    document.head.appendChild(script);

    return () => {
      const schemaScript = document.getElementById('organic-herbs-schema');
      if (schemaScript) schemaScript.remove();
    };
  }, []);

  // Fetch herbs and adaptogenic products
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products', { category: ['herbs', 'adaptogenic-herbs', 'ayurvedic'], limit: 16 }],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey;
      const searchParams = new URLSearchParams();
      if (params.category) {
        params.category.forEach(cat => searchParams.append('category', cat));
      }
      if (params.limit) searchParams.append('limit', params.limit);
      return fetch(`/api/products?${searchParams}`).then(res => res.json());
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 to-green-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Premium Organic Herbs Supplier - EU Certified
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Leading supplier of organic medicinal and culinary herbs from India. EU organic certified, 
              sustainably sourced, serving pharmaceutical, nutraceutical, and food industries worldwide.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2">
                <Leaf className="w-4 h-4 mr-2" />
                1000+ Organic Herbs
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Award className="w-4 h-4 mr-2" />
                EU Organic Certified
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Globe className="w-4 h-4 mr-2" />
                50+ Countries Served
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                Ayurvedic Expertise
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Organic Herbs Categories
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive range of organic herbs for diverse applications
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">🌿</div>
                <CardTitle>Adaptogenic Herbs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Premium adaptogens for stress management and wellness products
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ashwagandha (Withania somnifera)</li>
                  <li>• Brahmi (Bacopa monnieri)</li>
                  <li>• Shankhpushpi (Convolvulus pluricaulis)</li>
                  <li>• Jatamansi (Nardostachys jatamansi)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">🍃</div>
                <CardTitle>Medicinal Herbs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Traditional medicinal herbs for pharmaceutical applications
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Turmeric (Curcuma longa)</li>
                  <li>• Neem (Azadirachta indica)</li>
                  <li>• Arjuna (Terminalia arjuna)</li>
                  <li>• Giloy (Tinospora cordifolia)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">🌱</div>
                <CardTitle>Culinary Herbs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Organic culinary herbs for food industry applications
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Oregano (Origanum vulgare)</li>
                  <li>• Basil (Ocimum basilicum)</li>
                  <li>• Thyme (Thymus vulgaris)</li>
                  <li>• Rosemary (Rosmarinus officinalis)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quality Standards */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              EU Compliance & Quality Standards
            </h2>
            <p className="text-xl text-gray-600">
              Meeting highest European and international organic standards
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Award className="w-12 h-12 text-green-600 mb-4" />
                <CardTitle>EU Organic Certification</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• EU Organic Regulation (834/2007)</li>
                  <li>• Ecocert International Certification</li>
                  <li>• USDA Organic Equivalent</li>
                  <li>• JAS Organic (Japan)</li>
                  <li>• NPOP India Organic</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Microscope className="w-12 h-12 text-green-600 mb-4" />
                <CardTitle>Scientific Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Active compound analysis</li>
                  <li>• Pesticide residue testing</li>
                  <li>• Heavy metals screening</li>
                  <li>• Microbiological testing</li>
                  <li>• Aflatoxin analysis</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileCheck className="w-12 h-12 text-green-600 mb-4" />
                <CardTitle>Complete Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• EU export certificates</li>
                  <li>• Certificate of Analysis</li>
                  <li>• Phytosanitary certificates</li>
                  <li>• Organic certificates</li>
                  <li>• GMP compliance documents</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Organic Herbs */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Organic Herbs
            </h2>
            <p className="text-xl text-gray-600">
              Premium quality organic herbs with EU certification
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products?.products?.slice(0, 16).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Applications Section */}
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Industry Applications
            </h2>
            <p className="text-xl text-gray-600">
              Our organic herbs serve diverse global industries
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-4">💊</div>
              <h3 className="text-lg font-semibold mb-2">Pharmaceutical</h3>
              <p className="text-gray-600 text-sm">API manufacturing and drug formulations</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🌿</div>
              <h3 className="text-lg font-semibold mb-2">Nutraceuticals</h3>
              <p className="text-gray-600 text-sm">Dietary supplements and wellness products</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🧴</div>
              <h3 className="text-lg font-semibold mb-2">Cosmetics</h3>
              <p className="text-gray-600 text-sm">Natural skincare and beauty products</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🍵</div>
              <h3 className="text-lg font-semibold mb-2">Herbal Teas</h3>
              <p className="text-gray-600 text-sm">Premium herbal tea blends and infusions</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Source Premium Organic Herbs from India
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Connect with our herbal specialists for custom sourcing solutions, 
            bulk supply arrangements, and technical support for your specific requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact" 
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Request Herb Samples
            </a>
            <a 
              href="/products" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
            >
              Browse All Herbs
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}