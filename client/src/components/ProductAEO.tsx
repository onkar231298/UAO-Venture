import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Leaf,
  Shield,
  Globe,
  Package,
  Factory,
  Award,
  FlaskConical,
  Truck,
  Box,
  Beaker,
  Heart,
  Star,
} from "lucide-react";

interface ProductAEOProps {
  product: {
    name: string;
    productId?: string;
    botanicalName?: string | null;
    category?: { name: string } | null;
    form?: string | null;
    plantPart?: string | null;
    origin?: string | null;
    description?: string | null;
    moq?: string | null;
    hsCode?: string | null;
    specifications?: any;
    certifications?: string[] | null;
    meshSize?: string | null;
    moistureContent?: string | null;
    shelfLife?: string | null;
    healthSupport?: string | null;
    currentStock?: string | number | null;
  };
}

export function ProductAEO({ product }: ProductAEOProps) {
  const certifications = Array.isArray(product.certifications) ? product.certifications : [];

  const industryApplications = [
    {
      icon: FlaskConical,
      name: "Pharmaceutical",
      description: `${product.name} is used as an active pharmaceutical ingredient (API) or excipient in pharmaceutical formulations, meeting pharmacopoeia standards.`,
    },
    {
      icon: Beaker,
      name: "Nutraceutical & Dietary Supplements",
      description: `Suitable for dietary supplement capsules, tablets, and powder blends. ${product.name} supports health and wellness product development.`,
    },
    {
      icon: Package,
      name: "Food & Beverage",
      description: `Food-grade ${product.name} for use in functional foods, beverages, seasonings, and flavoring applications.`,
    },
    {
      icon: Heart,
      name: "Cosmetic & Personal Care",
      description: `${product.name} is incorporated into skincare, haircare, and personal care products for its natural bioactive properties.`,
    },
    {
      icon: Leaf,
      name: "Ayurvedic & Traditional Medicine",
      description: `Used in traditional Ayurvedic formulations, herbal preparations, and classical medicine compositions.`,
    },
  ];

  return (
    <section
      aria-label={`Detailed product information for ${product.name}`}
      className="space-y-6"
      data-aeo="product-detail"
      data-product-name={product.name}
      data-product-id={product.productId}
    >
      <Card className="border-emerald-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Factory className="h-5 w-5" />
            Industry Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            {product.name} is suitable for use across multiple industries. Below are the primary sectors where this ingredient is applied:
          </p>
          <ul className="space-y-3" aria-label="Industry applications">
            {industryApplications.map((app, index) => (
              <li key={index} className="flex items-start gap-3">
                <app.icon className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-900">{app.name}:</span>{" "}
                  <span className="text-gray-700 text-sm">{app.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Shield className="h-5 w-5" />
            Sourcing and Quality Assurance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <article
            aria-label={`Sourcing and quality information for ${product.name}`}
            className="space-y-4 text-sm text-gray-700"
          >
            <p>
              This product is sourced from {product.origin ? `certified farms in ${product.origin}` : "certified organic farms in India"} by Cape NatureX Organic Pvt. Ltd. (Cape NatureX Organic), a vertically integrated manufacturer and exporter based in Mehsana, Gujarat, India.
            </p>
            <p>
              Quality testing includes in-house laboratory analysis at ISO-certified facilities, third-party verification, microbiological testing, heavy metals analysis, pesticide residue testing, and aflatoxin screening. Every batch undergoes HACCP-compliant processing and is tested to meet international pharmacopoeia and food safety standards.
            </p>
            {certifications.length > 0 && (
              <p>
                Certifications include: {certifications.join(", ")}. These certifications ensure compliance with international organic, food safety, and quality management standards.
              </p>
            )}
            <p>
              Available documentation for {product.name}: Certificate of Analysis (COA), Material Safety Data Sheet (MSDS), pesticide residue report, heavy metals report, microbiological analysis report, organic certificate, and allergen statement. All documents are provided with each shipment upon request.
            </p>
          </article>
        </CardContent>
      </Card>

      <Card className="border-emerald-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Star className="h-5 w-5" />
            Why Source {product.name} from Cape NatureX Organic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm" aria-label="Reasons to buy from Cape NatureX Organic">
            <li className="flex items-start gap-3">
              <Factory className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-900">Direct Manufacturer Pricing:</span>{" "}
                <span className="text-gray-700">
                  Cape NatureX Organic is a direct manufacturer, not a trading company. Buyers get factory-direct pricing without middlemen, ensuring competitive rates for bulk orders.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-900">Farm-to-Formula Traceability:</span>{" "}
                <span className="text-gray-700">
                  Complete supply chain transparency from 950+ hectares of organically certified farmland through processing, testing, and packaging. Full batch traceability provided.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Award className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-900">Multiple Organic Certifications:</span>{" "}
                <span className="text-gray-700">
                  Certified under USDA NOP, EU Organic, India Organic (NPOP), JAS (Japan), along with ISO 22000, HACCP, and GMP certifications for quality assurance.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Box className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-900">Custom Packaging Available:</span>{" "}
                <span className="text-gray-700">
                  Clean room packaging facility with Form-Fill-Seal (FFS) machines. Options include standee pouches (100g-1kg), bulk bags (25kg, 50kg), and private label packaging.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-900">Global Export Experience:</span>{" "}
                <span className="text-gray-700">
                  Exporting to 50+ countries across North America, Europe, Asia, and the Middle East. Experienced in international shipping documentation, customs compliance, and regulatory requirements.
                </span>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}