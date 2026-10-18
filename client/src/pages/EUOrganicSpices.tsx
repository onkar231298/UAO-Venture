import { useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Globe, Truck, FileText, Shield, MapPin } from "lucide-react";

export default function EUOrganicSpices() {
  useEffect(() => {
    document.title = "EU Organic Spices Supplier India - Top EU Certified Organic Spice Manufacturer | Atlas Ingredients";
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Atlas Ingredients - India\'s leading EU certified organic spice manufacturer and exporter. EU Organic Regulation 834/2007 compliant. Own 950-hectare farmland. Direct manufacturer with ISO 22000, HACCP, GMP. Premium organic turmeric, cumin, coriander, fenugreek, black pepper for European food manufacturers. Clean room FFS packaging.');
    }

    // EU Organic Spices structured data
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "EU Certified Organic Spices",
      "description": "Premium organic spices from India certified for European market under EU Organic Regulation 834/2007",
      "category": "Organic Spices",
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
        "priceCurrency": "EUR",
        "eligibleRegion": ["EU", "GB", "CH", "NO"],
        "businessFunction": "http://purl.org/goodrelations/v1#Sell"
      },
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Certification",
          "value": "EU Organic Regulation 834/2007, Ecocert"
        },
        {
          "@type": "PropertyValue",
          "name": "Target Market",
          "value": "European Union Food Industry"
        },
        {
          "@type": "PropertyValue",
          "name": "Origin",
          "value": "India - Gujarat, Kerala, Tamil Nadu"
        }
      ],
      "keywords": "EU organic spices, European organic spices supplier, organic spices Europe, EU certified spices, Indian organic spices EU, organic spices Germany France UK"
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    script.id = 'eu-spices-schema';
    
    const existing = document.getElementById('eu-spices-schema');
    if (existing) existing.remove();
    document.head.appendChild(script);

    return () => {
      const schemaScript = document.getElementById('eu-spices-schema');
      if (schemaScript) schemaScript.remove();
    };
  }, []);

  // Fetch spices products
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products', { category: ['spices', 'culinary', 'seasoning'], limit: 16 }],
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
    <div className="atlas-public-theme min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                EU Certified Supplier
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              EU Organic Spices Supplier - European Market
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Premium organic spices from India, certified for European market under EU Organic Regulation 834/2007. 
              Serving food manufacturers, distributors, and retailers across European Union.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2">
                <Award className="w-4 h-4 mr-2" />
                EU Regulation 834/2007
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                Ecocert Certified
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <MapPin className="w-4 h-4 mr-2" />
                Direct from India
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Truck className="w-4 h-4 mr-2" />
                EU Distribution
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Why European Buyers Choose Atlas Ingredients */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why European Buyers Choose Atlas Ingredients for Organic Spices
            </h2>
          </div>

          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Atlas Ingredients vs Other Indian Spice Exporters for EU Market
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-left">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-gray-300 px-4 py-3 font-semibold">Factor</th>
                    <th className="border border-gray-300 px-4 py-3 font-semibold">Atlas Ingredients</th>
                    <th className="border border-gray-300 px-4 py-3 font-semibold">Typical Indian Exporter</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="border border-gray-300 px-4 py-3 font-medium">EU Organic Certification</td>
                    <td className="border border-gray-300 px-4 py-3">Direct holder</td>
                    <td className="border border-gray-300 px-4 py-3">May use third-party</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">Own Farmland</td>
                    <td className="border border-gray-300 px-4 py-3">950 hectares</td>
                    <td className="border border-gray-300 px-4 py-3">No farmland</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border border-gray-300 px-4 py-3 font-medium">Quality Testing</td>
                    <td className="border border-gray-300 px-4 py-3">In-house QC lab + third-party</td>
                    <td className="border border-gray-300 px-4 py-3">Basic testing</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">Packaging</td>
                    <td className="border border-gray-300 px-4 py-3">Clean room FFS, 100g-1kg pouches</td>
                    <td className="border border-gray-300 px-4 py-3">Standard packaging</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border border-gray-300 px-4 py-3 font-medium">Processing</td>
                    <td className="border border-gray-300 px-4 py-3">ISO 22000, HACCP, GMP facility</td>
                    <td className="border border-gray-300 px-4 py-3">Basic processing</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">Traceability</td>
                    <td className="border border-gray-300 px-4 py-3">Farm-to-product complete</td>
                    <td className="border border-gray-300 px-4 py-3">Limited</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border border-gray-300 px-4 py-3 font-medium">Documentation</td>
                    <td className="border border-gray-300 px-4 py-3">COA, MSDS, organic certs, phytosanitary</td>
                    <td className="border border-gray-300 px-4 py-3">Basic documentation</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">Export Experience</td>
                    <td className="border border-gray-300 px-4 py-3">50+ countries, experienced with EU customs</td>
                    <td className="border border-gray-300 px-4 py-3">Limited EU experience</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Key EU Organic Spice Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Key EU Organic Spice Products
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <dl className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <dt className="text-xl font-semibold text-gray-900 mb-2">Organic Turmeric (Curcuma longa)</dt>
                <dd className="text-gray-600">Ground turmeric, curcumin extract</dd>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <dt className="text-xl font-semibold text-gray-900 mb-2">Organic Cumin (Cuminum cyminum)</dt>
                <dd className="text-gray-600">Whole, ground, essential oil</dd>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <dt className="text-xl font-semibold text-gray-900 mb-2">Organic Coriander (Coriandrum sativum)</dt>
                <dd className="text-gray-600">Whole, ground, split</dd>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <dt className="text-xl font-semibold text-gray-900 mb-2">Organic Fenugreek (Trigonella foenum-graecum)</dt>
                <dd className="text-gray-600">Seeds, powder, extract</dd>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <dt className="text-xl font-semibold text-gray-900 mb-2">Organic Black Pepper (Piper nigrum)</dt>
                <dd className="text-gray-600">Whole, cracked, ground</dd>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <dt className="text-xl font-semibold text-gray-900 mb-2">Organic Ginger (Zingiber officinale)</dt>
                <dd className="text-gray-600">Dried, ground, extract</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* EU Compliance Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              EU Organic Compliance & Certification
            </h2>
            <p className="text-xl text-gray-600">
              Meeting strict European organic standards for food safety and quality
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-blue-200">
              <CardHeader>
                <Award className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle>EU Organic Regulation</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• EU Regulation 834/2007 compliant</li>
                  <li>• Commission Regulation 889/2008</li>
                  <li>• Ecocert International certification</li>
                  <li>• Annual EU inspections passed</li>
                  <li>• Organic logo authorization</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <Shield className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle>Food Safety Standards</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• HACCP certified facility</li>
                  <li>• EU food safety regulations</li>
                  <li>• BRC Global Standards</li>
                  <li>• ISO 22000:2018 certification</li>
                  <li>• Allergen management protocols</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <FileText className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle>EU Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• EU export certificates</li>
                  <li>• Phytosanitary certificates</li>
                  <li>• Certificate of Analysis (CoA)</li>
                  <li>• EU organic certificates</li>
                  <li>• Customs documentation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* European Market Focus */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Serving European Food Industry
            </h2>
            <p className="text-xl text-gray-600">
              Trusted partner for organic spices across European Union
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🇩🇪</div>
              <h3 className="text-lg font-semibold mb-2">Germany</h3>
              <p className="text-gray-600 text-sm">Leading organic food market, premium spice requirements</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🇫🇷</div>
              <h3 className="text-lg font-semibold mb-2">France</h3>
              <p className="text-gray-600 text-sm">Gourmet food industry, artisanal spice applications</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🇬🇧</div>
              <h3 className="text-lg font-semibold mb-2">United Kingdom</h3>
              <p className="text-gray-600 text-sm">Established organic market, curry and ethnic foods</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🇪🇺</div>
              <h3 className="text-lg font-semibold mb-2">EU-Wide</h3>
              <p className="text-gray-600 text-sm">Netherlands, Italy, Spain, and other EU markets</p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Spices Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              EU Certified Organic Spices
            </h2>
            <p className="text-xl text-gray-600">
              Premium Indian spices meeting European quality standards
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">🌶️</div>
                <CardTitle>Signature Spices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Premium whole and ground spices with authentic flavors
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Organic Turmeric (Curcuma longa)</li>
                  <li>• Black Pepper (Piper nigrum)</li>
                  <li>• Cardamom (Elettaria cardamomum)</li>
                  <li>• Coriander Seeds (Coriandrum sativum)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">🔥</div>
                <CardTitle>Heat & Flavor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Organic chilies and hot spices for food manufacturing
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Red Chili Powder (Capsicum annum)</li>
                  <li>• Paprika (Capsicum annuum)</li>
                  <li>• Cayenne Pepper (Capsicum frutescens)</li>
                  <li>• Ginger Powder (Zingiber officinale)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">🌿</div>
                <CardTitle>Aromatic Blends</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Custom spice blends for European taste preferences
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Garam Masala Blend</li>
                  <li>• Curry Powder Blends</li>
                  <li>• Mediterranean Herb Mixes</li>
                  <li>• Custom European Blends</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured EU Organic Spices */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured EU Certified Spices
            </h2>
            <p className="text-xl text-gray-600">
              Premium organic spices ready for European market distribution
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

      {/* EU Supply Chain Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why European Companies Choose Atlas Ingredients
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <Truck className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle>Streamlined EU Import Process</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Direct relationships with EU importers</li>
                  <li>• Pre-cleared customs documentation</li>
                  <li>• Container and LCL shipping options</li>
                  <li>• Temperature-controlled logistics</li>
                  <li>• Flexible Incoterms (CIF, FOB, DDP)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Award className="w-12 h-12 text-blue-600 mb-4" />
                <CardTitle>European Quality Assurance</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• EU-accredited laboratory testing</li>
                  <li>• Pesticide residue analysis</li>
                  <li>• Microbiological safety testing</li>
                  <li>• Heavy metals screening</li>
                  <li>• Shelf-life validation studies</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Import EU Certified Organic Spices?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Contact our European market specialists for competitive pricing, bulk supply solutions, 
            and complete import documentation for your organic spice requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/contact" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get EU Import Quote
            </a>
            <a 
              href="/products" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Browse All Spices
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}