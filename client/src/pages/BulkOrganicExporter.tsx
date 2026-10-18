import { useEffect } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Factory, Package, Globe, FileText, Shield, Truck, FlaskConical, Warehouse, CheckCircle, Anchor, Award } from "lucide-react";

const bulkProducts = [
  { name: "Ashwagandha", botanical: "Withania somnifera", forms: "Powder, Extract, Root Cut", moq: "100 kg", hsCode: "1211.90" },
  { name: "Moringa", botanical: "Moringa oleifera", forms: "Leaf Powder, Seed Oil, Capsules", moq: "100 kg", hsCode: "1211.90" },
  { name: "Turmeric", botanical: "Curcuma longa", forms: "Powder, Whole, Extract (Curcumin)", moq: "250 kg", hsCode: "0910.30" },
  { name: "Cumin", botanical: "Cuminum cyminum", forms: "Whole Seeds, Powder, Oil", moq: "250 kg", hsCode: "0909.31" },
  { name: "Coriander", botanical: "Coriandrum sativum", forms: "Whole Seeds, Powder, Split", moq: "250 kg", hsCode: "0909.21" },
  { name: "Fenugreek", botanical: "Trigonella foenum-graecum", forms: "Seeds, Powder, Extract", moq: "100 kg", hsCode: "0910.99" },
  { name: "Psyllium Husk", botanical: "Plantago ovata", forms: "Husk, Powder, Kha-Kha", moq: "500 kg", hsCode: "1211.90" },
  { name: "Spirulina", botanical: "Arthrospira platensis", forms: "Powder, Tablets, Flakes", moq: "50 kg", hsCode: "1212.29" },
  { name: "Amla", botanical: "Emblica officinalis", forms: "Powder, Extract, Dried Whole", moq: "100 kg", hsCode: "0813.40" },
  { name: "Neem", botanical: "Azadirachta indica", forms: "Leaf Powder, Oil, Extract", moq: "100 kg", hsCode: "1211.90" },
  { name: "Tulsi", botanical: "Ocimum sanctum", forms: "Leaf Powder, Extract, Oil", moq: "50 kg", hsCode: "1211.90" },
  { name: "Brahmi", botanical: "Bacopa monnieri", forms: "Powder, Extract (Bacosides)", moq: "50 kg", hsCode: "1211.90" },
  { name: "Senna", botanical: "Cassia angustifolia", forms: "Leaves, Pods, Extract", moq: "250 kg", hsCode: "1211.20" },
  { name: "Black Pepper", botanical: "Piper nigrum", forms: "Whole, Powder, Oleoresin", moq: "250 kg", hsCode: "0904.11" },
  { name: "Stevia", botanical: "Stevia rebaudiana", forms: "Leaf Powder, Extract, Liquid", moq: "25 kg", hsCode: "1212.99" },
];

const exportDocuments = [
  { name: "Certificate of Analysis (COA)", desc: "Detailed lab report with specifications, test results, and batch information" },
  { name: "Material Safety Data Sheet (MSDS)", desc: "Safety handling, storage, and transportation information" },
  { name: "Organic Certificates", desc: "EU Organic, USDA NOP, JAS (Japan), NPOP (India) certification documents" },
  { name: "Phytosanitary Certificate", desc: "Plant health certificate issued by the Directorate of Plant Protection" },
  { name: "Certificate of Origin", desc: "Country of origin document for customs clearance" },
  { name: "Bill of Lading", desc: "Shipping document for ocean freight consignments" },
  { name: "Commercial Invoice & Packing List", desc: "Detailed invoice with HS codes, quantities, and packaging details" },
];

const faqs = [
  {
    question: "What is the minimum order quantity (MOQ) for bulk organic ingredients?",
    answer: "Our MOQ starts from 25 kg for specialty items like Stevia and goes up to 500 kg for high-volume products like Psyllium Husk. Standard MOQ for most organic herbs and spices is 100–250 kg. We also offer trial orders for new customers."
  },
  {
    question: "Which organic certifications do your bulk ingredients carry?",
    answer: "All our bulk organic ingredients are certified under EU Organic Regulation (834/2007), USDA NOP, JAS (Japan Organic), and NPOP (India Organic). Certifications are issued by Ecocert and available upon request with every shipment."
  },
  {
    question: "Do you provide export documentation for international shipments?",
    answer: "Yes, we provide complete export documentation including Certificate of Analysis (COA), MSDS, organic certificates, phytosanitary certificate, certificate of origin, bill of lading, and commercial invoice with packing list."
  },
  {
    question: "What shipping terms (Incoterms) do you offer?",
    answer: "We offer FOB (Mundra/Nhava Sheva), CIF (to your nearest port), and CFR terms. Shipments are available via FCL (20ft/40ft containers) or LCL for smaller orders. We ship from Mundra Port (Gujarat) and Nhava Sheva (Mumbai)."
  },
  {
    question: "What quality testing is done on bulk organic orders?",
    answer: "Every bulk order undergoes rigorous testing including pesticide residue analysis (EU MRL compliance), heavy metals screening (lead, arsenic, cadmium, mercury), microbiological testing (TPC, E. coli, Salmonella, yeast & mold), aflatoxin analysis, and moisture content verification."
  },
  {
    question: "What is your processing and supply capacity?",
    answer: "Our facility has a total processing capacity of 1,600 kg/hour with two pulverizer lines (800 kg/hr each). We also operate a solvent extraction plant in Tamil Nadu and a dedicated cumin sorting unit. Our warehouse has substantial storage capacity including cold storage facilities."
  },
];

export default function BulkOrganicExporter() {
  useEffect(() => {
    document.title = "Bulk Organic Ingredients Exporter India | Wholesale Organic Herbs Spices | Atlas Ingredients";

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Leading bulk organic ingredients exporter from India. Wholesale supplier of certified organic herbs, spices, and botanical ingredients to EU, USA, and global markets. MOQ from 25kg. 1600 kg/hr processing capacity. USDA, EU, JAS certified.');
    }

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(faqSchema);
    script.id = 'bulk-exporter-faq-schema';

    const existing = document.getElementById('bulk-exporter-faq-schema');
    if (existing) existing.remove();
    document.head.appendChild(script);

    return () => {
      const schemaScript = document.getElementById('bulk-exporter-faq-schema');
      if (schemaScript) schemaScript.remove();
    };
  }, []);

  return (
    <div className="atlas-public-theme min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-to-br from-emerald-50 to-green-100 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-emerald-600 text-white px-4 py-2 rounded-full flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Certified Bulk Exporter
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Bulk Organic Ingredients Exporter from India | Atlas Ingredients
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Direct manufacturer and wholesale supplier of certified organic herbs, spices, and botanical ingredients.
              Serving food, nutraceutical, and pharmaceutical industries across EU, USA, and 50+ countries.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2 text-base">
                <Factory className="w-4 h-4 mr-2" />
                1,600 kg/hr Processing
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-base">
                <Package className="w-4 h-4 mr-2" />
                1,000+ SKUs
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-base">
                <Truck className="w-4 h-4 mr-2" />
                MOQ from 25 kg
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-base">
                <Award className="w-4 h-4 mr-2" />
                EU | USDA | JAS Certified
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Bulk Supply Capabilities
            </h2>
            <p className="text-xl text-gray-600">
              State-of-the-art infrastructure for large-scale organic ingredient processing and export
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Factory className="w-12 h-12 text-emerald-600 mb-4" />
                <CardTitle>Processing Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Two pulverizer lines — 800 kg/hr each</li>
                  <li>• Total capacity: 1,600 kg/hour</li>
                  <li>• Grinding, sieving, and blending</li>
                  <li>• Dedicated cleaning and de-stoning</li>
                  <li>• Multi-product processing lines</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <FlaskConical className="w-12 h-12 text-emerald-600 mb-4" />
                <CardTitle>Extraction & Sorting</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Solvent extraction plant (Tamil Nadu)</li>
                  <li>• Oleoresin and essential oil extraction</li>
                  <li>• Dedicated cumin sorting unit</li>
                  <li>• Color sorting and grading machines</li>
                  <li>• Standardized extract production</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Warehouse className="w-12 h-12 text-emerald-600 mb-4" />
                <CardTitle>Storage & Cold Chain</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Large warehousing capacity</li>
                  <li>• Temperature-controlled cold storage</li>
                  <li>• Separate organic and conventional zones</li>
                  <li>• FIFO inventory management</li>
                  <li>• Pest-controlled environment</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-3">
              <CardHeader>
                <Package className="w-12 h-12 text-emerald-600 mb-4" />
                <CardTitle>Bulk Packaging Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-700 mb-2">25 kg</div>
                    <p className="text-gray-600 text-sm">PP woven bags with liner — standard bulk</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-700 mb-2">50 kg</div>
                    <p className="text-gray-600 text-sm">PP woven bags — industrial bulk orders</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-700 mb-2">100g–1kg</div>
                    <p className="text-gray-600 text-sm">FFS pouches — retail-ready packaging</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-700 mb-2">Custom</div>
                    <p className="text-gray-600 text-sm">Private label & custom packaging available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Bulk Product Catalog
            </h2>
            <p className="text-xl text-gray-600">
              Key organic ingredients available for wholesale export — over 1,000 SKUs in total
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-emerald-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-600">
                  <TableHead className="text-white font-semibold">Product</TableHead>
                  <TableHead className="text-white font-semibold">Botanical Name</TableHead>
                  <TableHead className="text-white font-semibold">Available Forms</TableHead>
                  <TableHead className="text-white font-semibold">MOQ</TableHead>
                  <TableHead className="text-white font-semibold">HS Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkProducts.map((product, index) => (
                  <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-emerald-50/50"}>
                    <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                    <TableCell className="italic text-gray-600">{product.botanical}</TableCell>
                    <TableCell className="text-gray-600">{product.forms}</TableCell>
                    <TableCell className="text-gray-600">{product.moq}</TableCell>
                    <TableCell className="text-gray-600">{product.hsCode}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Export Documentation Provided
            </h2>
            <p className="text-xl text-gray-600">
              Complete documentation for hassle-free international trade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exportDocuments.map((doc, index) => (
              <Card key={index} className="border-emerald-200 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <FileText className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{doc.name}</h3>
                      <p className="text-sm text-gray-600">{doc.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-emerald-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Shipping Terms Available
            </h2>
            <p className="text-xl text-gray-600">
              Flexible Incoterms to suit your import requirements
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center border-emerald-200">
              <CardHeader>
                <Anchor className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <CardTitle>FOB</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Free On Board</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Mundra Port, Gujarat</li>
                  <li>• Nhava Sheva (JNPT), Mumbai</li>
                  <li>• Buyer arranges ocean freight</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center border-emerald-200">
              <CardHeader>
                <Truck className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <CardTitle>CIF</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Cost, Insurance & Freight</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Delivered to your nearest port</li>
                  <li>• Insurance included</li>
                  <li>• Door-to-port pricing available</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center border-emerald-200">
              <CardHeader>
                <Globe className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <CardTitle>CFR</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Cost & Freight</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Freight included in price</li>
                  <li>• FCL (20ft / 40ft containers)</li>
                  <li>• LCL for smaller shipments</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Quality Testing Standards for Bulk Orders
            </h2>
            <p className="text-xl text-gray-600">
              Every bulk shipment undergoes rigorous quality control and lab testing
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { title: "Pesticide Residue", desc: "EU MRL compliance, multi-residue analysis (500+ pesticides)" },
              { title: "Heavy Metals", desc: "Lead, arsenic, cadmium, mercury within permissible limits" },
              { title: "Microbiology", desc: "TPC, E. coli, Salmonella, yeast & mold testing" },
              { title: "Aflatoxins", desc: "B1, B2, G1, G2 analysis as per EU/FDA limits" },
              { title: "Moisture Content", desc: "Verified to specification for shelf stability" },
            ].map((test, index) => (
              <Card key={index} className="border-emerald-200 text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <Shield className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">{test.title}</h3>
                  <p className="text-sm text-gray-600">{test.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Common questions from bulk buyers and importers
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-emerald-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Source Bulk Organic Ingredients from India?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Get competitive wholesale pricing, complete export documentation, and reliable supply
            for your organic ingredient requirements. MOQ from 25 kg.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Request Bulk Quote
            </a>
            <a
              href="/products"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-colors"
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
