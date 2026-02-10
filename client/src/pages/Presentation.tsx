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
  CircleDot,
  Cog,
  Thermometer,
  Gauge,
  Zap
} from "lucide-react";

import officeBuildingImg from "@assets/WhatsApp_Image_2026-02-10_at_10.45.28_AM_(2)_1770700935405.jpeg";
import cuminSeedPkgImg from "@assets/WhatsApp_Image_2026-02-10_at_10.45.28_AM_(1)_1770700935405.jpeg";
import cuminPowderPkgImg from "@assets/WhatsApp_Image_2026-02-10_at_10.45.28_AM_1770700935406.jpeg";
import spicePowderJarsImg from "@assets/WhatsApp_Image_2026-02-10_at_10.46.18_AM_(2)_1770700935406.jpeg";
import seedJarsImg from "@assets/WhatsApp_Image_2026-02-10_at_10.46.18_AM_(1)_1770700935406.jpeg";
import seedJarsCloseImg from "@assets/WhatsApp_Image_2026-02-10_at_10.46.18_AM_1770700935406.jpeg";
import aerialContainersImg from "@assets/WhatsApp_Image_2026-02-10_at_10.47.36_AM_1770700935407.jpeg";
import aerialFactoryImg from "@assets/WhatsApp_Image_2026-02-10_at_10.47.37_AM_(1)_1770700935407.jpeg";
import factoryInsideImg from "@assets/WhatsApp_Image_2026-02-10_at_10.47.37_AM_1770700935408.jpeg";
import factoryMachinery2Img from "@assets/WhatsApp_Image_2026-02-10_at_10.47.38_AM_(2)_1770700935408.jpeg";
import buhlerMachineryImg from "@assets/WhatsApp_Image_2026-02-10_at_10.47.38_AM_(1)_1770700935409.jpeg";
import factoryMachinery3Img from "@assets/WhatsApp_Image_2026-02-10_at_10.47.38_AM_1770700935409.jpeg";
import bfiLogoImg from "@assets/Final Logo_1753730040470.png";
import standeeWhiteImg from "@assets/image_1770704885158.png";
import standeeBrownImg from "@assets/image_1770704849414.png";
import ffsMachineImg from "@assets/image_1770704939826.png";
import cleanroomFacilityImg from "@assets/image_1770705013985.png";

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
  { id: "processing", label: "Processing Capacity" },
  { id: "packaging", label: "Packaging" },
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center h-12 sm:h-14 overflow-x-auto pres-nav-scroll">
          <div className="flex items-center gap-2 whitespace-nowrap mr-4 sm:mr-6 shrink-0">
            <img src={bfiLogoImg} alt="BFI Logo" className="h-7 sm:h-9 w-auto object-contain" />
            <span className="font-bold text-xs sm:text-sm hidden md:inline" style={{ color: COLORS.turmericGold }}>
              BRIGHT FAME ORGANIC
            </span>
          </div>
          <div className="flex gap-0.5 sm:gap-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap transition-all duration-300"
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
          1. HERO SECTION
         ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <div 
          className="absolute inset-0 transition-none"
          style={{
            transform: `scale(${1 + heroScrollY * 0.0003}) translateY(${heroScrollY * 0.2}px)`,
            opacity: Math.max(0, 1 - heroScrollY * 0.001),
          }}
        >
          <img 
            src={officeBuildingImg} 
            alt="Bright Fame Organic Corporate Headquarters" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(44,44,44,0.85) 0%, rgba(90,62,43,0.75) 50%, rgba(46,94,62,0.8) 100%)" }} />
        </div>

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
          className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto"
          style={{
            transform: `translateY(${heroScrollY * 0.3}px)`,
            opacity: Math.max(0, 1 - heroScrollY * 0.002),
          }}
        >
          <Anim type="drop-in" delay={200}>
            <img 
              src={bfiLogoImg} 
              alt="Bright Fame Organic Logo" 
              className="h-20 sm:h-28 md:h-36 w-auto object-contain mx-auto mb-4 sm:mb-6 drop-shadow-2xl"
            />
          </Anim>

          <Anim type="fade-up" delay={400}>
            <div
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full mb-6 sm:mb-8 text-xs sm:text-sm font-medium pres-badge-glow"
              style={{ background: "rgba(200,155,43,0.15)", border: `1px solid ${COLORS.turmericGold}`, color: COLORS.turmericGold }}
            >
              <Star className="w-3 h-3 sm:w-4 sm:h-4 pres-spin-slow" />
              <span className="hidden sm:inline">Sister Concern of Bright Fame International – Three Star Export House</span>
              <span className="sm:hidden">Three Star Export House</span>
            </div>
          </Anim>

          <Anim type="scale-up" delay={600}>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight tracking-tight">
              Bright Fame Organic
            </h1>
          </Anim>

          <Anim type="blur-in" delay={800}>
            <p className="text-lg sm:text-xl md:text-2xl font-light mb-3 sm:mb-4" style={{ color: COLORS.turmericGold }}>
              Private Label Spice & Herbal Manufacturing Partner
            </p>
          </Anim>

          <Anim type="fade-up" delay={1100}>
            <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
              From India's finest organic farms to your retail shelves – we deliver certified organic spices, 
              whole seeds, ground powders, and herbal ingredients with complete traceability, 
              controlled processing, and retail-ready packaging solutions.
            </p>
          </Anim>

          <Anim type="bounce-in" delay={1400}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <button
                onClick={() => scrollTo("credibility")}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl pres-pulse-glow"
                style={{ background: COLORS.turmericGold, color: COLORS.charcoal }}
              >
                View Capabilities
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" />
              </button>
              <button
                onClick={() => scrollTo("processing")}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 hover:scale-105 border-2"
                style={{ borderColor: COLORS.turmericGold, color: COLORS.turmericGold, background: "transparent" }}
              >
                Processing Capacity
                <Cog className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </Anim>

          <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2">
            <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 pres-float" />
          </div>
        </div>
      </section>

      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.turmericGold}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          2. GROUP CREDIBILITY
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="credibility" className="py-16 sm:py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Anim type="fade-down">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3" style={{ color: COLORS.turmericGold }}>
                Our Foundation
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6" style={{ color: COLORS.charcoal }}>
                Group Foundation & Export Recognition
              </h2>
              <div className="w-16 sm:w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.turmericGold }} />
            </div>
          </Anim>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">
            <Anim type="slide-left" delay={200}>
              <div>
                <p className="text-base sm:text-lg leading-relaxed text-gray-700 mb-4 sm:mb-6">
                  Bright Fame Organic operates as the dedicated organic and herbal division of 
                  <strong> Bright Fame International</strong>, a company with deep roots in India's 
                  agricultural export sector. The group brings a legacy of structured trade practices, 
                  compliance-first documentation, and consistent export performance spanning multiple years 
                  of uninterrupted operations across global markets.
                </p>
                <p className="text-base sm:text-lg leading-relaxed text-gray-700 mb-4 sm:mb-6">
                  This foundation enables Bright Fame Organic to operate with an established export 
                  documentation culture, institutional-grade process discipline, and a deep understanding 
                  of global quality expectations from day one. Our team has handled complex multi-market 
                  shipments, navigated diverse regulatory frameworks, and built lasting relationships with 
                  buyers across continents.
                </p>
                <p className="text-base sm:text-lg leading-relaxed text-gray-700">
                  The parent company's Three Star Export House recognition by the Government of India 
                  is a testament to the sustained quality and reliability of our export operations. 
                  This credential ensures preferential trade access, simplified customs procedures, 
                  and enhanced credibility with international buyers and regulatory bodies.
                </p>
              </div>
            </Anim>

            <div className="space-y-4 sm:space-y-6">
              {[
                { icon: <Award className="w-6 sm:w-7 h-6 sm:h-7" />, title: "Three Star Export House", desc: "Government of India recognition for consistent export performance and trade excellence. This prestigious credential reflects years of sustained growth, quality adherence, and reliable supply chain management across international markets.", color: COLORS.turmericGold },
                { icon: <FileCheck className="w-6 sm:w-7 h-6 sm:h-7" />, title: "Established Export Documentation", desc: "Proven compliance culture with structured processes for international trade documentation including phytosanitary certificates, certificates of origin, fumigation certificates, and customs declarations for seamless global trade.", color: COLORS.herbalGreen },
                { icon: <Globe className="w-6 sm:w-7 h-6 sm:h-7" />, title: "Government-Recognized Performance", desc: "Recognized by DGFT (Directorate General of Foreign Trade) for sustained export growth and quality standards across multiple markets. This recognition opens doors to trade promotion schemes and duty benefits.", color: COLORS.chilliRed },
              ].map((item, i) => (
                <Anim key={i} type="slide-right" delay={300 + i * 200}>
                  <div className="p-4 sm:p-6 rounded-2xl pres-card-hover" style={{ background: "white", border: "1px solid #e5e7eb" }}>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.color}15` }}>
                        <span style={{ color: item.color }}>{item.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-base sm:text-lg mb-1">{item.title}</h4>
                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </Anim>
              ))}

              <Anim type="scale-up" delay={900}>
                <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${COLORS.turmericGold}20` }}>
                  <img 
                    src={officeBuildingImg} 
                    alt="Bright Fame Corporate Office" 
                    className="w-full h-40 sm:h-48 object-cover"
                  />
                  <div className="p-3 sm:p-4 text-center" style={{ background: `${COLORS.turmericGold}08` }}>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Modern Corporate Headquarters - State-of-the-Art Office Infrastructure</p>
                  </div>
                </div>
              </Anim>
            </div>
          </div>
        </div>
      </section>

      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.herbalGreen}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          3. SOURCING NETWORK
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="sourcing" className="py-16 sm:py-24 md:py-32" style={{ background: "white" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Anim type="zoom-in">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3" style={{ color: COLORS.herbalGreen }}>
                Procurement Strength
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6" style={{ color: COLORS.charcoal }}>
                Origin-Based Procurement System
              </h2>
              <div className="w-16 sm:w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.herbalGreen }} />
            </div>
          </Anim>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">
            <Anim type="swing-in" delay={200}>
              <div>
                <p className="text-base sm:text-lg leading-relaxed text-gray-700 mb-4 sm:mb-6">
                  Our structured mandi-based procurement model ensures direct access to India's finest 
                  agricultural origins. Each product category is sourced from its most authentic production 
                  region, ensuring optimal quality, traceability, and supply stability throughout the year. 
                  Our procurement team maintains permanent presence at key APMC markets across India, 
                  enabling real-time quality assessment and competitive pricing.
                </p>
                <p className="text-base sm:text-lg leading-relaxed text-gray-700 mb-6 sm:mb-8">
                  We work directly with farming clusters and cooperative societies, eliminating unnecessary 
                  intermediaries and ensuring that our raw materials meet the highest standards of purity, 
                  freshness, and organic certification compliance. Our sourcing network spans over 15 major 
                  agricultural belts across Rajasthan, Gujarat, Andhra Pradesh, Tamil Nadu, Karnataka, 
                  Madhya Pradesh, and Maharashtra, covering the entire spectrum of spice and herbal ingredients.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  {[
                    { location: "Guntur, Andhra Pradesh", product: "Red Chilli (Teja, S-17)", color: COLORS.chilliRed },
                    { location: "Hassan, Karnataka", product: "Ginger & Turmeric", color: COLORS.earthBrown },
                    { location: "Erode, Tamil Nadu", product: "Turmeric Fingers & Powder", color: COLORS.turmericGold },
                    { location: "Ramganj Mandi, Rajasthan", product: "Coriander Seeds", color: COLORS.herbalGreen },
                    { location: "Unjha, Gujarat", product: "Cumin Seeds & Fennel", color: COLORS.earthBrown },
                    { location: "Major APMC Markets", product: "Multi-Commodity Hub Access", color: COLORS.charcoal },
                  ].map((item, i) => (
                    <Anim key={item.location} type="expand-width" delay={400 + i * 100}>
                      <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl pres-card-hover" style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                        <MapPin className="w-4 sm:w-5 h-4 sm:h-5 shrink-0" style={{ color: item.color }} />
                        <div>
                          <p className="font-semibold text-xs sm:text-sm">{item.location}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500">{item.product}</p>
                        </div>
                      </div>
                    </Anim>
                  ))}
                </div>
              </div>
            </Anim>

            <div>
              <Anim type="scale-rotate" delay={400}>
                <div className="relative rounded-3xl overflow-hidden p-4 sm:p-8" style={{ background: `linear-gradient(135deg, ${COLORS.herbalGreen}08, ${COLORS.turmericGold}08)`, border: `1px solid ${COLORS.herbalGreen}20` }}>
                  <div className="text-center mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2" style={{ color: COLORS.herbalGreen }}>Pan-India Sourcing Network</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Direct mandi access across key agricultural belts</p>
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
                        { x: 195, y: 360, name: "Erode", color: COLORS.turmericGold },
                        { x: 225, y: 200, name: "Ramganj", color: COLORS.herbalGreen },
                        { x: 240, y: 220, name: "Unjha", color: COLORS.earthBrown },
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
                <div className="mt-6 sm:mt-8 text-center p-6 sm:p-8 rounded-2xl pres-glow-gold" style={{ background: `linear-gradient(135deg, ${COLORS.turmericGold}, ${COLORS.earthBrown})` }}>
                  <p className="text-xs sm:text-sm font-medium text-white/80 uppercase tracking-widest mb-1 sm:mb-2">Average Monthly Procurement</p>
                  <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                    ₹<CountUp target={45} /> Crore+
                  </p>
                  <p className="text-xs text-white/60 mt-2">Across 15+ agricultural belts in India</p>
                </div>
              </Anim>
            </div>
          </div>
        </div>
      </section>

      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.chilliRed}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          4. PRODUCT PORTFOLIO
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="portfolio" className="py-16 sm:py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Anim type="blur-in">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3" style={{ color: COLORS.chilliRed }}>
                Product Range
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6" style={{ color: COLORS.charcoal }}>
                Private Label Product Categories
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto mb-4 sm:mb-6">
                We offer an extensive range of certified organic and conventional spices, whole seeds, ground powders, 
                and herbal ingredients — available in retail packaging or bulk formats with complete private label 
                branding support for your brand.
              </p>
              <div className="w-16 sm:w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.chilliRed }} />
            </div>
          </Anim>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Ground Spices",
                image: spicePowderJarsImg,
                imageAlt: "Premium Ground Spice Powders - Bright Fame International",
                color: COLORS.chilliRed,
                items: ["Red Chilli Powder (Teja, S-17, Kashmiri, Byadgi)", "Turmeric Powder (Salem, Lakadong 5%)", "Coriander Powder", "Cumin Powder", "Black Pepper Powder", "Ginger Powder", "Garam Masala Blends", "Sambar & Rasam Masala"],
                anim: "flip-left" as AnimationType,
              },
              {
                title: "Whole Spices & Seeds",
                image: seedJarsImg,
                imageAlt: "Premium Whole Seeds Collection - Bright Fame International",
                color: COLORS.turmericGold,
                items: ["Cumin Seeds (Singapore, Europe, Regular Grade)", "Coriander Seeds (Eagle, Scooter)", "Fennel Seeds", "Fenugreek Seeds", "Natural & Hulled Sesame Seeds", "Black Sesame Seeds", "Mustard Seeds (Yellow & Brown)", "Whole Red Chilli & Turmeric Fingers"],
                anim: "flip-up" as AnimationType,
              },
              {
                title: "Herbal Powders",
                image: cuminPowderPkgImg,
                imageAlt: "Organic Herbal Powder Product - Bright Fame Organic",
                color: COLORS.herbalGreen,
                items: ["Moringa Leaf Powder", "Ashwagandha Root Powder", "Brahmi (Bacopa) Powder", "Neem Leaf Powder", "Amla (Indian Gooseberry) Powder", "Tulsi (Holy Basil) Powder", "Shatavari Powder", "Triphala Churna Powder"],
                anim: "swing-in" as AnimationType,
              },
            ].map((cat, i) => (
              <Anim key={i} type={cat.anim} delay={200 + i * 250}>
                <div className="bg-white rounded-2xl overflow-hidden h-full pres-card-lift" style={{ border: `1px solid ${cat.color}15` }}>
                  <div className="h-48 sm:h-56 overflow-hidden relative">
                    <img 
                      src={cat.image}
                      alt={cat.imageAlt}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: cat.color }}>
                        {cat.title}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: cat.color }}>{cat.title}</h3>
                    <ul className="space-y-2 sm:space-y-2.5">
                      {cat.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                          <CircleDot className="w-3 h-3 shrink-0 mt-0.5" style={{ color: cat.color }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Anim>
            ))}
          </div>

          <Anim type="fade-up" delay={800}>
            <div className="mt-10 sm:mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { img: cuminSeedPkgImg, alt: "Cumin Seed Premium Package", label: "Retail-Ready Packaging" },
                { img: cuminPowderPkgImg, alt: "Cumin Powder Organic Package", label: "Organic Certified Products" },
                { img: spicePowderJarsImg, alt: "Spice Powder Range", label: "Diverse Powder Range" },
                { img: seedJarsCloseImg, alt: "Premium Seeds Collection", label: "Premium Seeds Collection" },
              ].map((item, i) => (
                <Anim key={i} type="scale-up" delay={900 + i * 150}>
                  <div className="rounded-xl overflow-hidden pres-card-hover" style={{ border: "1px solid #e5e7eb" }}>
                    <img src={item.img} alt={item.alt} className="w-full h-32 sm:h-40 md:h-48 object-cover" />
                    <div className="p-2 sm:p-3 text-center bg-white">
                      <p className="text-[10px] sm:text-xs font-medium text-gray-600">{item.label}</p>
                    </div>
                  </div>
                </Anim>
              ))}
            </div>
          </Anim>
        </div>
      </section>

      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.earthBrown}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          5. MANUFACTURING
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="manufacturing" className="py-16 sm:py-24 md:py-32" style={{ background: "white" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Anim type="rotate-in">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3" style={{ color: COLORS.earthBrown }}>
                Infrastructure
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6" style={{ color: COLORS.charcoal }}>
                Processing & Retail Packaging Capability
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto mb-4 sm:mb-6">
                Our state-of-the-art manufacturing facility is designed for high-volume production with stringent quality controls. 
                From raw material intake to finished product dispatch, every stage is monitored and documented for complete traceability.
              </p>
              <div className="w-16 sm:w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.earthBrown }} />
            </div>
          </Anim>

          <Anim type="scale-up" delay={200}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-10 sm:mb-14">
              <div className="rounded-2xl overflow-hidden pres-card-hover" style={{ border: `1px solid ${COLORS.earthBrown}15` }}>
                <img 
                  src={aerialFactoryImg}
                  alt="Aerial view of Bright Fame Organic manufacturing facility"
                  className="w-full h-48 sm:h-64 md:h-72 object-cover"
                />
                <div className="p-3 sm:p-4 text-center" style={{ background: `${COLORS.earthBrown}06` }}>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Aerial View — Manufacturing Complex with Multiple Processing Units</p>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden pres-card-hover" style={{ border: `1px solid ${COLORS.earthBrown}15` }}>
                <img 
                  src={factoryInsideImg}
                  alt="Inside Bright Fame sorting and processing plant"
                  className="w-full h-48 sm:h-64 md:h-72 object-cover"
                />
                <div className="p-3 sm:p-4 text-center" style={{ background: `${COLORS.earthBrown}06` }}>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Multi-Level Processing Plant — Advanced Sortex & Cleaning Infrastructure</p>
                </div>
              </div>
            </div>
          </Anim>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">
            <div className="space-y-4 sm:space-y-6">
              {[
                { icon: <Factory className="w-5 sm:w-6 h-5 sm:h-6" />, title: "Cleaning & Grading", desc: "Multi-stage cleaning systems with destoning, magnetic separation, and precision grading for consistent raw material quality. Our cleaning line handles multiple grain sizes with adjustable sieves and air classifiers to remove foreign matter, dust, and under-sized particles with 99.5% efficiency." },
                { icon: <Package className="w-5 sm:w-6 h-5 sm:h-6" />, title: "Grinding Systems", desc: "Temperature-controlled grinding with hammer mills and pulverizers, ensuring particle size consistency and volatile oil retention. Our grinding technology maintains product temperature below 40°C to preserve the natural aroma, color, and active compounds of spices." },
                { icon: <Shield className="w-5 sm:w-6 h-5 sm:h-6" />, title: "Controlled Processing Environment", desc: "Enclosed processing environment with humidity and temperature monitoring for batch-level quality assurance. The entire facility maintains positive air pressure with HEPA filtration to prevent cross-contamination and ensure hygienic processing conditions." },
              ].map((item, i) => (
                <Anim key={i} type="slide-left" delay={200 + i * 200}>
                  <div className="flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl pres-card-hover" style={{ background: `${COLORS.earthBrown}06`, border: `1px solid ${COLORS.earthBrown}12` }}>
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${COLORS.earthBrown}12` }}>
                      <span style={{ color: COLORS.earthBrown }}>{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base mb-1">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </Anim>
              ))}
            </div>

            <div className="space-y-4 sm:space-y-6">
              {[
                { icon: <Box className="w-5 sm:w-6 h-5 sm:h-6" />, title: "Retail Pouch Formats", desc: "Flexible packaging from 50g to 1kg in stand-up pouches, flat pouches, zipper locks, and pillow packs with custom branding support. All pouches feature high-barrier films with nitrogen flushing for extended shelf life and freshness retention." },
                { icon: <Truck className="w-5 sm:w-6 h-5 sm:h-6" />, title: "Bulk Packs", desc: "Industrial packaging from 5kg to 25kg HDPE bags and corrugated cartons, suitable for institutional and wholesale supply. Custom packaging solutions available for HoReCa segment with food-grade inner liners." },
                { icon: <BarChart3 className="w-5 sm:w-6 h-5 sm:h-6" />, title: "Batch Coding & Compliance", desc: "Integrated batch coding, MFG/EXP dating, and EAN-13 barcode printing for retail shelf compliance. Supports GS1 standards, multi-language labeling, and country-specific regulatory requirements including FDA, EU, and FSSAI compliance." },
              ].map((item, i) => (
                <Anim key={i} type="slide-right" delay={300 + i * 200}>
                  <div className="flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl pres-card-hover" style={{ background: `${COLORS.earthBrown}06`, border: `1px solid ${COLORS.earthBrown}12` }}>
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${COLORS.earthBrown}12` }}>
                      <span style={{ color: COLORS.earthBrown }}>{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base mb-1">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </Anim>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.turmericGold}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          6. PROCESSING CAPACITY (NEW)
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="processing" className="py-16 sm:py-24 md:py-32" style={{ background: `linear-gradient(180deg, ${COLORS.charcoal} 0%, ${COLORS.earthBrown}ee 100%)` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Anim type="scale-up">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3" style={{ color: COLORS.turmericGold }}>
                Production Power
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 text-white">
                Processing Capacity & Technology
              </h2>
              <p className="text-sm sm:text-base text-gray-300 max-w-3xl mx-auto mb-4 sm:mb-6 leading-relaxed">
                Our manufacturing facility houses two primary processing divisions — a high-capacity Sortex 
                processing unit and an advanced Cryogenic Grinding unit — together delivering over 36 metric tons 
                of daily production capacity with precision quality at every stage.
              </p>
              <div className="w-16 sm:w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.turmericGold }} />
            </div>
          </Anim>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-14">
            <Anim type="slide-left" delay={200}>
              <div className="rounded-2xl overflow-hidden h-full" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="relative">
                  <img 
                    src={factoryMachinery2Img}
                    alt="Sortex Processing Unit - 21 MT per day capacity"
                    className="w-full h-48 sm:h-56 md:h-64 object-cover"
                  />
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white pres-badge-glow" style={{ background: COLORS.turmericGold }}>
                    21 MT / Day
                  </div>
                </div>
                <div className="p-5 sm:p-8">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center" style={{ background: `${COLORS.turmericGold}20` }}>
                      <Gauge className="w-5 sm:w-6 h-5 sm:h-6" style={{ color: COLORS.turmericGold }} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">Sortex Processing Unit</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-4 sm:mb-6">
                    Our Sortex processing line operates at a capacity of <strong className="text-white">21 Metric Tons per day</strong>, 
                    equipped with advanced optical sorting technology that identifies and removes defective grains, 
                    discolored seeds, foreign matter, and impurities with pinpoint accuracy. The multi-stage 
                    processing includes pre-cleaning, destoning, gravity separation, optical color sorting, 
                    and final grading — ensuring that every batch meets export-grade quality standards.
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      "Buhler optical color sorters for precision defect removal",
                      "Multi-stage destoning and gravity separation systems",
                      "Adjustable grading sieves for custom particle size",
                      "Metal detection and magnetic separation at multiple points",
                      "Automated batch weighing and packaging integration",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0 mt-0.5" style={{ color: COLORS.turmericGold }} />
                        <p className="text-xs sm:text-sm text-gray-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Anim>

            <Anim type="slide-right" delay={400}>
              <div className="rounded-2xl overflow-hidden h-full" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="relative">
                  <img 
                    src={buhlerMachineryImg}
                    alt="Cryogenic Grinding Unit - 15 MT per day capacity"
                    className="w-full h-48 sm:h-56 md:h-64 object-cover"
                  />
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white pres-badge-glow" style={{ background: COLORS.herbalGreen }}>
                    15 MT / Day
                  </div>
                </div>
                <div className="p-5 sm:p-8">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center" style={{ background: `${COLORS.herbalGreen}20` }}>
                      <Thermometer className="w-5 sm:w-6 h-5 sm:h-6" style={{ color: COLORS.herbalGreen }} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">Cryogenic Grinding Unit</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-4 sm:mb-6">
                    Our state-of-the-art <strong className="text-white">Cryogenic Grinding</strong> unit operates at 
                    <strong className="text-white"> 15 Metric Tons per day</strong>, using liquid nitrogen cooling 
                    technology to grind spices at sub-zero temperatures. This revolutionary process preserves the 
                    natural volatile oils, essential flavors, aromatic compounds, and vibrant colors that are typically 
                    lost in conventional grinding due to heat generation. The result is a premium-grade powder 
                    with superior aroma, taste, and shelf life.
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      "Liquid nitrogen cooling maintains below -30°C temperature",
                      "Preserves 95%+ volatile oils and aromatic compounds",
                      "Produces ultra-fine, consistent particle size distribution",
                      "No heat damage — retains natural color and potency",
                      "Ideal for premium export-grade ground spices and herbs",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0 mt-0.5" style={{ color: COLORS.herbalGreen }} />
                        <p className="text-xs sm:text-sm text-gray-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Anim>
          </div>

          <Anim type="bounce-in" delay={600}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {[
                { value: "36", suffix: " MT", label: "Combined Daily Capacity", icon: <Zap className="w-5 sm:w-6 h-5 sm:h-6" /> },
                { value: "21", suffix: " MT", label: "Sortex Processing / Day", icon: <Gauge className="w-5 sm:w-6 h-5 sm:h-6" /> },
                { value: "15", suffix: " MT", label: "Cryogenic Grinding / Day", icon: <Thermometer className="w-5 sm:w-6 h-5 sm:h-6" /> },
                { value: "900", suffix: "+", label: "Monthly Production (MT)", icon: <Factory className="w-5 sm:w-6 h-5 sm:h-6" /> },
              ].map((stat, i) => (
                <Anim key={i} type="zoom-in" delay={700 + i * 150}>
                  <div className="text-center p-4 sm:p-6 rounded-2xl pres-card-hover-light" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <div className="mx-auto w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3" style={{ background: `${COLORS.turmericGold}20` }}>
                      <span style={{ color: COLORS.turmericGold }}>{stat.icon}</span>
                    </div>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                      <CountUp target={parseInt(stat.value)} suffix={stat.suffix} />
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{stat.label}</p>
                  </div>
                </Anim>
              ))}
            </div>
          </Anim>

          <Anim type="fade-up" delay={900}>
            <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                { img: factoryInsideImg, alt: "Processing plant interior", label: "Multi-Level Processing Infrastructure" },
                { img: factoryMachinery3Img, alt: "Advanced sorting machinery", label: "Advanced Sorting & Cleaning Systems" },
                { img: buhlerMachineryImg, alt: "Buhler precision sorting equipment", label: "Buhler Precision Equipment" },
              ].map((item, i) => (
                <div key={i} className="rounded-xl overflow-hidden pres-card-hover-light" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  <img src={item.img} alt={item.alt} className="w-full h-36 sm:h-44 object-cover" />
                  <div className="p-2 sm:p-3 text-center">
                    <p className="text-[10px] sm:text-xs text-gray-400">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Anim>
        </div>
      </section>

      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.turmericGold}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          7. PACKAGING SOLUTIONS
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="packaging" className="py-16 sm:py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Anim type="scale-up">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3" style={{ color: COLORS.turmericGold }}>
                Packaging Excellence
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6" style={{ color: COLORS.charcoal }}>
                Standee Pouch Packaging Solutions
              </h2>
              <p className="text-sm sm:text-base md:text-lg max-w-3xl mx-auto" style={{ color: "#666" }}>
                Premium blank white standee pouches with clear windows, packed in our fully automatic FFS facility inside an ISO-certified clean room with epoxy flooring and strict food safety protocols.
              </p>
            </div>
          </Anim>

          {/* Pouch SKU Grid + Image */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start mb-12 sm:mb-16">
            <Anim type="fade-right" delay={200}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                <img src={standeeWhiteImg} alt="White Standee Pouch with Window" className="w-full h-[320px] sm:h-[420px] md:h-[480px] object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Blank White Standee Pouch</h3>
                  <p className="text-xs sm:text-sm text-gray-200">Stand-up bottom gusset with clear front window — ready for private label</p>
                </div>
              </div>
            </Anim>

            <div>
              <Anim type="fade-left" delay={100}>
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-5" style={{ color: COLORS.charcoal }}>Available SKUs: 100g – 1 KG</h3>
              </Anim>
              <div className="space-y-3">
                {[
                  { weight: "100g", dim: "130 × 200 mm", moq: "10,000 pcs" },
                  { weight: "200g", dim: "150 × 230 mm", moq: "10,000 pcs" },
                  { weight: "250g", dim: "160 × 250 mm", moq: "8,000 pcs" },
                  { weight: "500g", dim: "180 × 290 mm", moq: "5,000 pcs" },
                  { weight: "750g", dim: "200 × 320 mm", moq: "5,000 pcs" },
                  { weight: "1 KG", dim: "220 × 350 mm", moq: "3,000 pcs" },
                ].map((sku, i) => (
                  <Anim key={sku.weight} type="fade-left" delay={150 + i * 80}>
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                      <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base" style={{ background: `linear-gradient(135deg, ${COLORS.turmericGold}20, ${COLORS.herbalGreen}20)`, color: COLORS.charcoal }}>
                        {sku.weight}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: COLORS.charcoal }}>Standee Pouch – {sku.weight}</p>
                        <p className="text-xs text-gray-500">{sku.dim} · MOQ: {sku.moq}</p>
                      </div>
                      <div className="hidden sm:flex flex-wrap gap-1">
                        {["Window", "Zipper", "Food Grade"].map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${COLORS.herbalGreen}10`, color: COLORS.herbalGreen }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>

              <Anim type="fade-left" delay={700}>
                <div className="mt-4 sm:mt-5 p-3 sm:p-4 rounded-xl" style={{ background: `${COLORS.turmericGold}10`, border: `1px solid ${COLORS.turmericGold}30` }}>
                  <p className="text-xs sm:text-sm" style={{ color: COLORS.earthBrown }}>
                    <strong>Pouch Features:</strong> Multi-layer PET/AL/PE laminate · Clear front window · Zipper reseal · Bottom gusset (self-standing) · FDA & EU food-grade compliant · Moisture & oxygen barrier
                  </p>
                </div>
              </Anim>
            </div>
          </div>

          {/* FFS Machine & Clean Room */}
          <Anim type="fade-up">
            <div className="text-center mb-8 sm:mb-10">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: COLORS.charcoal }}>
                Automatic FFS Machine in Clean Room
              </h3>
              <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto mt-2">
                Fully automatic Form-Fill-Seal packaging in a dedicated clean room with epoxy flooring, climate control, and HEPA filtration
              </p>
            </div>
          </Anim>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-14">
            <Anim type="fade-right" delay={200}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl group h-[260px] sm:h-[340px] md:h-[400px]">
                <img src={cleanroomFacilityImg} alt="Clean Room Facility with Epoxy Flooring" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <p className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: COLORS.turmericGold }}>Clean Room Environment</p>
                  <h4 className="text-base sm:text-lg font-bold text-white">Epoxy-Coated Clean Room</h4>
                  <p className="text-xs text-gray-300 mt-0.5">Seamless flooring, positive air pressure, temperature controlled</p>
                </div>
              </div>
            </Anim>

            <Anim type="fade-left" delay={300}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl group h-[260px] sm:h-[340px] md:h-[400px]">
                <img src={ffsMachineImg} alt="Automatic FFS Packaging Machine" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <p className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: COLORS.turmericGold }}>Fully Automatic</p>
                  <h4 className="text-base sm:text-lg font-bold text-white">Form-Fill-Seal Machine</h4>
                  <p className="text-xs text-gray-300 mt-0.5">High-speed packaging with precision weighing & sealing</p>
                </div>
              </div>
            </Anim>
          </div>

          {/* Full Pouch Range - Full Width */}
          <Anim type="scale-up" delay={200}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl group mb-10 sm:mb-14 bg-white">
              <img src={standeeBrownImg} alt="Standee Pouches - Complete Range of Sizes" className="w-full h-[250px] sm:h-[350px] md:h-[420px] object-contain p-4 sm:p-8 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/70 to-transparent">
                <div className="text-center">
                  <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">Complete Standee Pouch Range</h4>
                  <p className="text-xs sm:text-sm text-gray-200">
                    Available in multiple sizes from 100g to 1 KG — with clear windows for product visibility
                  </p>
                </div>
              </div>
            </div>
          </Anim>

          {/* Clean Room Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              { title: "Epoxy Flooring", desc: "Seamless, non-porous, easy-to-sanitize surface throughout the facility" },
              { title: "Climate Controlled", desc: "Temperature & humidity regulated for product integrity" },
              { title: "Full PPE Protocol", desc: "Hair nets, masks, gloves, shoe covers, lab coats mandatory" },
              { title: "Automatic FFS", desc: "Fully automated Form-Fill-Seal for consistent hygienic packaging" },
              { title: "FSSAI Certified", desc: "Compliant with Indian food safety & hygiene regulations" },
              { title: "ISO Clean Room", desc: "Controlled environment meeting ISO clean room standards" },
            ].map((feat, i) => (
              <Anim key={feat.title} type="fade-up" delay={100 + i * 80}>
                <div className="p-4 sm:p-5 rounded-xl bg-white shadow-sm hover:shadow-md transition-all border border-gray-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2 sm:mb-3" style={{ background: `${COLORS.herbalGreen}12` }}>
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: COLORS.herbalGreen }} />
                  </div>
                  <h5 className="font-bold text-sm sm:text-base mb-1" style={{ color: COLORS.charcoal }}>{feat.title}</h5>
                  <p className="text-xs sm:text-sm text-gray-500">{feat.desc}</p>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.chilliRed}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          8. QUALITY CONTROL
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="quality" className="py-16 sm:py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Anim type="scale-up">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3" style={{ color: COLORS.chilliRed }}>
                Technical Excellence
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6" style={{ color: COLORS.charcoal }}>
                In-House Laboratory & Compliance System
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto mb-4 sm:mb-6">
                Quality is not just a checkpoint — it's embedded in every stage of our operations. Our in-house laboratory 
                performs comprehensive testing on every batch, while our software-driven documentation system ensures 
                error-free compliance with global regulatory standards.
              </p>
              <div className="w-16 sm:w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.chilliRed }} />
            </div>
          </Anim>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
            <div>
              <Anim type="slide-left" delay={200}>
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ color: COLORS.charcoal }}>Laboratory Testing Capabilities</h3>
              </Anim>
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {[
                  { title: "Moisture & Microbial Testing", desc: "Precise moisture analysis and microbial count evaluation for every batch to ensure product safety. We test for total plate count, yeast & mold, E. coli, Salmonella, and other pathogens." },
                  { title: "Physical & Chemical Analysis", desc: "Color value (ASTA), ash content, volatile oil measurement, acid-insoluble ash, crude fiber, and granulometry for specification compliance across all product categories." },
                  { title: "Adulteration Checks", desc: "Systematic testing for added starch, lead chromate, Sudan dyes, metanil yellow, and other common adulterants using advanced analytical methods." },
                  { title: "Pesticide Residue Monitoring", desc: "Multi-residue pesticide testing aligned with EU MRL limits. Regular third-party validation through accredited laboratories for certification compliance." },
                  { title: "Batch-Level QC Protocol", desc: "Every production batch undergoes a full quality cycle before release — from raw material acceptance to finished product clearance with zero tolerance for non-conformance." },
                ].map((item, i) => (
                  <Anim key={i} type="blur-in" delay={300 + i * 150}>
                    <div className="flex gap-2 sm:gap-3 items-start">
                      <Microscope className="w-4 sm:w-5 h-4 sm:h-5 mt-0.5 shrink-0" style={{ color: COLORS.chilliRed }} />
                      <div>
                        <h4 className="font-semibold text-xs sm:text-sm">{item.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>

              <Anim type="expand-width" delay={1000}>
                <div className="p-4 sm:p-5 rounded-xl" style={{ background: `${COLORS.chilliRed}08`, border: `1px solid ${COLORS.chilliRed}15` }}>
                  <p className="text-xs sm:text-sm font-semibold mb-1" style={{ color: COLORS.chilliRed }}>European Standards Alignment</p>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    All testing aligned with European testing standards and methodologies (ESA, ASTA, ISO), 
                    ensuring compatibility with the most stringent global requirements including EU organic 
                    regulations, USDA NOP, and Japanese Agricultural Standards (JAS).
                  </p>
                </div>
              </Anim>
            </div>

            <div>
              <Anim type="slide-right" delay={200}>
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ color: COLORS.charcoal }}>Documentation Software</h3>
              </Anim>
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {[
                  { icon: <FileCheck className="w-4 sm:w-5 h-4 sm:h-5" />, title: "Automated COA Generation", desc: "Certificate of Analysis generated automatically from lab data with all test parameters, limits, and results — no manual errors, instant delivery to buyers." },
                  { icon: <FileCheck className="w-4 sm:w-5 h-4 sm:h-5" />, title: "Specification Sheet Generation", desc: "Product spec sheets created instantly from master data — consistent, professional, and customizable for different markets and buyer requirements." },
                  { icon: <Shield className="w-4 sm:w-5 h-4 sm:h-5" />, title: "Full Traceability System", desc: "Farm-to-dispatch traceability with lot tracking, supplier mapping, processing records, and test results linked to every batch for complete audit trail." },
                  { icon: <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5" />, title: "Error-Free Documentation", desc: "Software-driven documentation eliminates manual entry errors across all export and compliance documents including commercial invoices, packing lists, and health certificates." },
                ].map((item, i) => (
                  <Anim key={i} type="flip-up" delay={300 + i * 150}>
                    <div className="flex gap-2 sm:gap-3 items-start p-3 sm:p-4 bg-white rounded-xl pres-card-hover" style={{ border: "1px solid #e5e7eb" }}>
                      <span className="shrink-0 mt-0.5" style={{ color: COLORS.herbalGreen }}>{item.icon}</span>
                      <div>
                        <h4 className="font-semibold text-xs sm:text-sm">{item.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.herbalGreen}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          8. ORGANIC DIVISION
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="organic" className="py-16 sm:py-24 md:py-32 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${COLORS.herbalGreen}, ${COLORS.herbalGreen}dd)` }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.15) 0%, transparent 60%),
                              radial-gradient(circle at 70% 70%, rgba(255,255,255,0.08) 0%, transparent 50%)`,
          }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <Anim type="scale-up">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                Specialized Operations
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 text-white">
                Dedicated Organic & Herbal Operations
              </h2>
              <p className="text-sm sm:text-base text-white/70 max-w-3xl mx-auto mb-4 sm:mb-6 leading-relaxed">
                Our organic division operates with complete physical and operational separation from conventional products. 
                From dedicated organic warehousing to separate processing lines, we maintain the integrity 
                of organic certification at every step of the supply chain.
              </p>
              <div className="w-16 sm:w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.turmericGold }} />
            </div>
          </Anim>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: <Leaf className="w-7 sm:w-8 h-7 sm:h-8" />, title: "Certified Organic Sourcing", desc: "Direct procurement from NPOP/NOP certified organic farming clusters with valid certification documentation. We verify every supplier's organic certificate, scope, and validity before accepting raw materials into our organic processing chain." },
              { icon: <Shield className="w-7 sm:w-8 h-7 sm:h-8" />, title: "Segregated Storage", desc: "Dedicated organic warehouse zones with physical separation from conventional inventory — zero contamination risk. Separate receiving docks, storage racks, and dispatch areas with clear identification and traceability at every point." },
              { icon: <Wheat className="w-7 sm:w-8 h-7 sm:h-8" />, title: "Dedicated Herbal Procurement", desc: "Specialized procurement channels for herbal raw materials with botanical identity verification and origin validation. Each herbal ingredient undergoes identity testing, heavy metal screening, and microbial analysis before processing." },
              { icon: <Factory className="w-7 sm:w-8 h-7 sm:h-8" />, title: "Controlled Organic Handling", desc: "Separate processing lines for organic products with documented cleaning protocols between conventional and organic runs. Batch-level documentation maintains complete chain of custody from farm receipt to finished goods dispatch." },
            ].map((item, i) => (
              <Anim key={i} type="bounce-in" delay={200 + i * 200}>
                <div className="p-4 sm:p-6 rounded-2xl h-full pres-card-hover-light" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <div className="mb-3 sm:mb-4" style={{ color: COLORS.turmericGold }}>
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-white mb-2 text-sm sm:text-base">{item.title}</h4>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{item.desc}</p>
                </div>
              </Anim>
            ))}
          </div>

          <Anim type="fade-up" delay={1000}>
            <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {[
                { label: "NPOP", desc: "National Programme for Organic Production (India)" },
                { label: "USDA NOP", desc: "United States Department of Agriculture Organic" },
                { label: "EU Organic", desc: "European Union Organic Regulation Certified" },
              ].map((cert, i) => (
                <div key={i} className="text-center p-4 sm:p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <p className="text-lg sm:text-xl font-bold text-white mb-1">{cert.label}</p>
                  <p className="text-[10px] sm:text-xs text-white/60">{cert.desc}</p>
                </div>
              ))}
            </div>
          </Anim>
        </div>
      </section>

      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.turmericGold}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          9. EXPORT LOGISTICS
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="logistics" className="py-16 sm:py-24 md:py-32" style={{ background: "white" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Anim type="fade-down">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3" style={{ color: COLORS.turmericGold }}>
                Logistics Capability
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6" style={{ color: COLORS.charcoal }}>
                Factory-Level Export Logistics
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto mb-4 sm:mb-6">
                Our factory is equipped with government-approved self-sealing capabilities, allowing us to load, 
                seal, and dispatch export containers directly from our manufacturing premises — reducing transit time, 
                handling risks, and ensuring complete cargo integrity from origin to destination.
              </p>
              <div className="w-16 sm:w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.turmericGold }} />
            </div>
          </Anim>

          <Anim type="scale-up" delay={200}>
            <div className="rounded-2xl overflow-hidden mb-10 sm:mb-14 pres-card-hover" style={{ border: `1px solid ${COLORS.turmericGold}15` }}>
              <img 
                src={aerialContainersImg}
                alt="Aerial view of Bright Fame factory with export containers ready for dispatch"
                className="w-full h-48 sm:h-64 md:h-80 object-cover"
              />
              <div className="p-3 sm:p-4 text-center" style={{ background: `${COLORS.turmericGold}06` }}>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Factory-Level Container Loading & Self-Sealing — Export-Ready Dispatch Facility</p>
              </div>
            </div>
          </Anim>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: <Ship className="w-7 sm:w-8 h-7 sm:h-8" />, title: "Self-Sealing of Containers", desc: "Government-approved permission for self-sealing of export containers directly at the factory premises. This exclusive capability ensures cargo integrity from origin, eliminates CFS handling, and reduces transit time by up to 48 hours." },
              { icon: <Shield className="w-7 sm:w-8 h-7 sm:h-8" />, title: "Secure Factory Dispatch", desc: "Complete dispatch operations managed within the manufacturing unit, reducing handling stages and maintaining product safety. CCTV-monitored loading bays with documented container stuffing procedures ensure tamper-proof shipments." },
              { icon: <Truck className="w-7 sm:w-8 h-7 sm:h-8" />, title: "Streamlined Export Flow", desc: "Optimized logistics flow from production to port, with consolidated documentation and pre-clearance processing. Direct coordination with shipping lines and customs brokers ensures smooth vessel booking and timely sailings." },
              { icon: <CheckCircle2 className="w-7 sm:w-8 h-7 sm:h-8" />, title: "Reduced Port Dependency", desc: "Factory-level sealing eliminates the need for CFS/ICD dependency, reducing transit time and costs while minimizing handling risks. This translates to fresher products, lower logistics costs, and faster delivery to international buyers." },
            ].map((item, i) => (
              <Anim key={i} type="rotate-in" delay={200 + i * 200}>
                <div className="p-4 sm:p-6 rounded-2xl h-full pres-card-lift" style={{ background: COLORS.offWhite, border: `1px solid ${COLORS.turmericGold}15` }}>
                  <div className="mb-3 sm:mb-4" style={{ color: COLORS.turmericGold }}>
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-sm sm:text-lg mb-2">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.herbalGreen}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          10. LEADERSHIP
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="leadership" className="py-16 sm:py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Anim type="blur-in">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3" style={{ color: COLORS.herbalGreen }}>
                Our People
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6" style={{ color: COLORS.charcoal }}>
                Management & Core Team
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto mb-4 sm:mb-6">
                Our leadership team brings together decades of combined experience in agricultural trade, food technology, 
                supply chain management, and international business operations. Each leader brings specialized domain expertise 
                that collectively drives our vision of becoming India's most trusted organic ingredient partner.
              </p>
              <div className="w-16 sm:w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.herbalGreen }} />
            </div>
          </Anim>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                name: "Dr. Niraj Patel",
                role: "Founder & Managing Director",
                summary: "Visionary leader who built Bright Fame Organic from the ground up. With extensive experience in India's agricultural export sector, he guides strategic direction, market expansion, and long-term business growth. Under his leadership, the company has achieved Three Star Export House status and expanded to serve buyers across multiple continents.",
                color: COLORS.turmericGold,
              },
              {
                name: "Ujjwal Dadhich",
                role: "Procurement Head",
                summary: "Leads origin-based procurement with deep APMC market relationships spanning over a decade. Ensures supply stability, quality sourcing, and competitive pricing across all spice and herbal categories. His network covers 15+ major mandis across India's key agricultural belts.",
                color: COLORS.herbalGreen,
              },
              {
                name: "Onkar Suryawanshi",
                role: "Operations Head",
                summary: "Food Technologist driving processing innovation, quality systems, and operational efficiency. Oversees production, certifications, and technology implementation including the cryogenic grinding facility. Brings expertise in food safety management systems, HACCP, and GMP compliance.",
                color: COLORS.chilliRed,
              },
              {
                name: "Mr. Kamal Patel",
                role: "Supply Chain & Commercial Head",
                summary: "Manages end-to-end logistics, export documentation, and commercial operations. Ensures seamless movement from factory to global destinations with optimized transit times and cost efficiency. Oversees the self-sealing container operations and shipping line coordination.",
                color: COLORS.earthBrown,
              },
              {
                name: "Quality Head",
                role: "Quality Assurance Lead",
                summary: "Oversees in-house laboratory operations, batch-level quality control, and compliance documentation. Ensures every product meets international specifications with zero-defect tolerance. Manages the automated COA and specification sheet generation systems.",
                color: COLORS.turmericGold,
              },
            ].map((member, i) => (
              <Anim key={i} type="drop-in" delay={200 + i * 180}>
                <div className="bg-white rounded-2xl overflow-hidden h-full pres-card-lift" style={{ border: "1px solid #e5e7eb" }}>
                  <div className="h-36 sm:h-48 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${member.color}12, ${member.color}06)` }}>
                    <div className="w-16 sm:w-24 h-16 sm:h-24 rounded-full flex items-center justify-center pres-avatar-float" style={{ background: `${member.color}15`, border: `2px solid ${member.color}30` }}>
                      <Users className="w-7 sm:w-10 h-7 sm:h-10" style={{ color: member.color }} />
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h4 className="font-bold text-base sm:text-lg">{member.name}</h4>
                    <p className="text-xs sm:text-sm font-medium mb-2 sm:mb-3" style={{ color: member.color }}>{member.role}</p>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{member.summary}</p>
                  </div>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.turmericGold}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          11. STRATEGIC VALUE
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="value" className="py-16 sm:py-24 md:py-32" style={{ background: COLORS.charcoal }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Anim type="scale-up">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3" style={{ color: COLORS.turmericGold }}>
                Partnership Advantage
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 text-white">
                Why Bright Fame Organic for Private Label
              </h2>
              <p className="text-sm sm:text-base text-gray-400 max-w-3xl mx-auto mb-4 sm:mb-6 leading-relaxed">
                Choosing Bright Fame Organic as your private label partner means accessing an integrated supply chain 
                that covers everything from certified organic sourcing to retail-ready packaging — all under one roof 
                with transparent pricing, reliable timelines, and uncompromising quality standards.
              </p>
              <div className="w-16 sm:w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.turmericGold }} />
            </div>
          </Anim>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: <MapPin className="w-6 sm:w-7 h-6 sm:h-7" />, text: "Strong origin control with direct mandi access across India's key agricultural belts. We maintain permanent procurement presence at 15+ major APMC markets." },
              { icon: <BarChart3 className="w-6 sm:w-7 h-6 sm:h-7" />, text: "Structured procurement scale with ₹45 Crore+ monthly buying power, enabling competitive pricing and consistent supply even during seasonal shortages." },
              { icon: <Factory className="w-6 sm:w-7 h-6 sm:h-7" />, text: "36 MT daily processing capacity including 21 MT Sortex and 15 MT Cryogenic Grinding, ensuring fast turnaround for large orders." },
              { icon: <FlaskConical className="w-6 sm:w-7 h-6 sm:h-7" />, text: "EU-aligned lab system with automated COA and specification sheet generation. Comprehensive testing for pesticide residues, heavy metals, and microbiological parameters." },
              { icon: <Ship className="w-6 sm:w-7 h-6 sm:h-7" />, text: "Self-sealing export capability directly from factory premises, reducing transit time by up to 48 hours and ensuring complete cargo integrity." },
              { icon: <Box className="w-6 sm:w-7 h-6 sm:h-7" />, text: "Retail-ready packaging formats from 50g pouches to 25kg bulk packs with nitrogen flushing, custom branding, and multi-language labeling support." },
            ].map((item, i) => (
              <Anim key={i} type="slide-left" delay={200 + i * 150}>
                <div className="flex gap-3 sm:gap-4 items-start p-4 sm:p-5 rounded-xl pres-card-hover-light pres-gold-border-animate" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ color: COLORS.turmericGold }} className="shrink-0 mt-0.5">{item.icon}</span>
                  <p className="text-white/85 text-xs sm:text-sm leading-relaxed">{item.text}</p>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      <div className="pres-divider" style={{ background: `linear-gradient(90deg, transparent, ${COLORS.herbalGreen}, transparent)` }} />

      {/* ═══════════════════════════════════════════════════════════════════
          12. COLLABORATION
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="collaboration" className="py-16 sm:py-24 md:py-32" style={{ background: COLORS.offWhite }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Anim type="fade-down">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-2 sm:mb-3" style={{ color: COLORS.herbalGreen }}>
                Working Together
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6" style={{ color: COLORS.charcoal }}>
                Proposed Engagement Model
              </h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto mb-4 sm:mb-6">
                We follow a structured, transparent engagement process designed to take your private label requirements 
                from initial discussion to full-scale production. Each step is managed with clear timelines, 
                documented milestones, and dedicated points of contact.
              </p>
              <div className="w-16 sm:w-20 h-1 mx-auto rounded-full pres-line-grow" style={{ background: COLORS.herbalGreen }} />
            </div>
          </Anim>

          <div className="relative">
            {[
              { step: "01", title: "Product Finalization", desc: "Define product categories, specifications, quality parameters, target markets, and packaging requirements. Our technical team works with you to establish detailed product briefs covering all critical parameters.", color: COLORS.turmericGold },
              { step: "02", title: "Sample Development", desc: "Custom samples matching your exact specification requirements — including flavor profile, color grade, particle size, moisture level, and packaging format. Typically delivered within 7-10 working days.", color: COLORS.chilliRed },
              { step: "03", title: "Packaging Alignment", desc: "Design approval, format selection, branding integration, and regulatory labeling verification. We support artwork development, die-line preparation, and print proofing for your brand identity.", color: COLORS.earthBrown },
              { step: "04", title: "Commercial Discussion", desc: "Pricing structure, volume commitments, payment terms, and logistics arrangement finalization. Transparent cost breakdown with competitive pricing backed by our direct sourcing advantage.", color: COLORS.herbalGreen },
              { step: "05", title: "Pilot Order", desc: "Initial production run with full quality validation — including batch testing, COA issuance, and pre-shipment inspection. This trial order validates the entire supply chain from sourcing to delivery.", color: COLORS.turmericGold },
              { step: "06", title: "Scale Rollout", desc: "Full-scale manufacturing and regular supply deployment with dedicated account management, scheduled production planning, and priority capacity allocation for your orders.", color: COLORS.chilliRed },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 sm:gap-6 mb-2 last:mb-0">
                <div className="flex flex-col items-center">
                  <Anim type="zoom-in" delay={300 + i * 250}>
                    <div
                      className="w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0 pres-step-pulse"
                      style={{ background: item.color }}
                    >
                      {item.step}
                    </div>
                  </Anim>
                  {i < 5 && (
                    <Anim type="reveal-up" delay={450 + i * 250}>
                      <div className="w-0.5 h-12 sm:h-16 my-1" style={{ background: `${item.color}30` }} />
                    </Anim>
                  )}
                </div>
                <Anim type="slide-right" delay={400 + i * 250}>
                  <div className="pb-6 sm:pb-8">
                    <h4 className="font-bold text-base sm:text-lg" style={{ color: item.color }}>{item.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </Anim>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12" style={{ background: COLORS.charcoal, borderTop: `3px solid ${COLORS.turmericGold}` }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Anim type="fade-up">
            <img 
              src={bfiLogoImg} 
              alt="Bright Fame Organic Logo" 
              className="h-14 sm:h-20 w-auto object-contain mx-auto mb-3 sm:mb-4"
            />
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Bright Fame Organic</h3>
            <p className="text-xs sm:text-sm mb-1" style={{ color: COLORS.turmericGold }}>
              Sister Concern of Bright Fame International – Three Star Export House
            </p>
            <p className="text-xs text-gray-400 mt-2 sm:mt-3">
              36 MT Daily Processing Capacity | Cryogenic Grinding Technology | Self-Sealing Export Facility
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mt-4 sm:mt-6">
              This presentation is prepared exclusively for partnership discussions. All information is confidential.
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-3 sm:mt-4">
              &copy; {new Date().getFullYear()} Bright Fame Organic. All rights reserved.
            </p>
          </Anim>
        </div>
      </footer>
    </div>
  );
}
