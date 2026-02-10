import { useState, useEffect, useRef } from "react";
import { 
  ChevronDown, 
  MapPin, 
  Package, 
  Factory, 
  FlaskConical, 
  Leaf, 
  Ship, 
  Users, 
  Handshake, 
  ArrowDown,
  Star,
  Award,
  Shield,
  CheckCircle2,
  Truck,
  BarChart3,
  Globe,
  Microscope,
  FileCheck,
  Box,
  Wheat,
  CircleDot
} from "lucide-react";

const COLORS = {
  turmericGold: "#C89B2B",
  herbalGreen: "#2E5E3E",
  chilliRed: "#9E1B1B",
  earthBrown: "#5A3E2B",
  offWhite: "#F8F5EF",
  charcoal: "#2C2C2C",
};

const sections = [
  { id: "hero", label: "Home" },
  { id: "credibility", label: "Group Foundation" },
  { id: "sourcing", label: "Sourcing Network" },
  { id: "portfolio", label: "Product Portfolio" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "quality", label: "Quality Control" },
  { id: "organic", label: "Organic Division" },
  { id: "logistics", label: "Export Logistics" },
  { id: "leadership", label: "Leadership" },
  { id: "value", label: "Why Bright Fame" },
  { id: "collaboration", label: "Engagement" },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function CountUp({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useInView();

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

export default function Presentation() {
  const [activeSection, setActiveSection] = useState("hero");
  const [navVisible, setNavVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setNavVisible(window.scrollY > 300);
      const sectionEls = sections.map(s => document.getElementById(s.id));
      for (let i = sectionEls.length - 1; i >= 0; i--) {
        const el = sectionEls[i];
        if (el && el.getBoundingClientRect().top <= 150) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="presentation-page" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", color: COLORS.charcoal }}>
      {/* Sticky Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: navVisible ? "rgba(44,44,44,0.97)" : "transparent",
          backdropFilter: navVisible ? "blur(12px)" : "none",
          transform: navVisible ? "translateY(0)" : "translateY(-100%)",
          borderBottom: navVisible ? `2px solid ${COLORS.turmericGold}` : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center h-14 overflow-x-auto">
          <span className="font-bold text-white whitespace-nowrap mr-6" style={{ color: COLORS.turmericGold, fontSize: "0.9rem" }}>
            BRIGHT FAME ORGANIC
          </span>
          <div className="flex gap-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-200"
                style={{
                  color: activeSection === s.id ? COLORS.charcoal : "rgba(255,255,255,0.7)",
                  background: activeSection === s.id ? COLORS.turmericGold : "transparent",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.earthBrown} 50%, ${COLORS.herbalGreen} 100%)` }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(200, 155, 43, 0.3) 0%, transparent 50%), 
                              radial-gradient(circle at 80% 30%, rgba(46, 94, 62, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 50% 80%, rgba(158, 27, 27, 0.2) 0%, transparent 50%)`,
          }} />
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <AnimatedSection>
            <div
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 text-sm font-medium"
              style={{ background: "rgba(200,155,43,0.15)", border: `1px solid ${COLORS.turmericGold}`, color: COLORS.turmericGold }}
            >
              <Star className="w-4 h-4" />
              Sister Concern of Bright Fame International – Three Star Export House
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              Bright Fame Organic
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={400}>
            <p className="text-xl md:text-2xl font-light mb-4" style={{ color: COLORS.turmericGold }}>
              Private Label Spice & Herbal Manufacturing Partner
            </p>
          </AnimatedSection>

          <AnimatedSection delay={600}>
            <p className="text-base md:text-lg text-gray-300 mb-12 max-w-3xl mx-auto">
              Structured Sourcing. Controlled Processing. Retail-Ready Packaging.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={800}>
            <button
              onClick={() => scrollTo("credibility")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold transition-all duration-300 hover:scale-105"
              style={{ background: COLORS.turmericGold, color: COLORS.charcoal }}
            >
              View Capabilities
              <ChevronDown className="w-5 h-5" />
            </button>
          </AnimatedSection>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <ArrowDown className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </section>

      {/* 2. GROUP CREDIBILITY */}
      <section id="credibility" className="py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.turmericGold }}>
                Our Foundation
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                Group Foundation & Export Recognition
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full" style={{ background: COLORS.turmericGold }} />
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <AnimatedSection delay={200}>
              <p className="text-lg leading-relaxed text-gray-700 mb-6">
                Bright Fame Organic operates as the dedicated organic and herbal division of 
                <strong> Bright Fame International</strong>, a company with deep roots in India's 
                agricultural export sector. The group brings a legacy of structured trade practices, 
                compliance-first documentation, and consistent export performance.
              </p>
              <p className="text-lg leading-relaxed text-gray-700">
                This foundation enables Bright Fame Organic to operate with an established export 
                documentation culture, institutional-grade process discipline, and a deep understanding 
                of global quality expectations from day one.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <div className="grid grid-cols-1 gap-6">
                <div className="p-6 rounded-2xl" style={{ background: "white", border: "1px solid #e5e7eb" }}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${COLORS.turmericGold}15` }}>
                      <Award className="w-7 h-7" style={{ color: COLORS.turmericGold }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Three Star Export House</h4>
                      <p className="text-gray-600 text-sm">Government of India recognition for consistent export performance and trade excellence</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-2xl" style={{ background: "white", border: "1px solid #e5e7eb" }}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${COLORS.herbalGreen}15` }}>
                      <FileCheck className="w-7 h-7" style={{ color: COLORS.herbalGreen }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Established Export Documentation</h4>
                      <p className="text-gray-600 text-sm">Proven compliance culture with structured processes for international trade documentation</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-2xl" style={{ background: "white", border: "1px solid #e5e7eb" }}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${COLORS.chilliRed}15` }}>
                      <Globe className="w-7 h-7" style={{ color: COLORS.chilliRed }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Government-Recognized Performance</h4>
                      <p className="text-gray-600 text-sm">Recognized by DGFT for sustained export growth and quality standards across multiple markets</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* 3. PAN-INDIA SOURCING NETWORK */}
      <section id="sourcing" className="py-24 md:py-32" style={{ background: "white" }}>
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.herbalGreen }}>
                Procurement Strength
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                Origin-Based Procurement System
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full" style={{ background: COLORS.herbalGreen }} />
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <AnimatedSection delay={200}>
              <p className="text-lg leading-relaxed text-gray-700 mb-8">
                Our structured mandi-based procurement model ensures direct access to India's finest 
                agricultural origins. Each product category is sourced from its most authentic production 
                region, ensuring optimal quality, traceability, and supply stability throughout the year.
              </p>

              {/* Sourcing Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {[
                  { location: "Guntur", product: "Red Chilli", color: COLORS.chilliRed },
                  { location: "Hassan", product: "Ginger", color: COLORS.earthBrown },
                  { location: "Dindigul", product: "Turmeric", color: COLORS.turmericGold },
                  { location: "Ramganj Mandi", product: "Coriander", color: COLORS.herbalGreen },
                  { location: "Kota Mandi", product: "Fenugreek", color: COLORS.earthBrown },
                  { location: "Major APMC Markets", product: "Multi-Commodity", color: COLORS.charcoal },
                ].map((item) => (
                  <div key={item.location} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                    <MapPin className="w-5 h-5 shrink-0" style={{ color: item.color }} />
                    <div>
                      <p className="font-semibold text-sm">{item.location}</p>
                      <p className="text-xs text-gray-500">{item.product}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              {/* India Map Visual */}
              <div className="relative rounded-3xl overflow-hidden p-8" style={{ background: `linear-gradient(135deg, ${COLORS.herbalGreen}08, ${COLORS.turmericGold}08)`, border: `1px solid ${COLORS.herbalGreen}20` }}>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.herbalGreen }}>Pan-India Sourcing Network</h3>
                  <p className="text-sm text-gray-500">Direct mandi access across key agricultural belts</p>
                </div>

                {/* Stylized Map Points */}
                <div className="relative w-full" style={{ paddingBottom: "120%" }}>
                  <svg viewBox="0 0 400 500" className="absolute inset-0 w-full h-full">
                    <path
                      d="M200,30 C180,40 150,50 140,80 C130,100 120,120 110,140 C95,170 70,190 60,220 C50,250 55,280 65,300 C75,320 80,340 90,360 C100,380 120,400 140,410 C160,420 180,430 200,440 C215,430 230,420 245,410 C265,395 280,380 290,360 C300,340 310,320 315,300 C320,280 325,260 320,240 C315,220 310,200 300,180 C290,160 285,140 280,120 C275,100 265,80 255,65 C245,50 225,40 200,30Z"
                      fill={`${COLORS.herbalGreen}10`}
                      stroke={COLORS.herbalGreen}
                      strokeWidth="1.5"
                      strokeOpacity="0.3"
                    />
                    {/* Location dots with labels */}
                    {[
                      { x: 175, y: 345, name: "Guntur", color: COLORS.chilliRed },
                      { x: 165, y: 375, name: "Hassan", color: COLORS.earthBrown },
                      { x: 195, y: 360, name: "Dindigul", color: COLORS.turmericGold },
                      { x: 225, y: 200, name: "Ramganj", color: COLORS.herbalGreen },
                      { x: 240, y: 220, name: "Kota", color: COLORS.earthBrown },
                    ].map((loc) => (
                      <g key={loc.name}>
                        <circle cx={loc.x} cy={loc.y} r="6" fill={loc.color} opacity="0.9" />
                        <circle cx={loc.x} cy={loc.y} r="10" fill={loc.color} opacity="0.2" />
                        <text x={loc.x + 14} y={loc.y + 4} fontSize="11" fill={COLORS.charcoal} fontWeight="600">{loc.name}</text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Procurement Value */}
              <div className="mt-8 text-center p-8 rounded-2xl" style={{ background: `linear-gradient(135deg, ${COLORS.turmericGold}, ${COLORS.earthBrown})` }}>
                <p className="text-sm font-medium text-white/80 uppercase tracking-widest mb-2">Average Monthly Procurement</p>
                <p className="text-4xl md:text-5xl font-bold text-white">
                  ₹<CountUp target={45} /> Crore+
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* 4. PRODUCT PORTFOLIO */}
      <section id="portfolio" className="py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.chilliRed }}>
                Product Range
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                Private Label Product Categories
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full" style={{ background: COLORS.chilliRed }} />
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Ground Spices */}
            <AnimatedSection delay={200}>
              <div className="bg-white rounded-2xl overflow-hidden h-full" style={{ border: `1px solid ${COLORS.chilliRed}15` }}>
                <div className="h-48 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${COLORS.chilliRed}10, ${COLORS.chilliRed}05)` }}>
                  <div className="text-center">
                    <Package className="w-16 h-16 mx-auto mb-3" style={{ color: COLORS.chilliRed }} />
                    <span className="text-sm font-medium text-gray-500">Product Imagery</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.chilliRed }}>Ground Spices</h3>
                  <ul className="space-y-2.5">
                    {["Red Chilli Powder", "Turmeric Powder", "Coriander Powder", "Cumin Powder", "Black Pepper Powder", "Ginger Powder", "Garam Masala", "Sambar Masala"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                        <CircleDot className="w-3 h-3 shrink-0" style={{ color: COLORS.chilliRed }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimatedSection>

            {/* Whole Spices */}
            <AnimatedSection delay={400}>
              <div className="bg-white rounded-2xl overflow-hidden h-full" style={{ border: `1px solid ${COLORS.turmericGold}15` }}>
                <div className="h-48 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${COLORS.turmericGold}10, ${COLORS.turmericGold}05)` }}>
                  <div className="text-center">
                    <Package className="w-16 h-16 mx-auto mb-3" style={{ color: COLORS.turmericGold }} />
                    <span className="text-sm font-medium text-gray-500">Product Imagery</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.turmericGold }}>Whole Spices</h3>
                  <ul className="space-y-2.5">
                    {["Whole Red Chilli", "Turmeric Fingers", "Coriander Seeds", "Cumin Seeds", "Fenugreek Seeds", "Black Pepper", "Mustard Seeds", "Fennel Seeds"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                        <CircleDot className="w-3 h-3 shrink-0" style={{ color: COLORS.turmericGold }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimatedSection>

            {/* Herbal Powders */}
            <AnimatedSection delay={600}>
              <div className="bg-white rounded-2xl overflow-hidden h-full" style={{ border: `1px solid ${COLORS.herbalGreen}15` }}>
                <div className="h-48 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${COLORS.herbalGreen}10, ${COLORS.herbalGreen}05)` }}>
                  <div className="text-center">
                    <Leaf className="w-16 h-16 mx-auto mb-3" style={{ color: COLORS.herbalGreen }} />
                    <span className="text-sm font-medium text-gray-500">Product Imagery</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.herbalGreen }}>Herbal Powders</h3>
                  <ul className="space-y-2.5">
                    {["Moringa Powder", "Ashwagandha Powder", "Brahmi Powder", "Neem Powder", "Amla Powder", "Tulsi Powder", "Shatavari Powder", "Triphala Powder"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                        <CircleDot className="w-3 h-3 shrink-0" style={{ color: COLORS.herbalGreen }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* 5. MANUFACTURING & PACKAGING */}
      <section id="manufacturing" className="py-24 md:py-32" style={{ background: "white" }}>
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.earthBrown }}>
                Infrastructure
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                Processing & Retail Packaging Capability
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full" style={{ background: COLORS.earthBrown }} />
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <AnimatedSection delay={200}>
              <div className="space-y-6">
                {[
                  { icon: <Factory className="w-6 h-6" />, title: "Cleaning & Grading", desc: "Multi-stage cleaning systems with destoning, magnetic separation, and precision grading for consistent raw material quality." },
                  { icon: <Package className="w-6 h-6" />, title: "Grinding Systems", desc: "Temperature-controlled grinding with hammer mills and pulverizers, ensuring particle size consistency and volatile oil retention." },
                  { icon: <Shield className="w-6 h-6" />, title: "Controlled Processing", desc: "Enclosed processing environment with humidity and temperature monitoring for batch-level quality assurance." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 rounded-xl" style={{ background: `${COLORS.earthBrown}06`, border: `1px solid ${COLORS.earthBrown}12` }}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${COLORS.earthBrown}12` }}>
                      <span style={{ color: COLORS.earthBrown }}>{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <div className="space-y-6">
                {[
                  { icon: <Box className="w-6 h-6" />, title: "Retail Pouch Formats", desc: "Flexible packaging from 50g to 1kg in stand-up pouches, flat pouches, and pillow packs with custom branding support." },
                  { icon: <Truck className="w-6 h-6" />, title: "Bulk Packs", desc: "Industrial packaging from 5kg to 25kg HDPE bags and corrugated cartons, suitable for institutional and wholesale supply." },
                  { icon: <BarChart3 className="w-6 h-6" />, title: "Batch Coding & Barcode", desc: "Integrated batch coding, MFG/EXP dating, and EAN-13 barcode printing for retail shelf compliance." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 rounded-xl" style={{ background: `${COLORS.earthBrown}06`, border: `1px solid ${COLORS.earthBrown}12` }}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${COLORS.earthBrown}12` }}>
                      <span style={{ color: COLORS.earthBrown }}>{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Image placeholder */}
              <div className="mt-8 rounded-2xl h-56 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${COLORS.earthBrown}10, ${COLORS.earthBrown}05)`, border: `1px dashed ${COLORS.earthBrown}30` }}>
                <div className="text-center">
                  <Factory className="w-12 h-12 mx-auto mb-2" style={{ color: `${COLORS.earthBrown}40` }} />
                  <p className="text-sm text-gray-400">Manufacturing & Packaging Facility</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* 6. QUALITY CONTROL & LAB */}
      <section id="quality" className="py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.chilliRed }}>
                Technical Excellence
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                In-House Laboratory & Compliance System
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full" style={{ background: COLORS.chilliRed }} />
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-16">
            <AnimatedSection delay={200}>
              <h3 className="text-xl font-bold mb-6" style={{ color: COLORS.charcoal }}>Laboratory Testing Capabilities</h3>
              <div className="space-y-4 mb-8">
                {[
                  { title: "Moisture & Microbial Testing", desc: "Precise moisture analysis and microbial count evaluation for every batch to ensure product safety" },
                  { title: "Physical & Chemical Analysis", desc: "Color value, ash content, volatile oil measurement, and granulometry for specification compliance" },
                  { title: "Adulteration Checks", desc: "Systematic testing for added starch, lead chromate, Sudan dyes, and other common adulterants" },
                  { title: "Batch-Level QC", desc: "Every production batch undergoes full quality cycle before release – zero tolerance for non-conformance" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <Microscope className="w-5 h-5 mt-0.5 shrink-0" style={{ color: COLORS.chilliRed }} />
                    <div>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-xl" style={{ background: `${COLORS.chilliRed}08`, border: `1px solid ${COLORS.chilliRed}15` }}>
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.chilliRed }}>European Standards Alignment</p>
                <p className="text-sm text-gray-600">
                  All testing aligned with European testing standards and methodologies, 
                  ensuring compatibility with the most stringent global requirements.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <h3 className="text-xl font-bold mb-6" style={{ color: COLORS.charcoal }}>Documentation Software</h3>
              <div className="space-y-4 mb-8">
                {[
                  { icon: <FileCheck className="w-5 h-5" />, title: "Automated COA Generation", desc: "Certificate of Analysis generated automatically from lab data – no manual errors" },
                  { icon: <FileCheck className="w-5 h-5" />, title: "Specification Sheet Generation", desc: "Product spec sheets created instantly from master data – consistent and professional" },
                  { icon: <Shield className="w-5 h-5" />, title: "Full Traceability System", desc: "Farm-to-dispatch traceability with lot tracking, supplier mapping, and test records" },
                  { icon: <CheckCircle2 className="w-5 h-5" />, title: "Error-Free Documentation", desc: "Software-driven documentation eliminates manual entry errors across all export and compliance documents" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start p-4 bg-white rounded-xl" style={{ border: "1px solid #e5e7eb" }}>
                    <span className="shrink-0 mt-0.5" style={{ color: COLORS.herbalGreen }}>{item.icon}</span>
                    <div>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lab image placeholder */}
              <div className="rounded-2xl h-44 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${COLORS.chilliRed}08, ${COLORS.herbalGreen}08)`, border: `1px dashed ${COLORS.chilliRed}25` }}>
                <div className="text-center">
                  <FlaskConical className="w-10 h-10 mx-auto mb-2" style={{ color: `${COLORS.chilliRed}40` }} />
                  <p className="text-sm text-gray-400">In-House Laboratory</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* 7. ORGANIC & HERBAL DIVISION */}
      <section id="organic" className="py-24 md:py-32 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.herbalGreen}, ${COLORS.herbalGreen}dd)` }}>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.1) 0%, transparent 60%),
                              radial-gradient(circle at 70% 70%, rgba(255,255,255,0.05) 0%, transparent 50%)`,
          }} />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                Specialized Operations
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                Dedicated Organic & Herbal Operations
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full" style={{ background: COLORS.turmericGold }} />
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Leaf className="w-8 h-8" />, title: "Certified Organic Sourcing", desc: "Direct procurement from certified organic farming clusters with valid certification documentation at every stage" },
              { icon: <Shield className="w-8 h-8" />, title: "Segregated Storage", desc: "Dedicated organic warehouse zones with physical separation from conventional inventory – zero contamination risk" },
              { icon: <Wheat className="w-8 h-8" />, title: "Dedicated Herbal Procurement", desc: "Specialized procurement channels for herbal raw materials with botanical identity verification and origin validation" },
              { icon: <Factory className="w-8 h-8" />, title: "Controlled Organic Handling", desc: "Separate processing lines for organic products with documented cleaning protocols between conventional and organic runs" },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 150}>
                <div className="p-6 rounded-2xl h-full" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <div className="mb-4" style={{ color: COLORS.turmericGold }}>
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* 8. EXPORT LOGISTICS */}
      <section id="logistics" className="py-24 md:py-32" style={{ background: "white" }}>
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.turmericGold }}>
                Logistics Capability
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                Factory-Level Export Logistics
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full" style={{ background: COLORS.turmericGold }} />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { icon: <Ship className="w-8 h-8" />, title: "Self-Sealing of Containers", desc: "Government-approved permission for self-sealing of export containers directly at the factory premises – ensuring cargo integrity from origin." },
                { icon: <Shield className="w-8 h-8" />, title: "Secure Factory Dispatch", desc: "Complete dispatch operations managed within the manufacturing unit, reducing handling stages and maintaining product safety." },
                { icon: <Truck className="w-8 h-8" />, title: "Streamlined Export Movement", desc: "Optimized logistics flow from production to port, with consolidated documentation and pre-clearance processing." },
                { icon: <CheckCircle2 className="w-8 h-8" />, title: "Reduced Port Dependency", desc: "Factory-level sealing eliminates the need for CFS/ICD dependency, reducing transit time and costs while minimizing handling risks." },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl" style={{ background: COLORS.offWhite, border: `1px solid ${COLORS.turmericGold}15` }}>
                  <div className="mb-4" style={{ color: COLORS.turmericGold }}>
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 9. LEADERSHIP & TEAM */}
      <section id="leadership" className="py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.herbalGreen }}>
                Our People
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                Management & Core Team
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full" style={{ background: COLORS.herbalGreen }} />
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Dr. Niraj Patel",
                role: "Founder & Managing Director",
                summary: "Visionary leader who built Bright Fame Organic from the ground up. Guides strategic direction, market expansion, and long-term business growth.",
                color: COLORS.turmericGold,
              },
              {
                name: "Ujjwal Dadhich",
                role: "Procurement Head",
                summary: "Leads origin-based procurement with deep APMC market relationships. Ensures supply stability, quality sourcing, and competitive pricing across all categories.",
                color: COLORS.herbalGreen,
              },
              {
                name: "Onkar Suryawanshi",
                role: "Operations Head",
                summary: "Food Technologist driving processing innovation, quality systems, and operational efficiency. Oversees production, certifications, and technology implementation.",
                color: COLORS.chilliRed,
              },
              {
                name: "Mr. Kamal Patel",
                role: "Supply Chain & Commercial Head",
                summary: "Manages end-to-end logistics, export documentation, and commercial operations. Ensures seamless movement from factory to global destinations.",
                color: COLORS.earthBrown,
              },
              {
                name: "Quality Head",
                role: "Quality Assurance Lead",
                summary: "Oversees in-house laboratory operations, batch-level quality control, and compliance documentation. Ensures every product meets specification.",
                color: COLORS.turmericGold,
              },
            ].map((member, i) => (
              <AnimatedSection key={i} delay={i * 150}>
                <div className="bg-white rounded-2xl overflow-hidden h-full" style={{ border: "1px solid #e5e7eb" }}>
                  <div className="h-48 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${member.color}12, ${member.color}06)` }}>
                    <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: `${member.color}15`, border: `2px solid ${member.color}30` }}>
                      <Users className="w-10 h-10" style={{ color: member.color }} />
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-lg">{member.name}</h4>
                    <p className="text-sm font-medium mb-3" style={{ color: member.color }}>{member.role}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{member.summary}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* 10. STRATEGIC PARTNERSHIP VALUE */}
      <section id="value" className="py-24 md:py-32" style={{ background: COLORS.charcoal }}>
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.turmericGold }}>
                Partnership Advantage
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                Why Bright Fame Organic for Private Label
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full" style={{ background: COLORS.turmericGold }} />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: <MapPin className="w-7 h-7" />, text: "Strong origin control with direct mandi access across India's key agricultural belts" },
                { icon: <BarChart3 className="w-7 h-7" />, text: "Structured procurement scale with ₹45 Crore+ monthly buying power" },
                { icon: <Factory className="w-7 h-7" />, text: "Controlled manufacturing environment with temperature-monitored processing lines" },
                { icon: <FlaskConical className="w-7 h-7" />, text: "EU-aligned lab system with automated COA and specification sheet generation" },
                { icon: <Ship className="w-7 h-7" />, text: "Self-sealing export capability directly from factory premises" },
                { icon: <Box className="w-7 h-7" />, text: "Retail-ready packaging formats from 50g pouches to 25kg bulk packs" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ color: COLORS.turmericGold }} className="shrink-0 mt-0.5">{item.icon}</span>
                  <p className="text-white/85 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 11. COLLABORATION PROCESS */}
      <section id="collaboration" className="py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-4xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.herbalGreen }}>
                Working Together
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                Proposed Engagement Model
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full" style={{ background: COLORS.herbalGreen }} />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <div className="relative">
              {[
                { step: "01", title: "Product Finalization", desc: "Define product categories, specifications, and quality parameters", color: COLORS.turmericGold },
                { step: "02", title: "Sample Development", desc: "Custom samples matching exact specification requirements", color: COLORS.chilliRed },
                { step: "03", title: "Packaging Alignment", desc: "Design approval, format selection, and branding integration", color: COLORS.earthBrown },
                { step: "04", title: "Commercial Discussion", desc: "Pricing structure, volume commitments, and terms finalization", color: COLORS.herbalGreen },
                { step: "05", title: "Pilot Order", desc: "Initial production run with full quality validation", color: COLORS.turmericGold },
                { step: "06", title: "Scale Rollout", desc: "Full-scale manufacturing and regular supply deployment", color: COLORS.chilliRed },
              ].map((item, i) => (
                <div key={i} className="flex gap-6 mb-2 last:mb-0">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: item.color }}
                    >
                      {item.step}
                    </div>
                    {i < 5 && (
                      <div className="w-0.5 h-16 my-1" style={{ background: `${item.color}30` }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-8">
                    <h4 className="font-bold text-lg" style={{ color: item.color }}>{item.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ background: COLORS.charcoal, borderTop: `3px solid ${COLORS.turmericGold}` }}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Bright Fame Organic</h3>
          <p className="text-sm mb-1" style={{ color: COLORS.turmericGold }}>
            Sister Concern of Bright Fame International – Three Star Export House
          </p>
          <p className="text-sm text-gray-400 mt-6">
            This presentation is prepared exclusively for partnership discussions. All information is confidential.
          </p>
          <p className="text-xs text-gray-500 mt-4">
            &copy; {new Date().getFullYear()} Bright Fame Organic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
