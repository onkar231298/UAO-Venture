import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductFaq {
  id: number;
  productId: number;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
}

interface ProductFAQsProps {
  productId: number;
  product?: Product;
}

// Generate keyword-optimized default FAQs based on product
const generateDefaultFAQs = (product: Product): ProductFaq[] => {
  const productName = product.name.toLowerCase();
  const category = product.category?.name || 'ingredients';
  const botanical = product.botanicalName || product.name;
  
  let defaultFAQs: Partial<ProductFaq>[] = [];

  if (productName.includes('amla')) {
    defaultFAQs = [
      {
        question: `What is the vitamin C content in organic ${product.name}?`,
        answer: `Our organic ${product.name} contains naturally high levels of vitamin C, making it one of the richest natural sources. The exact vitamin C content varies by batch and is provided in our Certificate of Analysis (COA).`
      },
      {
        question: `Where can I buy bulk ${product.name} for supplement manufacturing in Europe and USA?`,
        answer: `BFI Organic supplies bulk ${product.name} directly to supplement manufacturers across Europe, USA, Canada, and Asia. We offer competitive wholesale pricing with USDA and EU organic certifications. Contact us for MOQ and pricing details.`
      },
      {
        question: `What is the shelf life and storage requirements for ${product.name}?`,
        answer: `Our ${product.name} has a shelf life of 24 months when stored in cool, dry conditions away from direct sunlight. We recommend storing at temperatures below 25°C with relative humidity less than 60%.`
      },
      {
        question: `Is your ${product.name} suitable for pharmaceutical applications?`,
        answer: `Yes, our ${product.name} meets pharmaceutical grade standards and comes with complete documentation including COA, pesticide residue reports, and microbiological analysis suitable for pharma applications.`
      }
    ];
  } else if (productName.includes('haritaki')) {
    defaultFAQs = [
      {
        question: `Is ${product.name} suitable for Triphala formulation?`,
        answer: `Absolutely! Our ${product.name} (${botanical}) is specifically processed for use in traditional Triphala formulations and meets all quality standards for Ayurvedic preparations.`
      },
      {
        question: `What are the active compounds in organic ${product.name}?`,
        answer: `Our organic ${product.name} contains natural tannins, gallic acid, chebulinic acid, and other bioactive compounds. Detailed phytochemical analysis is available upon request.`
      },
      {
        question: `What is the minimum order quantity (MOQ) for bulk ${product.name} export?`,
        answer: `Our MOQ for ${product.name} is ${product.moq || '25 kg'} for international orders. We can accommodate larger quantities with advance notice and offer volume discounts for bulk orders.`
      }
    ];
  } else {
    // Generic organic ingredient FAQs
    defaultFAQs = [
      {
        question: `What certifications does your ${product.name} have?`,
        answer: `Our ${product.name} is certified organic by multiple international bodies including USDA Organic, EU Organic, and India Organic. All certificates and documentation are available upon request.`
      },
      {
        question: `What is the lead time for bulk orders of ${product.name} to Europe and North America?`,
        answer: `Typical lead time for ${product.name} orders is ${product.leadTime || '15-20 business days'} for Europe and North America, including quality testing and documentation preparation.`
      },
      {
        question: `Do you provide samples of ${product.name} for quality testing?`,
        answer: `Yes, we provide free samples (25-100g) of ${product.name} for quality evaluation. Samples include basic documentation and can be shipped worldwide.`
      },
      {
        question: `What packaging options are available for bulk ${product.name}?`,
        answer: `We offer various packaging options for ${product.name} including food-grade HDPE bags, fiber drums, and custom packaging solutions to meet your specific requirements.`
      }
    ];
  }

  return defaultFAQs.map((faq, index) => ({
    id: -(index + 1), // Negative IDs for default FAQs
    productId: product.id,
    question: faq.question!,
    answer: faq.answer!,
    displayOrder: index + 1,
    isActive: true
  }));
};

export default function ProductFAQs({ productId, product }: ProductFAQsProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const { data: databaseFaqs = [], isLoading } = useQuery({
    queryKey: ["/api/products", productId, "faqs"],
    queryFn: () => fetch(`/api/products/${productId}/faqs`).then(res => res.json())
  });

  // Combine database FAQs with generated default FAQs
  const allFaqs = product ? [
    ...databaseFaqs,
    ...(databaseFaqs.length === 0 ? generateDefaultFAQs(product) : [])
  ] : databaseFaqs;

  const toggleItem = (id: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (allFaqs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Product Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">No FAQs Available</h3>
            <p className="text-gray-600 text-sm">
              Contact us for any questions about this product.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Frequently Asked Questions
        </CardTitle>
        <CardDescription>
          Common questions about this product
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allFaqs.map((faq: ProductFaq) => (
            <Collapsible
              key={faq.id}
              open={openItems.has(faq.id)}
              onOpenChange={() => toggleItem(faq.id)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="font-medium text-gray-900">{faq.question}</span>
                {openItems.has(faq.id) ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <div className="text-gray-700 leading-relaxed">
                  {faq.answer}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}