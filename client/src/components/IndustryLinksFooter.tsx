import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export default function IndustryLinksFooter() {
  return (
    <section className="py-12 bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Industry-Specific Solutions
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our specialized organic ingredient solutions tailored for different industries
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="text-2xl">🍞</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Food Manufacturing</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    EU certified organic ingredients for bakery, processed foods, beverages, and ready meals.
                  </p>
                  <a 
                    href="/food-ingredients" 
                    className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Food Grade Ingredients <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="text-2xl">💊</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Pharmaceutical & Nutraceutical</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Premium organic herbs including Ashwagandha, Turmeric, Brahmi for supplement manufacturing.
                  </p>
                  <a 
                    href="/organic-herbs" 
                    className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Medicinal Herbs <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="text-2xl">🇪🇺</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">European Market</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    EU Regulation 834/2007 certified organic spices for German, French, and UK food companies.
                  </p>
                  <a 
                    href="/eu-organic-spices" 
                    className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    EU Organic Spices <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}