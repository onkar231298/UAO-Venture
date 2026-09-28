import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Wheat, FlaskConical, Globe2 } from "lucide-react";

export default function IndustryLinksFooter() {
  return (
    <section className="border-t border-[#e2e8db] bg-[#f4f5ed] py-14">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-green-950">
            Industry-Specific Solutions
          </h2>
          <p className="mx-auto max-w-2xl text-green-950/65">
            Explore our specialized organic ingredient solutions tailored for different industries
          </p>
        </div>
        
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          <Card className="group border-[#e0e7d9] bg-[#fffefa] shadow-sm transition-all hover:-translate-y-1 hover:border-[#95b259] hover:shadow-[0_12px_28px_rgba(41,74,44,0.10)]">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf1e5] text-[#718b57]">
                  <Wheat className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 font-semibold text-green-950">Food Manufacturing</h3>
                  <p className="mb-3 text-sm leading-relaxed text-green-950/65">
                    EU certified organic ingredients for bakery, processed foods, beverages, and ready meals.
                  </p>
                  <a 
                    href="/food-ingredients" 
                    className="inline-flex items-center text-sm font-medium text-green-800 hover:text-green-950"
                  >
                    Food Grade Ingredients <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group border-[#e0e7d9] bg-[#fffefa] shadow-sm transition-all hover:-translate-y-1 hover:border-[#95b259] hover:shadow-[0_12px_28px_rgba(41,74,44,0.10)]">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf1e5] text-[#718b57]">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 font-semibold text-green-950">Pharmaceutical & Nutraceutical</h3>
                  <p className="mb-3 text-sm leading-relaxed text-green-950/65">
                    Premium organic herbs including Ashwagandha, Turmeric, Brahmi for supplement manufacturing.
                  </p>
                  <a 
                    href="/organic-herbs" 
                    className="inline-flex items-center text-sm font-medium text-green-800 hover:text-green-950"
                  >
                    Medicinal Herbs <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group border-[#e0e7d9] bg-[#fffefa] shadow-sm transition-all hover:-translate-y-1 hover:border-[#95b259] hover:shadow-[0_12px_28px_rgba(41,74,44,0.10)]">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf1e5] text-[#718b57]">
                  <Globe2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 font-semibold text-green-950">European Market</h3>
                  <p className="mb-3 text-sm leading-relaxed text-green-950/65">
                    EU Regulation 834/2007 certified organic spices for German, French, and UK food companies.
                  </p>
                  <a 
                    href="/eu-organic-spices" 
                    className="inline-flex items-center text-sm font-medium text-green-800 hover:text-green-950"
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