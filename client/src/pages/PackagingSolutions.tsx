import { useState, useEffect, useRef } from "react";
import {
  Package,
  Shield,
  CheckCircle2,
  Box,
  Ruler,
  Weight,
  Factory,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Star,
  Leaf,
  Award,
  Eye,
  Layers,
  Cog,
  Thermometer,
  Users,
  ShieldCheck
} from "lucide-react";
import bfiLogoImg from "@assets/Final Logo_1753730040470.png";
import standeeWhiteImg from "@assets/image_1770704885158.png";
import standeeBrownImg from "@assets/image_1770704849414.png";
import ffsMachineImg from "@assets/image_1770704939826.png";
import cleanroomFacilityImg from "@assets/image_1770705325041.png";


const COLORS = {
  turmericGold: "#C89B2B",
  herbalGreen: "#2E5E3E",
  offWhite: "#F8F5EF",
  charcoal: "#2C2C2C",
  cleanWhite: "#FFFFFF",
  lightGray: "#F4F6F8",
  steelBlue: "#3B5998",
};

const skuData = [
  { weight: "100g", dimensions: "130 × 200 mm", moq: "10,000 pcs", fill: "Powder / Granules", icon: "S" },
  { weight: "200g", dimensions: "150 × 230 mm", moq: "10,000 pcs", fill: "Powder / Granules / Whole", icon: "M" },
  { weight: "250g", dimensions: "160 × 250 mm", moq: "8,000 pcs", fill: "Powder / Granules / Whole", icon: "M" },
  { weight: "500g", dimensions: "180 × 290 mm", moq: "5,000 pcs", fill: "All Product Types", icon: "L" },
  { weight: "750g", dimensions: "200 × 320 mm", moq: "5,000 pcs", fill: "All Product Types", icon: "L" },
  { weight: "1 KG", dimensions: "220 × 350 mm", moq: "3,000 pcs", fill: "All Product Types", icon: "XL" },
];

const pouchFeatures = [
  { icon: Eye, label: "Clear Window", desc: "Front transparent window for product visibility" },
  { icon: Layers, label: "Multi-Layer Laminate", desc: "Food-grade PET/AL/PE lamination" },
  { icon: Shield, label: "Moisture Barrier", desc: "Superior moisture & oxygen barrier" },
  { icon: Box, label: "Standee Design", desc: "Self-standing bottom gusset pouch" },
  { icon: Leaf, label: "Food Safe", desc: "FDA & EU compliant materials" },
  { icon: Sparkles, label: "Blank White", desc: "Ready for custom private label printing" },
];

const cleanroomFeatures = [
  { icon: ShieldCheck, label: "Epoxy Flooring", desc: "Seamless, non-porous, easy-to-sanitize surface throughout the facility" },
  { icon: Thermometer, label: "Climate Controlled", desc: "Temperature & humidity regulated environment for product integrity" },
  { icon: Users, label: "PPE Protocol", desc: "Full food safety gear — hair nets, masks, gloves, shoe covers, lab coats" },
  { icon: Cog, label: "Automatic FFS", desc: "Fully automated Form-Fill-Seal machines for consistent, hygienic packaging" },
  { icon: Award, label: "FSSAI Certified", desc: "Compliant with all Indian food safety & hygiene regulations" },
  { icon: Factory, label: "ISO Clean Room", desc: "Controlled environment meeting ISO clean room standards" },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Anim({ children, delay = 0, type = "fade-up" }: { children: React.ReactNode; delay?: number; type?: string }) {
  const { ref, visible } = useInView(0.1);
  const base = "transition-all duration-700 ease-out";
  const hidden: Record<string, string> = {
    "fade-up": "opacity-0 translate-y-8",
    "fade-left": "opacity-0 translate-x-8",
    "fade-right": "opacity-0 -translate-x-8",
    "scale-up": "opacity-0 scale-95",
    "fade-in": "opacity-0",
  };
  const shown = "opacity-100 translate-y-0 translate-x-0 scale-100";
  return (
    <div
      ref={ref}
      className={`${base} ${visible ? shown : hidden[type] || hidden["fade-up"]}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

export default function PackagingSolutions() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: COLORS.lightGray, fontFamily: "'Inter', sans-serif" }}>

      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, #1a1a2e 50%, ${COLORS.herbalGreen} 100%)` }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(200,155,43,0.3) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(46,94,62,0.3) 0%, transparent 50%),
                              radial-gradient(circle at 50% 80%, rgba(59,89,152,0.2) 0%, transparent 50%)`
          }} />
        </div>

        <div
          className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto"
          style={{ transform: `translateY(${scrollY * 0.2}px)`, opacity: Math.max(0, 1 - scrollY * 0.002) }}
        >
          <Anim type="scale-up" delay={100}>
            <img src={bfiLogoImg} alt="Bright Fame Organic" className="h-16 sm:h-24 md:h-32 w-auto object-contain mx-auto mb-4 sm:mb-6 drop-shadow-2xl" />
          </Anim>
          <Anim type="fade-up" delay={300}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 sm:mb-6 text-xs sm:text-sm font-medium" style={{ background: "rgba(200,155,43,0.15)", border: `1px solid ${COLORS.turmericGold}`, color: COLORS.turmericGold }}>
              <Star className="w-3.5 h-3.5" />
              Private Label Packaging Solutions
            </div>
          </Anim>
          <Anim type="fade-up" delay={500}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-5 leading-tight tracking-tight">
              Packaging Solutions
            </h1>
          </Anim>
          <Anim type="fade-up" delay={700}>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed">
              Premium standee pouches with clear windows in food-grade materials, packed in a fully automated, ISO-certified clean room environment
            </p>
          </Anim>
          <Anim type="fade-up" delay={900}>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><Package className="w-4 h-4" style={{ color: COLORS.turmericGold }} /> 100g – 1 KG SKUs</span>
              <span className="hidden sm:inline text-gray-600">|</span>
              <span className="flex items-center gap-1.5"><Factory className="w-4 h-4" style={{ color: COLORS.turmericGold }} /> Automatic FFS Machine</span>
              <span className="hidden sm:inline text-gray-600">|</span>
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" style={{ color: COLORS.turmericGold }} /> Clean Room Facility</span>
            </div>
          </Anim>
          <Anim type="fade-in" delay={1200}>
            <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8 text-white/40 mx-auto mt-8 sm:mt-12 animate-bounce" />
          </Anim>
        </div>
      </section>

      {/* Standee Pouch Section */}
      <section className="py-16 sm:py-20 md:py-28" style={{ background: COLORS.cleanWhite }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Anim type="fade-up">
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-3" style={{ background: `${COLORS.turmericGold}15`, color: COLORS.turmericGold }}>
                Our Pouches
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" style={{ color: COLORS.charcoal }}>
                White Standee Pouches with Window
              </h2>
              <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
                Blank white stand-up pouches with clear front windows — ready for your brand's private label. Food-grade, moisture-proof, and available in 6 SKU sizes.
              </p>
            </div>
          </Anim>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
            {/* Pouch Image */}
            <Anim type="fade-right" delay={200}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                <img src={standeeWhiteImg} alt="White Standee Pouch with Window" className="w-full h-[350px] sm:h-[450px] md:h-[500px] object-contain bg-gray-50 p-4 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Blank White Standee Pouch</h3>
                  <p className="text-xs sm:text-sm text-gray-200">Stand-up bottom gusset with clear front window</p>
                </div>
              </div>
            </Anim>

            {/* Pouch Features */}
            <div className="space-y-4 sm:space-y-5">
              {pouchFeatures.map((f, i) => (
                <Anim key={f.label} type="fade-left" delay={100 + i * 100}>
                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:shadow-md transition-shadow" style={{ background: COLORS.lightGray }}>
                    <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center" style={{ background: `${COLORS.herbalGreen}15` }}>
                      <f.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: COLORS.herbalGreen }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base" style={{ color: COLORS.charcoal }}>{f.label}</h4>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                </Anim>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SKU Grid Section */}
      <section className="py-16 sm:py-20 md:py-28" style={{ background: COLORS.lightGray }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Anim type="fade-up">
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-3" style={{ background: `${COLORS.herbalGreen}15`, color: COLORS.herbalGreen }}>
                Available SKUs
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" style={{ color: COLORS.charcoal }}>
                100g to 1 KG — Six Standard Sizes
              </h2>
              <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
                Choose from our range of standee pouch sizes, all featuring bottom gusset construction, clear front window, and zipper reseal
              </p>
            </div>
          </Anim>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {skuData.map((sku, i) => (
              <Anim key={sku.weight} type="scale-up" delay={100 + i * 80}>
                <div className="relative bg-white rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-amber-200 group overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[40px] flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${COLORS.turmericGold}, ${COLORS.herbalGreen})` }}>
                    {sku.icon}
                  </div>

                  <div className="mb-4">
                    <h3 className="text-2xl sm:text-3xl font-bold" style={{ color: COLORS.charcoal }}>{sku.weight}</h3>
                    <p className="text-xs text-gray-400 mt-1">Standee Pouch</p>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <Ruler className="w-4 h-4 shrink-0" style={{ color: COLORS.turmericGold }} />
                      <span><span className="font-medium text-gray-800">Size:</span> {sku.dimensions}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <Weight className="w-4 h-4 shrink-0" style={{ color: COLORS.turmericGold }} />
                      <span><span className="font-medium text-gray-800">MOQ:</span> {sku.moq}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <Package className="w-4 h-4 shrink-0" style={{ color: COLORS.turmericGold }} />
                      <span><span className="font-medium text-gray-800">Suitable:</span> {sku.fill}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                    {["Window", "Zipper", "Bottom Gusset", "Food Grade"].map(tag => (
                      <span key={tag} className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full" style={{ background: `${COLORS.herbalGreen}10`, color: COLORS.herbalGreen }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* FFS Machine & Clean Room Section */}
      <section className="py-16 sm:py-20 md:py-28" style={{ background: COLORS.cleanWhite }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Anim type="fade-up">
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-3" style={{ background: `${COLORS.steelBlue}15`, color: COLORS.steelBlue }}>
                Our Facility
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" style={{ color: COLORS.charcoal }}>
                Automatic FFS Machine in Clean Room
              </h2>
              <p className="text-sm sm:text-base text-gray-500 max-w-3xl mx-auto">
                Our fully automatic Form-Fill-Seal machines operate inside a dedicated clean room with epoxy flooring, climate control, and strict food safety protocols
              </p>
            </div>
          </Anim>

          {/* Two-column: Clean Room Left, FFS Machine Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
            <Anim type="fade-right" delay={200}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl group h-[300px] sm:h-[380px] md:h-[450px]">
                <img src={cleanroomFacilityImg} alt="Clean Room Facility with Epoxy Flooring" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5" style={{ color: COLORS.turmericGold }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.turmericGold }}>Clean Room Environment</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Epoxy-Coated Clean Room</h3>
                  <p className="text-xs sm:text-sm text-gray-200">Seamless epoxy flooring, positive air pressure, HEPA filtration</p>
                </div>
              </div>
            </Anim>

            <Anim type="fade-left" delay={300}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl group h-[300px] sm:h-[380px] md:h-[450px]">
                <img src={ffsMachineImg} alt="Automatic FFS Packaging Machine" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Cog className="w-5 h-5 animate-spin" style={{ color: COLORS.turmericGold, animationDuration: "8s" }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.turmericGold }}>Fully Automatic</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Form-Fill-Seal Machine</h3>
                  <p className="text-xs sm:text-sm text-gray-200">High-speed automatic packaging with precision weighing & sealing</p>
                </div>
              </div>
            </Anim>
          </div>

          {/* Full Pouch Range - Full Width */}
          <Anim type="scale-up" delay={200}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl group mb-12 sm:mb-16 bg-white">
              <img src={standeeBrownImg} alt="Standee Pouches - Complete Range of Sizes" className="w-full h-[280px] sm:h-[380px] md:h-[450px] object-contain p-4 sm:p-8 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/70 to-transparent">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">Complete Standee Pouch Range</h3>
                  <p className="text-sm sm:text-base text-gray-200 max-w-xl mx-auto">
                    Available in multiple sizes from 100g to 1 KG — with clear windows for product visibility
                  </p>
                </div>
              </div>
            </div>
          </Anim>

          {/* Clean Room Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {cleanroomFeatures.map((f, i) => (
              <Anim key={f.label} type="fade-up" delay={100 + i * 80}>
                <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3 sm:mb-4 transition-transform group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${COLORS.herbalGreen}15, ${COLORS.steelBlue}15)` }}>
                    <f.icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: COLORS.herbalGreen }} />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base mb-1.5" style={{ color: COLORS.charcoal }}>{f.label}</h4>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section className="py-16 sm:py-20 md:py-28" style={{ background: COLORS.charcoal }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Anim type="fade-up">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                Packaging Process Flow
              </h2>
              <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">
                From raw material to sealed pouch — every step happens in our controlled clean room environment
              </p>
            </div>
          </Anim>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { step: "01", title: "Material Intake", desc: "Processed spices/herbs received from production in sealed containers", icon: Package },
              { step: "02", title: "Weighing & Dosing", desc: "Precision multi-head weigher doses exact quantity per pouch", icon: Weight },
              { step: "03", title: "Form-Fill-Seal", desc: "Automatic FFS machine forms pouch, fills product & seals in one motion", icon: Cog },
              { step: "04", title: "Quality Check", desc: "Metal detection, seal integrity, weight verification before packing", icon: CheckCircle2 },
            ].map((item, i) => (
              <Anim key={item.step} type="fade-up" delay={100 + i * 150}>
                <div className="relative p-5 sm:p-6 rounded-2xl text-center group" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="text-3xl sm:text-4xl font-black mb-3" style={{ color: `${COLORS.turmericGold}40` }}>{item.step}</div>
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${COLORS.turmericGold}20` }}>
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: COLORS.turmericGold }} />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-400">{item.desc}</p>
                  {i < 3 && (
                    <ArrowRight className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  )}
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section className="py-16 sm:py-20" style={{ background: `linear-gradient(135deg, ${COLORS.herbalGreen}, #1a3a2a)` }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Anim type="scale-up">
            <img src={bfiLogoImg} alt="Bright Fame Organic Logo" className="h-12 sm:h-16 w-auto object-contain mx-auto mb-4 sm:mb-6" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Ready to Discuss Your Packaging Needs?
            </h2>
            <p className="text-sm sm:text-base text-green-200 max-w-2xl mx-auto mb-6 sm:mb-8">
              Whether you need blank white standee pouches for private labelling or fully packed retail-ready products, our team is ready to help you scale.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
              <a href="/contact" className="inline-flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all hover:scale-105" style={{ background: COLORS.turmericGold, color: COLORS.charcoal }}>
                Get a Quote <ArrowRight className="w-4 h-4" />
              </a>
              <a href="/presentation" className="inline-flex items-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base text-white transition-all hover:scale-105" style={{ border: "2px solid rgba(255,255,255,0.3)" }}>
                View Full Presentation
              </a>
            </div>
          </Anim>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8" style={{ background: COLORS.charcoal, borderTop: `3px solid ${COLORS.turmericGold}` }}>
        <div className="max-w-5xl mx-auto px-4 text-center">
          <img src={bfiLogoImg} alt="Bright Fame Organic" className="h-10 sm:h-14 w-auto object-contain mx-auto mb-2 sm:mb-3" />
          <p className="text-xs sm:text-sm font-bold text-white">Bright Fame Organic</p>
          <p className="text-[10px] sm:text-xs mt-1" style={{ color: COLORS.turmericGold }}>
            Three Star Export House
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-3">
            &copy; {new Date().getFullYear()} Bright Fame Organic. All rights reserved. | Private & Confidential
          </p>
        </div>
      </footer>
    </div>
  );
}