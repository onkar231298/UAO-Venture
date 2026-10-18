import { useEffect } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Factory, Leaf, Award, Microscope, Package, Globe, 
  CheckCircle, ArrowRight, MapPin, Shield, Truck, 
  FileCheck, FlaskConical, Wheat, Droplets
} from "lucide-react";
import { Link } from "wouter";

export default function OrganicSupplierIndia() {
  useEffect(() => {
    document.title = "Top Organic Spice & Herb Supplier India | EU USDA JAS Certified | Atlas Ingredients";

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', "Atlas Ingredients - India's leading organic spice, herb & botanical ingredient manufacturer. EU Organic, USDA NOP, JAS certified. Own 950ha farmland. Direct manufacturer. Exports to 50+ countries.");
    }

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is Atlas Ingredients a manufacturer or a trading company?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Atlas Ingredients is a direct manufacturer based in Gujarat, India. We own 950 hectares of organic farmland, operate our own processing facility with in-house QC lab, and handle everything from cultivation to final packaging. We are not a trading company or broker."
          }
        },
        {
          "@type": "Question",
          "name": "What certifications does Atlas Ingredients hold?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Atlas Ingredients holds 8 major certifications: EU Organic (Regulation 2018/848), USDA NOP (National Organic Program), JAS (Japanese Agricultural Standard), NPOP (India Organic), ISO 22000:2018, HACCP, GMP, and Kosher/Halal certifications. All certificates are current and available for verification."
          }
        },
        {
          "@type": "Question",
          "name": "Which countries does Atlas Ingredients export to?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Atlas Ingredients exports to 50+ countries across 6 continents including major markets in the European Union (Germany, France, Netherlands, Italy, Spain), USA, Japan, United Kingdom, Middle East (UAE, Saudi Arabia), and Southeast Asia (Malaysia, Singapore, Thailand). We handle all export documentation and compliance requirements for each destination."
          }
        },
        {
          "@type": "Question",
          "name": "What organic products does Atlas Ingredients supply?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Atlas Ingredients offers 1000+ SKUs across categories: Organic Herbs (Ashwagandha, Moringa, Tulsi, Brahmi, Shatavari), Organic Spices (Turmeric, Cumin, Coriander, Fenugreek, Black Pepper), Herbal Extracts (standardized botanical extracts), Superfoods (Spirulina, Wheatgrass, Barley Grass, Amla), Essential Oils & Oleoresins, and Seeds & Grains (Flaxseed, Chia, Psyllium). All available in powder, extract, whole, and oil forms."
          }
        },
        {
          "@type": "Question",
          "name": "Does Atlas Ingredients supply organic spices for the EU market?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, Atlas Ingredients is a leading organic spice and herb supplier specifically for the EU market. We hold EU Organic certification under Regulation 2018/848 and provide complete EU import documentation including phytosanitary certificates, Certificate of Analysis, and organic certificates. We serve food manufacturers, supplement companies, and distributors across Germany, France, Netherlands, Italy, and other EU member states."
          }
        },
        {
          "@type": "Question",
          "name": "What is the minimum order quantity (MOQ) for Atlas Ingredients products?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "MOQ varies by product category and form. For bulk powders and whole herbs/spices, the typical MOQ is 500 kg. For extracts, the MOQ starts from 100 kg. For essential oils, the MOQ is 25 kg. We also offer trial orders and sample quantities for new customers evaluating our products. Contact our team for specific product MOQs."
          }
        },
        {
          "@type": "Question",
          "name": "How do I place an order with Atlas Ingredients?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The ordering process is simple: 1) Submit your inquiry with product requirements, 2) Receive free samples for evaluation, 3) Get a competitive quotation, 4) Confirm your order with agreed terms, 5) We process, test, and ship your order with full documentation. Typical lead time is 15-30 days depending on the product and quantity."
          }
        },
        {
          "@type": "Question",
          "name": "Does Atlas Ingredients offer private label and custom packaging?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, Atlas Ingredients offers comprehensive private label and custom packaging solutions. Our clean room FFS (Form-Fill-Seal) packaging facility can package in stand-up pouches, kraft bags, HDPE drums, fiber drums, and custom-printed retail packaging. We support private labeling with your brand, custom blends, and specific mesh sizes or extract ratios."
          }
        }
      ]
    };

    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Atlas Ingredients",
      "alternateName": "Atlas Ingredients",
      "url": window.location.origin,
      "description": "India's leading organic spice, herb & botanical ingredient manufacturer with EU Organic, USDA NOP, JAS certifications.",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IN",
        "addressRegion": "Gujarat",
        "addressLocality": "India"
      },
      "areaServed": ["EU", "US", "JP", "GB", "AE", "SG", "MY", "TH"],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Organic Ingredients Catalog",
        "itemListElement": [
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Organic Herbs" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Organic Spices" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Herbal Extracts" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Superfoods" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Essential Oils & Oleoresins" } },
          { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Seeds & Grains" } }
        ]
      },
      "numberOfEmployees": { "@type": "QuantitativeValue", "value": "200+" },
      "keywords": "organic spice supplier India, organic herb manufacturer India, EU organic certified India, USDA NOP certified India, organic ingredient exporter"
    };

    const faqScript = document.createElement('script');
    faqScript.type = 'application/ld+json';
    faqScript.text = JSON.stringify(faqSchema);
    faqScript.id = 'organic-supplier-faq-schema';

    const orgScript = document.createElement('script');
    orgScript.type = 'application/ld+json';
    orgScript.text = JSON.stringify(orgSchema);
    orgScript.id = 'organic-supplier-org-schema';

    document.getElementById('organic-supplier-faq-schema')?.remove();
    document.getElementById('organic-supplier-org-schema')?.remove();
    document.head.appendChild(faqScript);
    document.head.appendChild(orgScript);

    return () => {
      document.getElementById('organic-supplier-faq-schema')?.remove();
      document.getElementById('organic-supplier-org-schema')?.remove();
    };
  }, []);

  const whyBfiCards = [
    {
      icon: Factory,
      title: "Direct Manufacturer",
      description: "We are a direct manufacturer — not a trader or broker. Our vertically integrated facility handles everything from raw material processing to finished product packaging, ensuring quality control at every step and competitive direct-from-source pricing.",
      highlight: "Not a Trading Company"
    },
    {
      icon: Leaf,
      title: "Own Organic Farmland",
      description: "Atlas Ingredients owns and operates 950 hectares of certified organic farmland in Gujarat, India. Our farm-to-factory model ensures complete traceability, consistent supply, and genuine organic integrity from seed to shipment.",
      highlight: "950 Hectares Certified"
    },
    {
      icon: Award,
      title: "Multi-Certification",
      description: "We hold 8 major international certifications: EU Organic (2018/848), USDA NOP, JAS, NPOP, ISO 22000:2018, HACCP, GMP, and Kosher/Halal. Every certification is current and verifiable by our customers.",
      highlight: "EU, USDA, JAS, NPOP, ISO, HACCP, GMP"
    },
    {
      icon: Microscope,
      title: "In-House QC Laboratory",
      description: "Our state-of-the-art in-house quality control laboratory performs comprehensive testing including HPLC analysis, heavy metals screening, microbiological testing, pesticide residue analysis, and aflatoxin testing — ensuring every batch meets international pharmacopeial standards.",
      highlight: "HPLC, Heavy Metals, Microbiology"
    },
    {
      icon: Package,
      title: "Clean Room FFS Packaging",
      description: "Our ISO-class clean room with Form-Fill-Seal (FFS) automated packaging lines ensure contamination-free processing. We offer stand-up pouches, kraft bags, HDPE drums, fiber drums, and custom-printed retail packaging with private label options.",
      highlight: "ISO Clean Room Facility"
    },
    {
      icon: Globe,
      title: "Global Export Experience",
      description: "With exports to 50+ countries across 6 continents, Atlas Ingredients has deep expertise in international trade compliance. We handle all export documentation, phytosanitary requirements, and customs clearance for seamless global delivery.",
      highlight: "50+ Countries, 6 Continents"
    }
  ];

  const productCategories = [
    {
      category: "Organic Herbs",
      icon: "🌿",
      products: "Ashwagandha, Moringa, Tulsi, Brahmi, Shatavari, Neem, Amla, Giloy, Arjuna, Shankhpushpi",
      certifications: "EU, USDA, JAS, NPOP",
      forms: "Powder, Extract, Whole, TBC, Granules",
      color: "bg-green-50 border-green-200"
    },
    {
      category: "Organic Spices",
      icon: "🌶️",
      products: "Turmeric, Cumin, Coriander, Fenugreek, Black Pepper, Cardamom, Ginger, Fennel, Mustard, Ajwain",
      certifications: "EU, USDA, JAS, NPOP",
      forms: "Powder, Whole, Crushed, Oleoresin",
      color: "bg-amber-50 border-amber-200"
    },
    {
      category: "Herbal Extracts",
      icon: "🧪",
      products: "Ashwagandha Extract (2.5–5% Withanolides), Turmeric Extract (95% Curcuminoids), Brahmi Extract, Boswellia Extract, Tribulus Extract",
      certifications: "EU, USDA, ISO, GMP",
      forms: "Standardized Extract, Ratio Extract, Liquid Extract",
      color: "bg-purple-50 border-purple-200"
    },
    {
      category: "Superfoods",
      icon: "🍃",
      products: "Spirulina, Wheatgrass, Barley Grass, Amla, Moringa Leaf, Beetroot, Triphala, Chlorella",
      certifications: "EU, USDA, JAS, NPOP",
      forms: "Powder, Tablet, Capsule-Ready Blend",
      color: "bg-emerald-50 border-emerald-200"
    },
    {
      category: "Essential Oils & Oleoresins",
      icon: "💧",
      products: "Turmeric Oil, Ginger Oil, Black Pepper Oil, Cumin Oleoresin, Fenugreek Oleoresin, Basil Oil",
      certifications: "EU, USDA, ISO, GMP",
      forms: "Essential Oil, Oleoresin, CO2 Extract",
      color: "bg-blue-50 border-blue-200"
    },
    {
      category: "Seeds & Grains",
      icon: "🌾",
      products: "Flaxseed, Chia Seeds, Psyllium Husk, Psyllium Seeds, Fenugreek Seeds, Sesame Seeds, Amaranth",
      certifications: "EU, USDA, JAS, NPOP",
      forms: "Whole, Powder, Husk, Mucilage",
      color: "bg-yellow-50 border-yellow-200"
    }
  ];

  const comparisonData = [
    { factor: "Business Type", bfi: "Direct Manufacturer with own factory", generic: "Trading company / Broker" },
    { factor: "Farmland", bfi: "Own 950 hectares organic certified farmland", generic: "No farmland, sourced from open market" },
    { factor: "Pricing", bfi: "Factory-direct pricing, no middleman markup", generic: "Multiple intermediary margins added" },
    { factor: "Traceability", bfi: "Full seed-to-shipment traceability", generic: "Limited or no traceability" },
    { factor: "Quality Control", bfi: "In-house QC lab with HPLC, GC-MS testing", generic: "Third-party testing only (if any)" },
    { factor: "Certifications", bfi: "8 certifications (EU, USDA, JAS, ISO, HACCP, GMP)", generic: "1–2 basic certifications" },
    { factor: "Packaging", bfi: "Clean room FFS packaging, private label available", generic: "Basic packaging, limited options" },
    { factor: "Documentation", bfi: "Complete export docs, CoA, phytosanitary certs", generic: "Basic invoicing only" }
  ];

  const marketsServed = [
    {
      region: "European Union",
      flag: "🇪🇺",
      countries: "Germany, France, Netherlands, Italy, Spain, Belgium, Poland, Czech Republic",
      details: "EU Organic Regulation 2018/848 compliant. Full TRACES-NT documentation. Regular shipments to major EU ports.",
      certRelevant: "EU Organic, Ecocert"
    },
    {
      region: "United States",
      flag: "🇺🇸",
      countries: "All 50 states — California, New York, New Jersey, Texas, Florida",
      details: "USDA NOP certified. FDA-compliant labeling. FSVP documentation provided. East & West coast port delivery.",
      certRelevant: "USDA NOP, FDA"
    },
    {
      region: "Japan",
      flag: "🇯🇵",
      countries: "Tokyo, Osaka, Nagoya, Yokohama",
      details: "JAS (Japanese Agricultural Standard) certified. Japanese-language CoA available. Regular container shipments to Japanese ports.",
      certRelevant: "JAS Organic"
    },
    {
      region: "United Kingdom",
      flag: "🇬🇧",
      countries: "England, Scotland, Wales, Northern Ireland",
      details: "Post-Brexit UK organic equivalence documentation. Serving food manufacturers, health food brands, and herbal supplement companies.",
      certRelevant: "UK Organic, DEFRA"
    },
    {
      region: "Middle East",
      flag: "🇦🇪",
      countries: "UAE, Saudi Arabia, Qatar, Oman, Kuwait, Bahrain",
      details: "Halal certified products. FIRS/ESMA compliance. Dubai and Jebel Ali port delivery. Arabic documentation available.",
      certRelevant: "Halal, ISO"
    },
    {
      region: "Southeast Asia",
      flag: "🇸🇬",
      countries: "Singapore, Malaysia, Thailand, Indonesia, Vietnam, Philippines",
      details: "Growing demand for organic superfoods and herbal ingredients. Competitive pricing for ASEAN markets. Short transit times from India.",
      certRelevant: "ISO, HACCP, GMP"
    }
  ];

  const orderSteps = [
    { step: 1, title: "Submit Inquiry", description: "Share your product requirements, target specifications, quantity, and destination. Our team responds within 24 hours.", icon: FileCheck },
    { step: 2, title: "Receive Samples", description: "We send free product samples with Certificate of Analysis for your quality evaluation. Samples shipped via DHL/FedEx.", icon: FlaskConical },
    { step: 3, title: "Get Quotation", description: "Receive a competitive quotation with FOB/CIF/DDP pricing, including all certifications and documentation costs.", icon: Shield },
    { step: 4, title: "Confirm Order", description: "Finalize order with agreed specifications, packaging, labeling requirements, and shipping terms. Production begins.", icon: Wheat },
    { step: 5, title: "Quality Testing & Shipment", description: "Every batch undergoes comprehensive QC testing. We handle all export documentation and arrange shipment to your port.", icon: Truck }
  ];

  return (
    <div className="atlas-public-theme min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 border-emerald-600 text-emerald-700 px-4 py-2">
              <MapPin className="w-4 h-4 mr-2" />
              Gujarat, India — Direct Manufacturer & Exporter
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Leading Organic Spice & Herb Supplier from India | Atlas Ingredients
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-10 leading-relaxed max-w-4xl mx-auto">
              Atlas Ingredients is India's premier <strong>organic spice supplier</strong> and <strong>organic herb manufacturer</strong> —
              EU Organic, USDA NOP, and JAS certified. Based in Gujarat, India, we are a vertically integrated manufacturer 
              with our own farmland, processing facility, and in-house QC lab. Trusted by buyers in 50+ countries for 
              consistent quality, competitive pricing, and complete export documentation.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100">
                <div className="text-3xl font-bold text-emerald-700">950</div>
                <div className="text-sm text-gray-600 mt-1">Hectares Organic Farmland</div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100">
                <div className="text-3xl font-bold text-emerald-700">1000+</div>
                <div className="text-sm text-gray-600 mt-1">Product SKUs</div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100">
                <div className="text-3xl font-bold text-emerald-700">50+</div>
                <div className="text-sm text-gray-600 mt-1">Countries Served</div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100">
                <div className="text-3xl font-bold text-emerald-700">8</div>
                <div className="text-sm text-gray-600 mt-1">International Certifications</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Atlas Ingredients is India's Top Organic Supplier
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From farm to finished product — here's what sets Atlas Ingredients apart from other Indian organic ingredient suppliers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyBfiCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="border-2 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{card.title}</CardTitle>
                    <Badge variant="secondary" className="w-fit text-xs mt-2">{card.highlight}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{card.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Product Categories Available for Export
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              1000+ organic products across 6 categories — all certified for international markets
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl shadow-sm overflow-hidden">
              <thead>
                <tr className="bg-emerald-700 text-white">
                  <th className="px-6 py-4 text-left font-semibold">Category</th>
                  <th className="px-6 py-4 text-left font-semibold">Key Products</th>
                  <th className="px-6 py-4 text-left font-semibold">Certifications</th>
                  <th className="px-6 py-4 text-left font-semibold">Available Forms</th>
                </tr>
              </thead>
              <tbody>
                {productCategories.map((cat, idx) => (
                  <tr key={cat.category} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      <span className="mr-2">{cat.icon}</span>{cat.category}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{cat.products}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {cat.certifications.split(", ").map((cert) => (
                          <Badge key={cert} variant="outline" className="text-xs border-emerald-300 text-emerald-700">{cert}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{cat.forms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 lg:hidden">
            {productCategories.map((cat) => (
              <Card key={cat.category} className={`border ${cat.color}`}>
                <CardHeader>
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <CardTitle className="text-lg">{cat.category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Products</span>
                    <p className="text-sm text-gray-600">{cat.products}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Certifications</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cat.certifications.split(", ").map((cert) => (
                        <Badge key={cert} variant="outline" className="text-xs">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Forms</span>
                    <p className="text-sm text-gray-600">{cat.forms}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comparison: Why Choose Atlas Ingredients Over Other Indian Suppliers
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              See how Atlas Ingredients compares to generic trading companies on 8 critical factors
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl shadow-sm overflow-hidden">
              <thead>
                <tr className="bg-emerald-700 text-white">
                  <th className="px-6 py-4 text-left font-semibold">Factor</th>
                  <th className="px-6 py-4 text-left font-semibold">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Atlas Ingredients
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left font-semibold">Generic Trading Companies</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, idx) => (
                  <tr key={row.factor} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 font-semibold text-gray-900">{row.factor}</td>
                    <td className="px-6 py-4 text-emerald-700 font-medium">
                      <span className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {row.bfi}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{row.generic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20 bg-emerald-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Markets Served — Global Organic Ingredient Supply
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Atlas Ingredients serves buyers in 50+ countries with market-specific certifications and compliance documentation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {marketsServed.map((market) => (
              <Card key={market.region} className="border-2 hover:border-emerald-300 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="text-4xl mb-2">{market.flag}</div>
                  <CardTitle className="text-xl">{market.region}</CardTitle>
                  <p className="text-sm text-gray-500">{market.countries}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-600 text-sm leading-relaxed">{market.details}</p>
                  <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700">{market.certRelevant}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How to Order from Atlas Ingredients
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Simple 5-step process from inquiry to delivery — we handle all documentation and logistics
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-0">
              {orderSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={step.step} className="flex gap-6 items-start relative">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg z-10">
                        {step.step}
                      </div>
                      {idx < orderSteps.length - 1 && (
                        <div className="w-0.5 h-20 bg-emerald-200 mt-2" />
                      )}
                    </div>
                    <div className="pb-12">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-emerald-600 to-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Source Premium Organic Ingredients Directly from India's Leading Manufacturer
          </h2>
          <p className="text-lg mb-10 max-w-3xl mx-auto text-emerald-50 leading-relaxed">
            Get factory-direct pricing on EU, USDA, and JAS certified organic spices, herbs, extracts, and superfoods. 
            Free samples available. Complete export documentation included.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <span className="inline-flex items-center bg-white text-emerald-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors cursor-pointer">
                Request Free Samples
                <ArrowRight className="w-5 h-5 ml-2" />
              </span>
            </Link>
            <Link href="/products">
              <span className="inline-flex items-center border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-700 transition-colors cursor-pointer">
                Browse All Products
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Common questions about sourcing organic ingredients from Atlas Ingredients, India
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                q: "Is Atlas Ingredients a manufacturer or a trading company?",
                a: "Atlas Ingredients is a direct manufacturer based in Gujarat, India. We own 950 hectares of organic farmland, operate our own processing facility with in-house QC lab, and handle everything from cultivation to final packaging. We are not a trading company or broker."
              },
              {
                q: "What certifications does Atlas Ingredients hold?",
                a: "Atlas Ingredients holds 8 major certifications: EU Organic (Regulation 2018/848), USDA NOP (National Organic Program), JAS (Japanese Agricultural Standard), NPOP (India Organic), ISO 22000:2018, HACCP, GMP, and Kosher/Halal certifications."
              },
              {
                q: "Which countries does Atlas Ingredients export to?",
                a: "Atlas Ingredients exports to 50+ countries across 6 continents including EU (Germany, France, Netherlands, Italy), USA, Japan, United Kingdom, Middle East (UAE, Saudi Arabia), and Southeast Asia (Malaysia, Singapore, Thailand)."
              },
              {
                q: "Does Atlas Ingredients supply organic spices for the EU market?",
                a: "Yes, Atlas Ingredients is a leading organic spice and herb supplier for the EU market. We hold EU Organic certification under Regulation 2018/848 and provide complete EU import documentation including phytosanitary certificates, CoA, and organic certificates."
              },
              {
                q: "What is the minimum order quantity (MOQ)?",
                a: "MOQ varies by product: bulk powders/whole herbs start from 500 kg, extracts from 100 kg, and essential oils from 25 kg. Trial orders and samples are available for new customers."
              },
              {
                q: "How do I place an order with Atlas Ingredients?",
                a: "Submit your inquiry → receive free samples → get a competitive quotation → confirm order → we process, test, and ship with full documentation. Typical lead time is 15–30 days."
              },
              {
                q: "Does Atlas Ingredients offer private label and custom packaging?",
                a: "Yes, our clean room FFS packaging facility supports stand-up pouches, kraft bags, HDPE drums, fiber drums, and custom-printed retail packaging with private labeling, custom blends, and specific mesh sizes."
              },
              {
                q: "What organic products does Atlas Ingredients supply?",
                a: "We offer 1000+ SKUs: Organic Herbs (Ashwagandha, Moringa, Tulsi, Brahmi), Organic Spices (Turmeric, Cumin, Coriander, Black Pepper), Herbal Extracts, Superfoods (Spirulina, Wheatgrass), Essential Oils & Oleoresins, and Seeds & Grains (Flaxseed, Chia, Psyllium)."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}