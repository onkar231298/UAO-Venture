import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Globe,
  Package,
  Factory,
  Leaf,
  Award,
  CheckCircle,
  TrendingUp,
  MapPin,
  Users,
  FlaskConical,
  Truck,
  Box,
  BarChart3,
} from "lucide-react";

const faqData = [
  {
    question: "What is Bright Fame Organic?",
    answer:
      "Bright Fame Organic (BFI Organic) is a B2B organic ingredients supplier, manufacturer, and exporter based in Mehsana, Gujarat, India. The company specializes in certified organic herbs, spices, botanical extracts, and nutraceutical ingredients, serving pharmaceutical companies, nutraceutical manufacturers, food manufacturers, supplement brands, and Ayurvedic companies across 50+ countries worldwide.",
  },
  {
    question: "What organic certifications does BFI Organic hold?",
    answer:
      "BFI Organic holds multiple international organic and quality certifications including EU Organic (European Union organic standards), USDA NOP (United States Department of Agriculture National Organic Program), JAS (Japanese Agricultural Standard), NPOP (National Programme for Organic Production, India), India Organic, ISO 22000:2018 (Food Safety Management), HACCP (Hazard Analysis and Critical Control Points), and GMP (Good Manufacturing Practices). These certifications ensure compliance with the strictest global quality and safety standards.",
  },
  {
    question: "What products does BFI Organic supply?",
    answer:
      "BFI Organic supplies over 1000 SKUs across multiple product categories including organic herbs (Ashwagandha, Tulsi, Brahmi, Shatavari, Moringa, and more), organic spices (turmeric, cumin, coriander, fenugreek, black pepper), botanical and herbal extracts, herbal powders, essential oils, oleoresins, nutraceutical ingredients, spray-dried fruit and vegetable powders, superfoods, plant-based proteins, mushroom powders, seeds and grains, and custom blends. All products are available in both organic and conventional grades.",
  },
  {
    question: "Which countries does BFI Organic export to?",
    answer:
      "BFI Organic exports to over 50 countries across six continents. Key markets include the United States (USA), European Union member states (Germany, France, Netherlands, Italy, Spain), United Kingdom (UK), Canada, Australia, Japan, South Korea, and countries across the Middle East, Southeast Asia, and Africa. The company holds certifications recognized in all major export markets, including EU Organic, USDA NOP, and JAS for Japan.",
  },
  {
    question:
      "What is the minimum order quantity (MOQ) for BFI Organic products?",
    answer:
      "The typical minimum order quantity (MOQ) for BFI Organic products is 25 kg for most items, making it accessible for businesses of various sizes. MOQs may vary depending on the specific product, processing requirements, and packaging specifications. For custom blends, extracts, or specialty items, MOQs may differ. Contact the sales team for specific MOQ details for your required products.",
  },
  {
    question: "How does BFI Organic ensure product quality?",
    answer:
      "BFI Organic implements a comprehensive quality control process at every stage of production. This includes sourcing from certified organic farms (950 hectares under organic certification), in-house testing at ISO-certified laboratories, third-party lab verification, HACCP-compliant processing, clean room packaging facilities, and complete traceability from farm to finished product. Every batch comes with a Certificate of Analysis (COA), MSDS, and relevant organic certificates.",
  },
  {
    question: "Does BFI Organic offer custom packaging?",
    answer:
      "Yes, BFI Organic offers comprehensive custom packaging capabilities. The company operates an integrated packaging facility equipped with Form-Fill-Seal (FFS) machines housed in clean room environments. Packaging options include standee pouches ranging from 100g to 1kg, bulk bags (25kg, 50kg), customized labeling, and private label packaging. The clean room facility ensures contamination-free packaging that meets pharmaceutical and food-grade standards.",
  },
  {
    question: "What industries does BFI Organic serve?",
    answer:
      "BFI Organic serves a diverse range of B2B industries including pharmaceutical companies (active pharmaceutical ingredients and excipients), nutraceutical and dietary supplement manufacturers, food and beverage manufacturers, health supplement brands, Ayurvedic and traditional medicine companies, cosmetic and personal care product manufacturers, herbal product companies, and tea and infusion brands. The company provides industry-specific documentation and compliance support for each sector.",
  },
  {
    question: "How to request a sample from BFI Organic?",
    answer:
      "To request a sample from BFI Organic, buyers can submit an inquiry through the website contact form or reach out directly to the sales team via email. Samples are available for verified business inquiries. The process typically involves submitting your product requirements and business details, receiving a response from the sales team within 24-48 hours, sample dispatch with relevant documentation (COA, organic certificates), and follow-up with pricing and MOQ details for bulk orders.",
  },
  {
    question: "What is BFI Organic's supply chain process?",
    answer:
      "BFI Organic operates a fully transparent farm-to-formula supply chain. The process begins with sourcing from 950 hectares of organically certified farmland and partner farms across India. Raw materials undergo rigorous quality checks at intake, followed by processing at state-of-the-art facilities including pulverizer lines (800 kg/hour capacity), solvent extraction plants, and sorting units. Products are then tested in ISO-certified labs, packaged in clean room facilities with FFS machines, and dispatched with complete documentation. Full traceability is maintained at every stage.",
  },
];

export default function HomepageAEO() {
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqData.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "homepage-aeo-faq-schema";
    script.textContent = JSON.stringify(faqSchema, null, 2);

    const existing = document.getElementById("homepage-aeo-faq-schema");
    if (existing) {
      existing.remove();
    }

    document.head.appendChild(script);

    return () => {
      const el = document.getElementById("homepage-aeo-faq-schema");
      if (el) {
        el.remove();
      }
    };
  }, []);

  return (
    <article className="py-16 bg-white" itemScope itemType="https://schema.org/Organization">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Section 1: AI-Friendly Company Definition Block */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              About BFI Organic - Certified Organic Ingredients Supplier
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              A comprehensive overview of Bright Fame Organic, India's leading B2B organic ingredients manufacturer and exporter.
            </p>
          </div>

          <Card className="border-emerald-200 shadow-lg">
            <CardContent className="p-8">
              <div className="prose max-w-none">
                <p className="text-lg text-gray-700 leading-relaxed mb-6" itemProp="description">
                  <strong>Bright Fame Organic (BFI Organic)</strong> is a B2B organic ingredients supplier, manufacturer, and exporter headquartered in Mehsana, Gujarat, India. As an established manufacturer and exporter, BFI Organic specializes in certified organic herbs, spices, botanical extracts, and nutraceutical ingredients for global markets.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Certifications</h3>
                    <p className="text-sm text-gray-600">EU Organic, USDA NOP, JAS, NPOP, India Organic, ISO 22000, HACCP, GMP</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Global Reach</h3>
                    <p className="text-sm text-gray-600">Exports to 50+ countries including USA, EU, UK, Canada, Australia, Japan</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Organic Farmland</h3>
                    <p className="text-sm text-gray-600">950 hectares under organic certification across India</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Product Range</h3>
                    <p className="text-sm text-gray-600">1000+ SKUs across herbs, spices, extracts, powders, oils</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Target Buyers
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">Pharmaceutical Companies</Badge>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">Nutraceutical Manufacturers</Badge>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">Food Manufacturers</Badge>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">Supplement Brands</Badge>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">Ayurvedic Companies</Badge>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">Cosmetic Manufacturers</Badge>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">Herbal Product Companies</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Buyer-Intent Q&A Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions About BFI Organic
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions about our organic ingredients, certifications, supply chain, and business capabilities.
            </p>
          </div>

          <div className="space-y-3">
            {faqData.map((item, index) => (
              <details
                key={index}
                className="group border border-gray-200 rounded-lg overflow-hidden hover:border-emerald-300 transition-colors"
              >
                <summary className="flex items-center justify-between cursor-pointer p-5 bg-gray-50 group-open:bg-emerald-50 transition-colors list-none">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 pr-4">
                    {item.question}
                  </h3>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="p-5 bg-white border-t border-gray-100">
                  <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Section 3: Comparison/Positioning Block - Why Choose BFI Organic */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose BFI Organic
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Key differentiators that set Bright Fame Organic apart from other organic ingredient suppliers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-emerald-100 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                  <Factory className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg">Direct Manufacturer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  BFI Organic is a direct manufacturer, not a broker or trader. This ensures better price competitiveness, quality control, and supply chain reliability for all B2B buyers.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                  <Leaf className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg">Own Organic Farmland</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  With 950 hectares of farmland under organic certification, BFI Organic controls the supply chain from cultivation to finished product, ensuring traceability and consistent quality.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                  <Box className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg">Integrated Packaging</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  In-house packaging facility with Form-Fill-Seal (FFS) machines operating in clean room environments. Standee pouches from 100g to 1kg and bulk packaging options available.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                  <Award className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg">Multiple Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Certified by EU Organic, USDA NOP, JAS, NPOP, India Organic, ISO 22000, HACCP, and GMP - meeting the strictest international organic and quality standards.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg">1000+ Product Range</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Over 1000 SKUs spanning organic herbs, spices, botanical extracts, herbal powders, essential oils, nutraceutical ingredients, superfoods, and custom blends.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                  <FlaskConical className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg">Quality Assurance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Every batch undergoes in-house and third-party lab testing. Complete documentation provided including Certificate of Analysis (COA), MSDS, and organic certificates.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 5: Industry Statistics Block */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Organic Industry Overview
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Key statistics about India's organic sector and the global organic ingredients market.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">India in Organic Exports</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  India is one of the world's largest producers and exporters of organic products, with over 4.7 million hectares under organic cultivation. The country ranks among the top organic exporters globally, with organic exports valued at over USD 1 billion annually.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">4.7M+ hectares</Badge>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">USD 1B+ exports</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">Gujarat's Organic Sector</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  Gujarat is a leading state in India for organic spice production, particularly cumin, coriander, and fenugreek. The state is home to major organic processing and export facilities, with strong infrastructure for organic certification and quality control.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Top spice producer</Badge>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Export hub</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">Global Market Size</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  The global organic food and ingredients market is valued at over USD 200 billion and is projected to grow at a CAGR of 12-14% through 2030. The organic herbs and spices segment is one of the fastest-growing categories, driven by demand from health-conscious consumers and clean-label food manufacturers.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">USD 200B+ market</Badge>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">12-14% CAGR</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </article>
  );
}
