import { useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Award, Globe, Truck, FileText, Users } from "lucide-react";

export default function FoodIngredients() {
  // Set page SEO
  useEffect(() => {
    document.title = "Food Grade Organic Ingredients Supplier - Atlas Ingredients | EU Certified";
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Leading supplier of food-grade organic herbs, spices, and botanical ingredients for food manufacturers. EU certified, HACCP compliant, serving global food industry.');
    }

    // Add food industry structured data
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Food Grade Organic Ingredients",
      "description": "Premium organic herbs, spices, and botanical ingredients for food manufacturing industry",
      "category": "Food Ingredients",
      "brand": {
        "@type": "Brand",
        "name": "Atlas Ingredients"
      },
      "manufacturer": {
        "@type": "Organization",
        "name": "Atlas Ingredients"
      },
      "offers": {
        "@type": "AggregateOffer",
        "availability": "https://schema.org/InStock",
        "priceCurrency": "USD",
        "eligibleRegion": ["US", "EU", "CA", "AU", "IN"],
        "businessFunction": "http://purl.org/goodrelations/v1#Sell"
      },
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Certification",
          "value": "EU Organic, USDA Organic, HACCP"
        },
        {
          "@type": "PropertyValue", 
          "name": "Industry",
          "value": "Food Manufacturing"
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    script.id = 'food-ingredients-schema';
    
    const existing = document.getElementById('food-ingredients-schema');
    if (existing) existing.remove();
    document.head.appendChild(script);

    return () => {
      const schemaScript = document.getElementById('food-ingredients-schema');
      if (schemaScript) schemaScript.remove();
    };
  }, []);

  // Fetch food-grade products
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products', { category: ['spices', 'herbs', 'food-ingredients'], limit: 12 }],
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
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Food Grade Organic Ingredients Supplier
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Premium organic herbs, spices, and botanical ingredients for food manufacturers. 
              EU certified, HACCP compliant, serving global food industry with 1000+ premium products.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2">
                <Award className="w-4 h-4 mr-2" />
                EU Organic Certified
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <CheckCircle className="w-4 h-4 mr-2" />
                HACCP Compliant
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Globe className="w-4 h-4 mr-2" />
                Global Supply Chain
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Food Manufacturers Choose Atlas Ingredients
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Leading supplier of food-grade organic ingredients with EU compliance and global reach
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Award className="w-12 h-12 text-green-600 mb-4" />
                <CardTitle>EU & Global Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• EU Organic Regulation (834/2007)</li>
                  <li>• USDA Organic Certified</li>
                  <li>• HACCP Food Safety Standards</li>
                  <li>• ISO 22000:2018 Certified</li>
                  <li>• Non-GMO Project Verified</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Truck className="w-12 h-12 text-green-600 mb-4" />
                <CardTitle>Global Food Industry Supply</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Serving 50+ countries worldwide</li>
                  <li>• Food manufacturing partnerships</li>
                  <li>• Bulk supply capabilities</li>
                  <li>• Custom packaging solutions</li>
                  <li>• Cold chain logistics</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="w-12 h-12 text-green-600 mb-4" />
                <CardTitle>Complete Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Certificate of Analysis (CoA)</li>
                  <li>• Organic certificates</li>
                  <li>• Pesticide residue reports</li>
                  <li>• Microbiological testing</li>
                  <li>• Shelf life studies</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Food Industry Applications */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Food Industry Applications
            </h2>
            <p className="text-xl text-gray-600">
              Our organic ingredients serve diverse food manufacturing sectors
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🍞</div>
              <h3 className="text-lg font-semibold mb-2">Bakery Products</h3>
              <p className="text-gray-600 text-sm">Organic spices for breads, cookies, and baked goods</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🥫</div>
              <h3 className="text-lg font-semibold mb-2">Processed Foods</h3>
              <p className="text-gray-600 text-sm">Natural flavoring and preservation solutions</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🍵</div>
              <h3 className="text-lg font-semibold mb-2">Beverages</h3>
              <p className="text-gray-600 text-sm">Herbal teas, functional drinks, and flavor extracts</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🍽️</div>
              <h3 className="text-lg font-semibold mb-2">Ready Meals</h3>
              <p className="text-gray-600 text-sm">Seasoning blends and natural preservatives</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Food Grade Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Food Grade Organic Products
            </h2>
            <p className="text-xl text-gray-600">
              EU certified organic herbs and spices for food manufacturing
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
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
              {products?.products?.slice(0, 12).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Source Premium Organic Food Ingredients?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Contact our food industry specialists for custom quotations, bulk pricing, 
            and technical specifications tailored to your manufacturing needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact" 
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Food Grade Quote
            </a>
            <a 
              href="/products" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
            >
              Browse All Products
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}