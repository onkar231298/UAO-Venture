import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, FileCheck2, FlaskConical, Globe2, PackageCheck, Truck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Market = "usa" | "germany" | "uae";

const marketPages: Record<Market, {
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  intro: string;
  location: string;
  buyerTypes: string[];
}> = {
  usa: {
    title: "Organic Ingredient Supplier for USA B2B Buyers | Atlas Ingredients",
    description: "Source bulk organic ingredients, herbal powders and botanical extracts from India for USA food, supplement and wellness product requirements.",
    eyebrow: "B2B supply for the United States",
    heading: "Organic Ingredient Supplier for USA Buyers",
    intro: "Atlas Ingredients supports US importers, distributors and manufacturers evaluating bulk herbs, spices, powders and extracts from India.",
    location: "United States",
    buyerTypes: ["Food and beverage manufacturers", "Dietary supplement companies", "Ingredient distributors"],
  },
  germany: {
    title: "Organic Ingredient Supplier for Germany | Atlas Ingredients",
    description: "Source bulk organic spices, herbs, powders and botanical ingredients from India for German food, nutraceutical and distribution requirements.",
    eyebrow: "B2B ingredient sourcing for Germany",
    heading: "Organic Ingredient Supplier for Germany",
    intro: "Atlas Ingredients works with German buyers sourcing bulk organic and botanical ingredients from India for food, wellness and nutraceutical applications.",
    location: "Germany",
    buyerTypes: ["Food and spice manufacturers", "Nutraceutical businesses", "Organic ingredient distributors"],
  },
  uae: {
    title: "Organic Ingredient Exporter to UAE | Atlas Ingredients",
    description: "Source bulk organic herbs, spices, powders and botanical extracts from India with documentation and logistics coordination for UAE buyers.",
    eyebrow: "Bulk ingredient exports to the UAE",
    heading: "Organic Ingredient Exporter to UAE",
    intro: "Atlas Ingredients supports UAE importers, distributors and manufacturers sourcing bulk organic and botanical ingredients from India.",
    location: "United Arab Emirates",
    buyerTypes: ["Food and beverage businesses", "Wellness product companies", "Importers and ingredient distributors"],
  },
};

export default function RegionalIngredientSupplier({ market }: { market: Market }) {
  const page = marketPages[market];

  useEffect(() => {
    document.title = page.title;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (meta) meta.content = page.description;
  }, [page]);

  const steps = [
    { icon: FlaskConical, title: "Evaluate the ingredient", text: "Review the available form, specification and intended application before ordering." },
    { icon: FileCheck2, title: "Confirm documentation", text: "Request the product documents relevant to your quality and import review." },
    { icon: PackageCheck, title: "Agree packing and quantity", text: "Discuss minimum order quantity, packing format, sample needs and lead time." },
    { icon: Truck, title: "Plan the shipment", text: `Coordinate commercial terms and shipment details for delivery to ${page.location}.` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 py-20 text-white">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium">
                <Globe2 className="h-4 w-4" />
                {page.eyebrow}
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{page.heading}</h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-emerald-50">{page.intro}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="bg-white text-emerald-950 hover:bg-emerald-50">
                  <Link href="/products">Browse bulk ingredients <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white/10">
                  <Link href="/contact">Request a quote</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-6 md:grid-cols-3">
                {page.buyerTypes.map((buyer) => (
                  <Card key={buyer} className="border-emerald-100">
                    <CardHeader><CardTitle className="text-lg">{buyer}</CardTitle></CardHeader>
                    <CardContent className="text-sm leading-6 text-muted-foreground">
                      Bulk ingredient sourcing for product development, manufacturing or distribution requirements.
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold">A practical B2B sourcing process</h2>
                <p className="mt-3 text-muted-foreground">Confirm product suitability and import requirements before committing to a bulk order.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {steps.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex gap-4 rounded-xl border bg-background p-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800"><Icon className="h-5 w-5" /></div>
                    <div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>
                  </div>
                ))}
              </div>
              <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                Product availability, certifications and documents vary by ingredient. Buyers should confirm the current specification and regulatory suitability for their intended market and application.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}