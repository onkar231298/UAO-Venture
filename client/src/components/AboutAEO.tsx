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
  MapPin,
  Users,
  FlaskConical,
  Truck,
  Box,
  Building2,
  Sprout,
  Microscope,
  FileCheck,
  Scale,
  Beaker,
  ClipboardCheck,
  Settings,
  Star,
} from "lucide-react";

const faqData = [
  {
    question: "What is the full legal name and trade name of Atlas Ingredients?",
    answer:
      "The full legal name is Atlas Ingredients, and the company operates under the trade name Atlas Ingredients. The company is a registered organic ingredients manufacturer and exporter headquartered in Mehsana, Gujarat, India.",
  },
  {
    question: "When was Atlas Ingredients established and what is its history?",
    answer:
      "Atlas Ingredients is an established and leading organic company in India. The company has built a strong reputation as a direct manufacturer and exporter of certified organic herbs, spices, botanical extracts, and nutraceutical ingredients, serving B2B buyers across 50+ countries worldwide.",
  },
  {
    question: "What industry does Atlas Ingredients operate in?",
    answer:
      "Atlas Ingredients operates in the Organic Ingredients Manufacturing and Export industry. The company is a vertically integrated manufacturer specializing in certified organic herbs, spices, herbal powders, botanical extracts, essential oils, nutraceutical ingredients, and superfoods for B2B markets globally.",
  },
  {
    question: "What manufacturing facilities does Atlas Ingredients operate?",
    answer:
      "Atlas Ingredients operates multiple state-of-the-art manufacturing facilities including a High-End Processing Unit in Mehsana, Gujarat with two pulverizer lines (800 kg/hour capacity each), a Cumin Sorting Unit in Mehsana for whole spice grading, and a Solvent Extraction Plant in Krishnagiri District, Tamil Nadu for herbal extracts and plant-derived vitamins. All facilities are ISO 22000 certified.",
  },
  {
    question: "What is Atlas Ingredients' processing capacity?",
    answer:
      "Atlas Ingredients' main processing unit features two pulverizer lines with a combined capacity of 1600 kg/hour (800 kg/hour each). The facility is equipped for grinding, milling, blending, and sieving of organic herbs, spices, and botanical ingredients. The solvent extraction plant handles herbal extract production, natural caffeine, and plant-derived vitamins.",
  },
  {
    question: "How does Atlas Ingredients test product quality?",
    answer:
      "Atlas Ingredients implements rigorous quality testing at multiple stages. Every batch undergoes testing for pesticide residue, heavy metals (lead, arsenic, cadmium, mercury), microbiology (total plate count, yeast, mold, E. coli, Salmonella), aflatoxins, and moisture content. The company provides a Certificate of Analysis (COA) with every shipment, verified by both in-house and third-party accredited laboratories.",
  },
  {
    question: "What does Atlas Ingredients' Certificate of Analysis (COA) include?",
    answer:
      "Atlas Ingredients' Certificate of Analysis (COA) includes product identification and batch number, physical parameters (color, odor, taste, particle size, moisture content), chemical analysis (active compound percentages, pH), microbiological testing results (TPC, yeast, mold, coliforms, E. coli, Salmonella), heavy metals analysis (lead, arsenic, cadmium, mercury), pesticide residue testing results, and allergen information.",
  },
  {
    question: "What does EU Organic certification mean for Atlas Ingredients products?",
    answer:
      "EU Organic certification confirms that Atlas Ingredients' products comply with European Union organic farming and processing standards (EC 834/2007 and EC 889/2008). This means the products are produced without synthetic pesticides, chemical fertilizers, or GMOs, and maintain full traceability from farm to finished product. EU Organic certification is required for importing organic products into European Union member states.",
  },
  {
    question: "What does USDA NOP certification mean for Atlas Ingredients products?",
    answer:
      "USDA NOP (National Organic Program) certification confirms that Atlas Ingredients' products meet the United States Department of Agriculture's organic standards. Products certified under USDA NOP are produced and processed according to federal guidelines addressing soil quality, pest and weed control, and use of additives. This certification is mandatory for marketing organic products in the United States.",
  },
  {
    question: "What does JAS certification mean for Atlas Ingredients?",
    answer:
      "JAS (Japanese Agricultural Standard) certification confirms that Atlas Ingredients' products meet Japan's organic production and processing standards. JAS certification is required for any product labeled and sold as organic in the Japanese market. It ensures that farming practices, processing methods, and labeling comply with Japan's Ministry of Agriculture, Forestry and Fisheries (MAFF) regulations.",
  },
  {
    question: "What does ISO 22000 certification mean for Atlas Ingredients?",
    answer:
      "ISO 22000:2018 certification confirms that Atlas Ingredients has implemented an effective Food Safety Management System (FSMS). This international standard integrates HACCP principles with prerequisite programs and ensures systematic identification and control of food safety hazards throughout the supply chain, from raw material sourcing through processing, packaging, and distribution.",
  },
  {
    question: "What does HACCP certification mean for Atlas Ingredients' manufacturing?",
    answer:
      "HACCP (Hazard Analysis and Critical Control Points) certification confirms that Atlas Ingredients has implemented a systematic preventive approach to food safety. The HACCP system identifies physical, chemical, and biological hazards in the production process and establishes critical control points to prevent, eliminate, or reduce these hazards to safe levels. This is essential for meeting international food safety requirements.",
  },
  {
    question: "Which countries does Atlas Ingredients export to and what documentation is provided?",
    answer:
      "Atlas Ingredients exports to over 50 countries including the USA, EU member states (Germany, France, Netherlands, Italy, Spain), UK, Canada, Australia, Japan, South Korea, and countries across the Middle East, Southeast Asia, and Africa. Export documentation includes Certificate of Analysis (COA), MSDS, organic certificates, phytosanitary certificates, certificate of origin, and any country-specific compliance documentation required by the importing nation.",
  },
  {
    question: "What shipping and logistics terms does Atlas Ingredients offer?",
    answer:
      "Atlas Ingredients offers flexible international shipping terms including FOB (Free on Board), CIF (Cost, Insurance, and Freight), and CFR (Cost and Freight). The company handles export documentation, customs clearance support, and coordination with freight forwarders. Products are shipped in food-grade packaging with proper labeling and documentation for smooth customs clearance at the destination.",
  },
  {
    question: "What product categories does Atlas Ingredients offer?",
    answer:
      "Atlas Ingredients offers 1000+ SKUs across the following categories: organic herbs (Ashwagandha, Tulsi, Brahmi, Moringa, Shatavari), organic spices (turmeric, cumin, coriander, fenugreek, black pepper), herbal powders, botanical extracts, essential oils, oleoresins, nutraceutical ingredients, spray-dried fruit and vegetable powders, superfoods and super greens, plant-based proteins, mushroom powders, seeds and grains, teas and infusions, probiotics and enzymes, and custom blends.",
  },
  {
    question: "Does Atlas Ingredients offer custom formulation and blending services?",
    answer:
      "Yes, Atlas Ingredients provides custom formulation and blending services for B2B buyers. The company can develop custom ingredient blends, proprietary formulations, and specialized products based on customer specifications. Services include ingredient selection, ratio optimization, stability testing, and scale-up from lab to commercial production. Private label packaging is also available.",
  },
  {
    question: "What sustainability practices does Atlas Ingredients follow?",
    answer:
      "Atlas Ingredients is committed to sustainable practices including organic farming on 950 hectares of certified farmland without synthetic pesticides or chemical fertilizers, water conservation and soil health management, biodiversity preservation through crop rotation and natural pest control, sustainable harvesting methods that protect long-term crop viability, responsible waste management at processing facilities, and energy-efficient manufacturing processes.",
  },
  {
    question: "How does Atlas Ingredients manage its organic farmland?",
    answer:
      "Atlas Ingredients manages 950 hectares of farmland under organic certification across multiple regions in India. The farmland is cultivated following organic agricultural practices compliant with EU Organic, USDA NOP, and NPOP standards. This includes no use of synthetic pesticides or chemical fertilizers, natural pest management, crop rotation, composting, and regular soil testing. The farmland provides a controlled and traceable source of raw materials.",
  },
  {
    question: "What packaging capabilities does Atlas Ingredients have?",
    answer:
      "Atlas Ingredients operates an integrated packaging facility equipped with Form-Fill-Seal (FFS) machines in a clean room environment. Packaging options include standee pouches (100g, 250g, 500g, 1kg), bulk bags (25kg, 50kg), drums, and customized packaging. The clean room facility ensures contamination-free packaging meeting pharmaceutical and food-grade standards. Private label and custom packaging with buyer branding is also available.",
  },
  {
    question: "What is Atlas Ingredients' sample policy?",
    answer:
      "Atlas Ingredients provides product samples for verified business inquiries. To request a sample, buyers can submit an inquiry through the website or contact the sales team directly. Samples are dispatched with relevant documentation including Certificate of Analysis (COA) and organic certificates. The sales team typically responds within 24-48 hours with sample availability, pricing, and shipping details.",
  },
  {
    question: "What is the minimum order quantity (MOQ) at Atlas Ingredients?",
    answer:
      "The standard minimum order quantity (MOQ) at Atlas Ingredients is typically 25 kg for most products. MOQs may vary depending on the specific product, processing requirements (such as custom grinding or blending), and packaging specifications. For specialty items, custom extracts, or proprietary formulations, MOQs may be higher. Contact the sales team for specific MOQ information for your required products.",
  },
  {
    question: "What regulatory compliance does Atlas Ingredients maintain for exports?",
    answer:
      "Atlas Ingredients maintains comprehensive regulatory compliance for international exports including FSSAI (Food Safety and Standards Authority of India) registration, FDA (U.S. Food and Drug Administration) compliance for products exported to the USA, EU food safety regulations compliance, APEDA (Agricultural and Processed Food Products Export Development Authority) registration, and adherence to import regulations of all destination countries. The company provides all necessary compliance documentation with each shipment.",
  },
  {
    question: "How does Atlas Ingredients ensure traceability of its products?",
    answer:
      "Atlas Ingredients maintains complete farm-to-formula traceability for all products. Each batch is assigned a unique lot number that traces back to the specific farm or sourcing location, harvest date, processing records, quality test results, and packaging details. This traceability system ensures that any product can be tracked through every stage of the supply chain, from raw material sourcing to final delivery.",
  },
  {
    question: "What makes Atlas Ingredients different from other organic ingredient suppliers?",
    answer:
      "Atlas Ingredients differentiates itself through six key factors: (1) Direct manufacturer with own processing facilities, not a broker or trader. (2) Own organic farmland of 950 hectares, ensuring supply chain control. (3) Multi-certification compliance with EU Organic, USDA NOP, JAS, NPOP, ISO 22000, HACCP, and GMP. (4) In-house quality control laboratory for rigorous testing. (5) Custom formulation and private label support. (6) Proven global export experience across 50+ countries with full documentation support.",
  },
  {
    question: "How can I contact Atlas Ingredients for a business inquiry?",
    answer:
      "Business inquiries can be submitted through the Atlas Ingredients website contact form or inquiry form. The sales team is available to discuss product specifications, pricing, MOQs, sample requests, and custom requirements. For quotation requests, provide details such as product name, required quantity, quality specifications, desired packaging, and destination country. The team typically responds within 24-48 hours.",
  },
];

export default function AboutAEO() {
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
    script.id = "about-aeo-faq-schema";
    script.textContent = JSON.stringify(faqSchema, null, 2);

    const existing = document.getElementById("about-aeo-faq-schema");
    if (existing) {
      existing.remove();
    }

    document.head.appendChild(script);

    return () => {
      const el = document.getElementById("about-aeo-faq-schema");
      if (el) {
        el.remove();
      }
    };
  }, []);

  return (
    <article className="py-16 bg-white" itemScope itemType="https://schema.org/Organization">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Section 1: Company Authority Block */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Company Profile - Atlas Ingredients
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              A structured overview of Atlas Ingredients, a certified organic ingredients manufacturer and exporter from India.
            </p>
          </div>

          <Card className="border-emerald-200 shadow-lg">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Full Legal Name</h3>
                      <p className="text-sm text-gray-600" itemProp="legalName">Atlas Ingredients</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Trade Name</h3>
                      <p className="text-sm text-gray-600" itemProp="alternateName">Atlas Ingredients</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Factory className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Industry</h3>
                      <p className="text-sm text-gray-600">Organic Ingredients Manufacturing & Export</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Headquarters</h3>
                      <p className="text-sm text-gray-600" itemProp="address">Mehsana, Gujarat, India</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Established</h3>
                      <p className="text-sm text-gray-600">Leading organic company in India</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Organic Farmland</h3>
                      <p className="text-sm text-gray-600">950 hectares under organic certification</p>
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

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Export Markets</h3>
                      <p className="text-sm text-gray-600">50+ countries including USA, EU, UK, Japan, Australia</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Employees</h3>
                      <p className="text-sm text-gray-600" itemProp="numberOfEmployees">50-100</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Key Certifications</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-xs">EU Organic</Badge>
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-xs">USDA NOP</Badge>
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-xs">JAS</Badge>
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-xs">NPOP</Badge>
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-xs">India Organic</Badge>
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-xs">ISO 22000</Badge>
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-xs">HACCP</Badge>
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-xs">GMP</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Supply Chain Transparency */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Farm-to-Formula Supply Chain Process
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              A transparent, step-by-step overview of how Atlas Ingredients sources, processes, and delivers certified organic ingredients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-emerald-100 hover:shadow-lg transition-shadow relative">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Organic Farming</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Cultivation on 950 hectares of certified organic farmland across India. No synthetic pesticides, chemical fertilizers, or GMOs. Compliant with EU Organic, USDA NOP, and NPOP standards.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Harvesting & Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Sustainable harvesting methods that protect long-term crop viability. Raw materials are collected, sorted, and transported under controlled conditions to maintain quality and organic integrity.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Processing & Manufacturing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  ISO 22000 certified processing facility with pulverizer lines (800 kg/hour capacity). Clean room packaging environment. HACCP and GMP compliant operations for grinding, milling, extraction, and blending.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">4</div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Microscope className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Quality Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Every batch tested for pesticide residue, heavy metals (Pb, As, Cd, Hg), microbiology (TPC, yeast, mold, E. coli, Salmonella), aflatoxins, and moisture. Certificate of Analysis (COA) provided with each shipment.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">5</div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Box className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Packaging</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Form-Fill-Seal (FFS) machines in clean room facility. Options include standee pouches (100g to 1kg), bulk bags (25kg, 50kg), drums, and custom packaging with private label branding.
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">6</div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Truck className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">Export & Logistics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Exports to 50+ countries with FOB, CIF, and CFR shipping terms. Complete documentation support including COA, MSDS, organic certificates, phytosanitary certificates, and certificate of origin.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 3: Third-Party Validation */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Third-Party Validation & Compliance
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Independent certifications, quality standards, and regulatory compliance that validate Atlas Ingredients' products and processes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-emerald-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">Organic Certifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>EU Organic</strong> - Compliance with European Union organic farming and processing standards (EC 834/2007)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>USDA NOP</strong> - United States Department of Agriculture National Organic Program certification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>JAS</strong> - Japanese Agricultural Standard organic certification for Japan market</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>NPOP</strong> - National Programme for Organic Production, Government of India</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>India Organic</strong> - National organic certification recognized domestically and internationally</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-emerald-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">Quality & Safety Standards</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>ISO 22000:2018</strong> - Food Safety Management System for systematic hazard control</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>HACCP</strong> - Hazard Analysis and Critical Control Points for preventive food safety</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>GMP</strong> - Good Manufacturing Practices for consistent production quality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>In-house QC Lab</strong> - Comprehensive testing for pesticides, heavy metals, microbiology, aflatoxins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Third-party Lab Verification</strong> - Independent accredited laboratory validation for every batch</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-emerald-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <Scale className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">Export Compliance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>FSSAI</strong> - Food Safety and Standards Authority of India registered</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>FDA Compliance</strong> - U.S. Food and Drug Administration requirements for USA exports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>EU Regulations</strong> - Compliance with European food safety and organic import regulations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>APEDA</strong> - Agricultural and Processed Food Products Export Development Authority registered</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-emerald-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">Industry Memberships & Documentation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>APEDA Registered Exporter</strong> - Authorized organic product exporter under Indian government</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Certificate of Analysis (COA)</strong> - Provided with every batch shipped</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>MSDS</strong> - Material Safety Data Sheet available for all products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Phytosanitary Certificates</strong> - Plant health certificates for international trade</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 4: Expert Authority */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Atlas Ingredients is an Industry Expert
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Key differentiators that establish Atlas Ingredients as a trusted authority in organic ingredients manufacturing and export.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-3">
                  <Factory className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Direct Manufacturer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  Atlas Ingredients owns and operates its own processing facilities, including pulverizer lines and solvent extraction plants. As a direct manufacturer (not a broker or trader), the company offers better pricing, quality control, and supply reliability.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-3">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Own Organic Farmland</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  With 950 hectares of farmland under organic certification, Atlas Ingredients controls the supply chain from seed to finished product. This vertical integration ensures traceability, consistent quality, and uninterrupted supply.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Multi-Certification Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  Certified by EU Organic, USDA NOP, JAS, NPOP, India Organic, ISO 22000, HACCP, and GMP. This multi-certification compliance enables Atlas Ingredients to serve buyers across all major global markets.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-3">
                  <Beaker className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">In-House Quality Control Lab</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  Atlas Ingredients operates its own quality control laboratory for testing pesticide residue, heavy metals, microbiology, aflatoxins, and active compound analysis. Results are verified by independent third-party accredited laboratories.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-3">
                  <FlaskConical className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Custom Formulation Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  Atlas Ingredients offers custom blending, proprietary formulation development, and private label services. The team supports ingredient selection, ratio optimization, stability testing, and scale-up from lab to production.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-3">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Global Export Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  Proven export experience across 50+ countries with comprehensive documentation support. Atlas Ingredients handles FOB, CIF, and CFR shipping terms, customs documentation, and country-specific regulatory compliance.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 5: AI-Citation Q&A Pairs */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions About Atlas Ingredients
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Comprehensive answers about Atlas Ingredients' company profile, manufacturing, quality standards, certifications, and export capabilities.
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

      </div>
    </article>
  );
}
