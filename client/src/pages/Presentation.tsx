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

type AnimationType = 
  | "fade-up" 
  | "fade-down"
  | "slide-left" 
  | "slide-right" 
  | "scale-up" 
  | "scale-rotate"
  | "flip-up"
  | "flip-left"
  | "rotate-in"
  | "bounce-in"
  | "blur-in"
  | "slide-up-bounce"
  | "zoom-in"
  | "swing-in"
  | "drop-in"
  | "expand-width"
  | "reveal-up";

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold, rootMargin: "0px 0px -50px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

function getInitialStyles(type: AnimationType): React.CSSProperties {
  switch (type) {
    case "fade-up":
      return { opacity: 0, transform: "translateY(60px)" };
    case "fade-down":
      return { opacity: 0, transform: "translateY(-60px)" };
    case "slide-left":
      return { opacity: 0, transform: "translateX(-80px)" };
    case "slide-right":
      return { opacity: 0, transform: "translateX(80px)" };
    case "scale-up":
      return { opacity: 0, transform: "scale(0.8)" };
    case "scale-rotate":
      return { opacity: 0, transform: "scale(0.7) rotate(-5deg)" };
    case "flip-up":
      return { opacity: 0, transform: "perspective(1000px) rotateX(25deg) translateY(40px)", transformOrigin: "bottom center" };
    case "flip-left":
      return { opacity: 0, transform: "perspective(1000px) rotateY(20deg) translateX(-30px)", transformOrigin: "right center" };
    case "rotate-in":
      return { opacity: 0, transform: "rotate(-8deg) translateY(40px) scale(0.95)" };
    case "bounce-in":
      return { opacity: 0, transform: "translateY(80px) scale(0.9)" };
    case "blur-in":
      return { opacity: 0, filter: "blur(12px)", transform: "translateY(30px) scale(1.02)" };
    case "slide-up-bounce":
      return { opacity: 0, transform: "translateY(100px)" };
    case "zoom-in":
      return { opacity: 0, transform: "scale(0.5)" };
    case "swing-in":
      return { opacity: 0, transform: "perspective(800px) rotateY(-15deg) translateX(-40px)", transformOrigin: "left center" };
    case "drop-in":
      return { opacity: 0, transform: "translateY(-80px) scale(0.95)" };
    case "expand-width":
      return { opacity: 0, transform: "scaleX(0.3) translateY(20px)", transformOrigin: "left center" };
    case "reveal-up":
      return { opacity: 0, clipPath: "inset(100% 0 0 0)" };
    default:
      return { opacity: 0, transform: "translateY(40px)" };
  }
}

function getFinalStyles(type: AnimationType): React.CSSProperties {
  switch (type) {
    case "blur-in":
      return { opacity: 1, filter: "blur(0px)", transform: "translateY(0) scale(1)" };
    case "reveal-up":
      return { opacity: 1, clipPath: "inset(0 0 0 0)" };
    default:
      return { opacity: 1, transform: "none", filter: "none" };
  }
}

function getTransition(type: AnimationType, delay: number): string {
  const d = `${delay}ms`;
  switch (type) {
    case "bounce-in":
    case "slide-up-bounce":
      return `opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${d}, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${d}`;
    case "flip-up":
    case "flip-left":
    case "swing-in":
      return `opacity 0.7s ease-out ${d}, transform 0.9s cubic-bezier(0.23, 1, 0.32, 1) ${d}`;
    case "scale-rotate":
    case "rotate-in":
      return `opacity 0.6s ease-out ${d}, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${d}`;
    case "blur-in":
      return `opacity 0.8s ease-out ${d}, filter 0.8s ease-out ${d}, transform 0.8s ease-out ${d}`;
    case "zoom-in":
      return `opacity 0.5s ease-out ${d}, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${d}`;
    case "expand-width":
      return `opacity 0.5s ease-out ${d}, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${d}`;
    case "reveal-up":
      return `opacity 0.6s ease-out ${d}, clip-path 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${d}`;
    default:
      return `opacity 0.7s ease-out ${d}, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${d}`;
  }
}

function Anim({ 
  children, 
  type = "fade-up", 
  delay = 0, 
  className = "",
  threshold = 0.12 
}: { 
  children: React.ReactNode; 
  type?: AnimationType; 
  delay?: number; 
  className?: string;
  threshold?: number;
}) {
  const { ref, isVisible } = useInView(threshold);
  
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...(isVisible ? getFinalStyles(type) : getInitialStyles(type)),
        transition: getTransition(type, delay),
        willChange: "opacity, transform, filter",
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
  const [heroScrollY, setHeroScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setNavVisible(window.scrollY > 300);
      setHeroScrollY(window.scrollY);
      const sectionEls = sections.map(s => document.getElementById(s.id));
      for (let i = sectionEls.length - 1; i >= 0; i--) {
        const el = sectionEls[i];
        if (el && el.getBoundingClientRect().top <= 150) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="presentation-page" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", color: COLORS.charcoal }}>
      {/* Sticky Navigation with smooth indicator */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: navVisible ? "rgba(44,44,44,0.97)" : "transparent",
          backdropFilter: navVisible ? "blur(12px)" : "none",
          transform: navVisible ? "translateY(0)" : "translateY(-100%)",
          borderBottom: navVisible ? `2px solid ${COLORS.turmericGold}` : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center h-14 overflow-x-auto pres-nav-scroll">
          <span className="font-bold text-white whitespace-nowrap mr-6" style={{ color: COLORS.turmericGold, fontSize: "0.9rem" }}>
            BRIGHT FAME ORGANIC
          </span>
          <div className="flex gap-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-300"
                style={{
                  color: activeSection === s.id ? COLORS.charcoal : "rgba(255,255,255,0.7)",
                  background: activeSection === s.id ? COLORS.turmericGold : "transparent",
                  transform: activeSection === s.id ? "scale(1.05)" : "scale(1)",
                  boxShadow: activeSection === s.id ? `0 0 12px ${COLORS.turmericGold}50` : "none",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO SECTION — Parallax zoom + fade-out on scroll
         ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.earthBrown} 50%, ${COLORS.herbalGreen} 100%)` }}
      >
        {/* Parallax background layer */}
        <div 
          className="absolute inset-0 transition-none"
          style={{
            transform: `scale(${1 + heroScrollY * 0.0003}) translateY(${heroScrollY * 0.2}px)`,
            opacity: Math.max(0, 1 - heroScrollY * 0.001),
          }}
        >
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(200, 155, 43, 0.4) 0%, transparent 50%), 
                              radial-gradient(circle at 80% 30%, rgba(46, 94, 62, 0.4) 0%, transparent 50%),
                              radial-gradient(circle at 50% 80%, rgba(158, 27, 27, 0.3) 0%, transparent 50%)`,
          }} />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="pres-particle absolute rounded-full"
              style={{
                width: `${4 + i * 2}px`,
                height: `${4 + i * 2}px`,
                background: i % 2 === 0 ? COLORS.turmericGold : COLORS.herbalGreen,
                left: `${15 + i * 14}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 1.5}s`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>

        <div 
          className="relative z-10 text-center px-6 max-w-5xl mx-auto"
          style={{
            transform: `translateY(${heroScrollY * 0.3}px)`,
            opacity: Math.max(0, 1 - heroScrollY * 0.002),
          }}
        >
          <Anim type="drop-in" delay={200}>
            <div
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 text-sm font-medium pres-badge-glow"
              style={{ background: "rgba(200,155,43,0.15)", border: `1px solid ${COLORS.turmericGold}`, color: COLORS.turmericGold }}
            >
              <Star className="w-4 h-4 pres-spin-slow" />
              Sister Concern of Bright Fame International – Three Star Export House
            </div>
          </Anim>

          <Anim type="scale-up" delay={500}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              Bright Fame Organic
            </h1>
          </Anim>

          <Anim type="blur-in" delay={800}>
            <p className="text-xl md:text-2xl font-light mb-4" style={{ color: COLORS.turmericGold }}>
              Private Label Spice & Herbal Manufacturing Partner
            </p>
          </Anim>

          <Anim type="fade-up" delay={1100}>
            <p className="text-base md:text-lg text-gray-300 mb-12 max-w-3xl mx-auto">
              Structured Sourcing. Controlled Processing. Retail-Ready Packaging.
            </p>
          </Anim>

          <Anim type="bounce-in" delay={1400}>
            <button
              onClick={() => scrollTo("credibility")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl pres-pulse-glow"
              style={{ background: COLORS.turmericGold, color: COLORS.charcoal }}
            >
              View Capabilities
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </button>
          </Anim>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <ArrowDown className="w-6 h-6 text-gray-400 pres-float" />
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.turmericGold}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          2. GROUP CREDIBILITY — Slide-left text + Slide-right cards with stagger
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="credibility" className="py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-6xl mx-auto px-6">
          <Anim type="fade-down">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.turmericGold }}>
                Our Foundation
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                Group Foundation & Export Recognition
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.turmericGold }} />
            </div>
          </Anim>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <Anim type="slide-left" delay={200}>
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
            </Anim>

            <div className="grid grid-cols-1 gap-6">
              {[
                { icon: <Award className="w-7 h-7" />, title: "Three Star Export House", desc: "Government of India recognition for consistent export performance and trade excellence", color: COLORS.turmericGold },
                { icon: <FileCheck className="w-7 h-7" />, title: "Established Export Documentation", desc: "Proven compliance culture with structured processes for international trade documentation", color: COLORS.herbalGreen },
                { icon: <Globe className="w-7 h-7" />, title: "Government-Recognized Performance", desc: "Recognized by DGFT for sustained export growth and quality standards across multiple markets", color: COLORS.chilliRed },
              ].map((item, i) => (
                <Anim key={i} type="slide-right" delay={300 + i * 200}>
                  <div className="p-6 rounded-2xl pres-card-hover" style={{ background: "white", border: "1px solid #e5e7eb" }}>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.color}15` }}>
                        <span style={{ color: item.color }}>{item.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </Anim>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.herbalGreen}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          3. SOURCING NETWORK — Swing-in text + Scale-rotate map + Glow counter
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="sourcing" className="py-24 md:py-32" style={{ background: "white" }}>
        <div className="max-w-6xl mx-auto px-6">
          <Anim type="zoom-in">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.herbalGreen }}>
                Procurement Strength
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                Origin-Based Procurement System
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.herbalGreen }} />
            </div>
          </Anim>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <Anim type="swing-in" delay={200}>
              <p className="text-lg leading-relaxed text-gray-700 mb-8">
                Our structured mandi-based procurement model ensures direct access to India's finest 
                agricultural origins. Each product category is sourced from its most authentic production 
                region, ensuring optimal quality, traceability, and supply stability throughout the year.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {[
                  { location: "Guntur", product: "Red Chilli", color: COLORS.chilliRed },
                  { location: "Hassan", product: "Ginger", color: COLORS.earthBrown },
                  { location: "Dindigul", product: "Turmeric", color: COLORS.turmericGold },
                  { location: "Ramganj Mandi", product: "Coriander", color: COLORS.herbalGreen },
                  { location: "Kota Mandi", product: "Fenugreek", color: COLORS.earthBrown },
                  { location: "Major APMC Markets", product: "Multi-Commodity", color: COLORS.charcoal },
                ].map((item, i) => (
                  <Anim key={item.location} type="expand-width" delay={400 + i * 100}>
                    <div className="flex items-center gap-3 p-3 rounded-xl pres-card-hover" style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                      <MapPin className="w-5 h-5 shrink-0" style={{ color: item.color }} />
                      <div>
                        <p className="font-semibold text-sm">{item.location}</p>
                        <p className="text-xs text-gray-500">{item.product}</p>
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>
            </Anim>

            <div>
              <Anim type="scale-rotate" delay={400}>
                <div className="relative rounded-3xl overflow-hidden p-8" style={{ background: `linear-gradient(135deg, ${COLORS.herbalGreen}08, ${COLORS.turmericGold}08)`, border: `1px solid ${COLORS.herbalGreen}20` }}>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.herbalGreen }}>Pan-India Sourcing Network</h3>
                    <p className="text-sm text-gray-500">Direct mandi access across key agricultural belts</p>
                  </div>

                  <div className="relative w-full" style={{ paddingBottom: "120%" }}>
                    <svg viewBox="0 0 400 500" className="absolute inset-0 w-full h-full">
                      <path
                        d="M200,30 C180,40 150,50 140,80 C130,100 120,120 110,140 C95,170 70,190 60,220 C50,250 55,280 65,300 C75,320 80,340 90,360 C100,380 120,400 140,410 C160,420 180,430 200,440 C215,430 230,420 245,410 C265,395 280,380 290,360 C300,340 310,320 315,300 C320,280 325,260 320,240 C315,220 310,200 300,180 C290,160 285,140 280,120 C275,100 265,80 255,65 C245,50 225,40 200,30Z"
                        fill={`${COLORS.herbalGreen}10`}
                        stroke={COLORS.herbalGreen}
                        strokeWidth="1.5"
                        strokeOpacity="0.3"
                        className="pres-map-path"
                      />
                      {[
                        { x: 175, y: 345, name: "Guntur", color: COLORS.chilliRed },
                        { x: 165, y: 375, name: "Hassan", color: COLORS.earthBrown },
                        { x: 195, y: 360, name: "Dindigul", color: COLORS.turmericGold },
                        { x: 225, y: 200, name: "Ramganj", color: COLORS.herbalGreen },
                        { x: 240, y: 220, name: "Kota", color: COLORS.earthBrown },
                      ].map((loc) => (
                        <g key={loc.name}>
                          <circle cx={loc.x} cy={loc.y} r="6" fill={loc.color} opacity="0.9" className="pres-map-dot" />
                          <circle cx={loc.x} cy={loc.y} r="12" fill={loc.color} opacity="0.15" className="pres-map-pulse" />
                          <text x={loc.x + 14} y={loc.y + 4} fontSize="11" fill={COLORS.charcoal} fontWeight="600">{loc.name}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </Anim>

              <Anim type="bounce-in" delay={700}>
                <div className="mt-8 text-center p-8 rounded-2xl pres-glow-gold" style={{ background: `linear-gradient(135deg, ${COLORS.turmericGold}, ${COLORS.earthBrown})` }}>
                  <p className="text-sm font-medium text-white/80 uppercase tracking-widest mb-2">Average Monthly Procurement</p>
                  <p className="text-4xl md:text-5xl font-bold text-white">
                    ₹<CountUp target={45} /> Crore+
                  </p>
                </div>
              </Anim>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.chilliRed}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          4. PRODUCT PORTFOLIO — 3D Flip-up cards with stagger
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="portfolio" className="py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-6xl mx-auto px-6">
          <Anim type="blur-in">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.chilliRed }}>
                Product Range
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                Private Label Product Categories
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.chilliRed }} />
            </div>
          </Anim>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Ground Spices",
                icon: <Package className="w-16 h-16" />,
                color: COLORS.chilliRed,
                items: ["Red Chilli Powder", "Turmeric Powder", "Coriander Powder", "Cumin Powder", "Black Pepper Powder", "Ginger Powder", "Garam Masala", "Sambar Masala"],
                anim: "flip-left" as AnimationType,
              },
              {
                title: "Whole Spices",
                icon: <Package className="w-16 h-16" />,
                color: COLORS.turmericGold,
                items: ["Whole Red Chilli", "Turmeric Fingers", "Coriander Seeds", "Cumin Seeds", "Fenugreek Seeds", "Black Pepper", "Mustard Seeds", "Fennel Seeds"],
                anim: "flip-up" as AnimationType,
              },
              {
                title: "Herbal Powders",
                icon: <Leaf className="w-16 h-16" />,
                color: COLORS.herbalGreen,
                items: ["Moringa Powder", "Ashwagandha Powder", "Brahmi Powder", "Neem Powder", "Amla Powder", "Tulsi Powder", "Shatavari Powder", "Triphala Powder"],
                anim: "swing-in" as AnimationType,
              },
            ].map((cat, i) => (
              <Anim key={i} type={cat.anim} delay={200 + i * 250}>
                <div className="bg-white rounded-2xl overflow-hidden h-full pres-card-lift" style={{ border: `1px solid ${cat.color}15` }}>
                  <div className="h-48 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${cat.color}10, ${cat.color}05)` }}>
                    <div className="text-center">
                      <span style={{ color: cat.color }}>{cat.icon}</span>
                      <p className="text-sm font-medium text-gray-500 mt-3">Product Imagery</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-4" style={{ color: cat.color }}>{cat.title}</h3>
                    <ul className="space-y-2.5">
                      {cat.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                          <CircleDot className="w-3 h-3 shrink-0" style={{ color: cat.color }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.earthBrown}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          5. MANUFACTURING — Alternating slide-left/right with bounce
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="manufacturing" className="py-24 md:py-32" style={{ background: "white" }}>
        <div className="max-w-6xl mx-auto px-6">
          <Anim type="rotate-in">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.earthBrown }}>
                Infrastructure
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                Processing & Retail Packaging Capability
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.earthBrown }} />
            </div>
          </Anim>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="space-y-6">
              {[
                { icon: <Factory className="w-6 h-6" />, title: "Cleaning & Grading", desc: "Multi-stage cleaning systems with destoning, magnetic separation, and precision grading for consistent raw material quality." },
                { icon: <Package className="w-6 h-6" />, title: "Grinding Systems", desc: "Temperature-controlled grinding with hammer mills and pulverizers, ensuring particle size consistency and volatile oil retention." },
                { icon: <Shield className="w-6 h-6" />, title: "Controlled Processing", desc: "Enclosed processing environment with humidity and temperature monitoring for batch-level quality assurance." },
              ].map((item, i) => (
                <Anim key={i} type="slide-left" delay={200 + i * 200}>
                  <div className="flex gap-4 p-5 rounded-xl pres-card-hover" style={{ background: `${COLORS.earthBrown}06`, border: `1px solid ${COLORS.earthBrown}12` }}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${COLORS.earthBrown}12` }}>
                      <span style={{ color: COLORS.earthBrown }}>{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </Anim>
              ))}
            </div>

            <div>
              <div className="space-y-6">
                {[
                  { icon: <Box className="w-6 h-6" />, title: "Retail Pouch Formats", desc: "Flexible packaging from 50g to 1kg in stand-up pouches, flat pouches, and pillow packs with custom branding support." },
                  { icon: <Truck className="w-6 h-6" />, title: "Bulk Packs", desc: "Industrial packaging from 5kg to 25kg HDPE bags and corrugated cartons, suitable for institutional and wholesale supply." },
                  { icon: <BarChart3 className="w-6 h-6" />, title: "Batch Coding & Barcode", desc: "Integrated batch coding, MFG/EXP dating, and EAN-13 barcode printing for retail shelf compliance." },
                ].map((item, i) => (
                  <Anim key={i} type="slide-right" delay={300 + i * 200}>
                    <div className="flex gap-4 p-5 rounded-xl pres-card-hover" style={{ background: `${COLORS.earthBrown}06`, border: `1px solid ${COLORS.earthBrown}12` }}>
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${COLORS.earthBrown}12` }}>
                        <span style={{ color: COLORS.earthBrown }}>{item.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>

              <Anim type="scale-up" delay={800}>
                <div className="mt-8 rounded-2xl h-56 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${COLORS.earthBrown}10, ${COLORS.earthBrown}05)`, border: `1px dashed ${COLORS.earthBrown}30` }}>
                  <div className="text-center">
                    <Factory className="w-12 h-12 mx-auto mb-2" style={{ color: `${COLORS.earthBrown}40` }} />
                    <p className="text-sm text-gray-400">Manufacturing & Packaging Facility</p>
                  </div>
                </div>
              </Anim>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.chilliRed}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          6. QUALITY CONTROL — Blur-reveal + glass-morph cards
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="quality" className="py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-6xl mx-auto px-6">
          <Anim type="scale-up">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.chilliRed }}>
                Technical Excellence
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                In-House Laboratory & Compliance System
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.chilliRed }} />
            </div>
          </Anim>

          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <Anim type="slide-left" delay={200}>
                <h3 className="text-xl font-bold mb-6" style={{ color: COLORS.charcoal }}>Laboratory Testing Capabilities</h3>
              </Anim>
              <div className="space-y-4 mb-8">
                {[
                  { title: "Moisture & Microbial Testing", desc: "Precise moisture analysis and microbial count evaluation for every batch to ensure product safety" },
                  { title: "Physical & Chemical Analysis", desc: "Color value, ash content, volatile oil measurement, and granulometry for specification compliance" },
                  { title: "Adulteration Checks", desc: "Systematic testing for added starch, lead chromate, Sudan dyes, and other common adulterants" },
                  { title: "Batch-Level QC", desc: "Every production batch undergoes full quality cycle before release – zero tolerance for non-conformance" },
                ].map((item, i) => (
                  <Anim key={i} type="blur-in" delay={300 + i * 150}>
                    <div className="flex gap-3 items-start">
                      <Microscope className="w-5 h-5 mt-0.5 shrink-0" style={{ color: COLORS.chilliRed }} />
                      <div>
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>

              <Anim type="expand-width" delay={900}>
                <div className="p-5 rounded-xl" style={{ background: `${COLORS.chilliRed}08`, border: `1px solid ${COLORS.chilliRed}15` }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: COLORS.chilliRed }}>European Standards Alignment</p>
                  <p className="text-sm text-gray-600">
                    All testing aligned with European testing standards and methodologies, 
                    ensuring compatibility with the most stringent global requirements.
                  </p>
                </div>
              </Anim>
            </div>

            <div>
              <Anim type="slide-right" delay={200}>
                <h3 className="text-xl font-bold mb-6" style={{ color: COLORS.charcoal }}>Documentation Software</h3>
              </Anim>
              <div className="space-y-4 mb-8">
                {[
                  { icon: <FileCheck className="w-5 h-5" />, title: "Automated COA Generation", desc: "Certificate of Analysis generated automatically from lab data – no manual errors" },
                  { icon: <FileCheck className="w-5 h-5" />, title: "Specification Sheet Generation", desc: "Product spec sheets created instantly from master data – consistent and professional" },
                  { icon: <Shield className="w-5 h-5" />, title: "Full Traceability System", desc: "Farm-to-dispatch traceability with lot tracking, supplier mapping, and test records" },
                  { icon: <CheckCircle2 className="w-5 h-5" />, title: "Error-Free Documentation", desc: "Software-driven documentation eliminates manual entry errors across all export and compliance documents" },
                ].map((item, i) => (
                  <Anim key={i} type="flip-up" delay={300 + i * 150}>
                    <div className="flex gap-3 items-start p-4 bg-white rounded-xl pres-card-hover" style={{ border: "1px solid #e5e7eb" }}>
                      <span className="shrink-0 mt-0.5" style={{ color: COLORS.herbalGreen }}>{item.icon}</span>
                      <div>
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>

              <Anim type="scale-rotate" delay={900}>
                <div className="rounded-2xl h-44 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${COLORS.chilliRed}08, ${COLORS.herbalGreen}08)`, border: `1px dashed ${COLORS.chilliRed}25` }}>
                  <div className="text-center">
                    <FlaskConical className="w-10 h-10 mx-auto mb-2" style={{ color: `${COLORS.chilliRed}40` }} />
                    <p className="text-sm text-gray-400">In-House Laboratory</p>
                  </div>
                </div>
              </Anim>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.herbalGreen}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          7. ORGANIC DIVISION — Expand-in from center + scale-bounce cards
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="organic" className="py-24 md:py-32 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.herbalGreen}, ${COLORS.herbalGreen}dd)` }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.15) 0%, transparent 60%),
                              radial-gradient(circle at 70% 70%, rgba(255,255,255,0.08) 0%, transparent 50%)`,
          }} />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <Anim type="scale-up">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                Specialized Operations
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                Dedicated Organic & Herbal Operations
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.turmericGold }} />
            </div>
          </Anim>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Leaf className="w-8 h-8" />, title: "Certified Organic Sourcing", desc: "Direct procurement from certified organic farming clusters with valid certification documentation at every stage" },
              { icon: <Shield className="w-8 h-8" />, title: "Segregated Storage", desc: "Dedicated organic warehouse zones with physical separation from conventional inventory – zero contamination risk" },
              { icon: <Wheat className="w-8 h-8" />, title: "Dedicated Herbal Procurement", desc: "Specialized procurement channels for herbal raw materials with botanical identity verification and origin validation" },
              { icon: <Factory className="w-8 h-8" />, title: "Controlled Organic Handling", desc: "Separate processing lines for organic products with documented cleaning protocols between conventional and organic runs" },
            ].map((item, i) => (
              <Anim key={i} type="bounce-in" delay={200 + i * 200}>
                <div className="p-6 rounded-2xl h-full pres-card-hover-light" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <div className="mb-4" style={{ color: COLORS.turmericGold }}>
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{item.desc}</p>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.turmericGold}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          8. EXPORT LOGISTICS — Rotate-in cards
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="logistics" className="py-24 md:py-32" style={{ background: "white" }}>
        <div className="max-w-5xl mx-auto px-6">
          <Anim type="fade-down">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.turmericGold }}>
                Logistics Capability
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                Factory-Level Export Logistics
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.turmericGold }} />
            </div>
          </Anim>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: <Ship className="w-8 h-8" />, title: "Self-Sealing of Containers", desc: "Government-approved permission for self-sealing of export containers directly at the factory premises – ensuring cargo integrity from origin." },
              { icon: <Shield className="w-8 h-8" />, title: "Secure Factory Dispatch", desc: "Complete dispatch operations managed within the manufacturing unit, reducing handling stages and maintaining product safety." },
              { icon: <Truck className="w-8 h-8" />, title: "Streamlined Export Movement", desc: "Optimized logistics flow from production to port, with consolidated documentation and pre-clearance processing." },
              { icon: <CheckCircle2 className="w-8 h-8" />, title: "Reduced Port Dependency", desc: "Factory-level sealing eliminates the need for CFS/ICD dependency, reducing transit time and costs while minimizing handling risks." },
            ].map((item, i) => (
              <Anim key={i} type="rotate-in" delay={200 + i * 200}>
                <div className="p-6 rounded-2xl pres-card-lift" style={{ background: COLORS.offWhite, border: `1px solid ${COLORS.turmericGold}15` }}>
                  <div className="mb-4" style={{ color: COLORS.turmericGold }}>
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.herbalGreen}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          9. LEADERSHIP — Drop-in + lift shadow effect
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="leadership" className="py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-6xl mx-auto px-6">
          <Anim type="blur-in">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.herbalGreen }}>
                Our People
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                Management & Core Team
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.herbalGreen }} />
            </div>
          </Anim>

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
              <Anim key={i} type="drop-in" delay={200 + i * 180}>
                <div className="bg-white rounded-2xl overflow-hidden h-full pres-card-lift" style={{ border: "1px solid #e5e7eb" }}>
                  <div className="h-48 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${member.color}12, ${member.color}06)` }}>
                    <div className="w-24 h-24 rounded-full flex items-center justify-center pres-avatar-float" style={{ background: `${member.color}15`, border: `2px solid ${member.color}30` }}>
                      <Users className="w-10 h-10" style={{ color: member.color }} />
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-lg">{member.name}</h4>
                    <p className="text-sm font-medium mb-3" style={{ color: member.color }}>{member.role}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{member.summary}</p>
                  </div>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.turmericGold}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          10. STRATEGIC VALUE — Slide-in with golden line draw
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="value" className="py-24 md:py-32" style={{ background: COLORS.charcoal }}>
        <div className="max-w-5xl mx-auto px-6">
          <Anim type="scale-up">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.turmericGold }}>
                Partnership Advantage
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                Why Bright Fame Organic for Private Label
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.turmericGold }} />
            </div>
          </Anim>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <MapPin className="w-7 h-7" />, text: "Strong origin control with direct mandi access across India's key agricultural belts" },
              { icon: <BarChart3 className="w-7 h-7" />, text: "Structured procurement scale with ₹45 Crore+ monthly buying power" },
              { icon: <Factory className="w-7 h-7" />, text: "Controlled manufacturing environment with temperature-monitored processing lines" },
              { icon: <FlaskConical className="w-7 h-7" />, text: "EU-aligned lab system with automated COA and specification sheet generation" },
              { icon: <Ship className="w-7 h-7" />, text: "Self-sealing export capability directly from factory premises" },
              { icon: <Box className="w-7 h-7" />, text: "Retail-ready packaging formats from 50g pouches to 25kg bulk packs" },
            ].map((item, i) => (
              <Anim key={i} type="slide-left" delay={200 + i * 150}>
                <div className="flex gap-4 items-start p-5 rounded-xl pres-card-hover-light pres-gold-border-animate" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ color: COLORS.turmericGold }} className="shrink-0 mt-0.5">{item.icon}</span>
                  <p className="text-white/85 text-sm leading-relaxed">{item.text}</p>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.herbalGreen}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          11. COLLABORATION — Sequential timeline reveal
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="collaboration" className="py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-4xl mx-auto px-6">
          <Anim type="fade-down">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: COLORS.herbalGreen }}>
                Working Together
              </p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: COLORS.charcoal }}>
                Proposed Engagement Model
              </h2>
              <div className="w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.herbalGreen }} />
            </div>
          </Anim>

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
                <div className="flex flex-col items-center">
                  <Anim type="zoom-in" delay={300 + i * 250}>
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 pres-step-pulse"
                      style={{ background: item.color }}
                    >
                      {item.step}
                    </div>
                  </Anim>
                  {i < 5 && (
                    <Anim type="reveal-up" delay={450 + i * 250}>
                      <div className="w-0.5 h-16 my-1" style={{ background: `${item.color}30` }} />
                    </Anim>
                  )}
                </div>
                <Anim type="slide-right" delay={400 + i * 250}>
                  <div className="pb-8">
                    <h4 className="font-bold text-lg" style={{ color: item.color }}>{item.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                  </div>
                </Anim>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ background: COLORS.charcoal, borderTop: `3px solid ${COLORS.turmericGold}` }}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <Anim type="fade-up">
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
          </Anim>
        </div>
      </footer>
    </div>
  );
}
