import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, HelpCircle } from "lucide-react";

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
}

export default function ProductFAQs({ productId }: ProductFAQsProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["/api/products", productId, "faqs"],
    queryFn: () => fetch(`/api/products/${productId}/faqs`).then(res => res.json())
  });

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

  if (faqs.length === 0) {
    return null; // Don't show the section if there are no FAQs
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
          {faqs.map((faq: ProductFaq) => (
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