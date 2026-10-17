import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import aerialFacility from "@assets/WhatsApp_Image_2026-10-17_at_8.01.44_AM_(1)_1792207629039.jpeg";
import facilityFront from "@assets/WhatsApp_Image_2026-10-17_at_8.01.43_AM_(1)_1792207629041.jpeg";

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  textColor: string;
  isActive: boolean;
  imageAlt?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function SimpleHeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const shouldPause = isPaused || isHovered || hasFocus;

  // Fetch slides from backend
  const { data: slides = [] } = useQuery<HeroSlide[]>({
    queryKey: ["/api/hero-slides"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // These two editorial slides always lead; active CMS slides remain after them.
  const facilitySlides: HeroSlide[] = [
    {
      id: 1,
      title: "Organic Ingredients. Built for Your Business.",
      subtitle: "Explore our ingredient range",
      description: "Discover herbs, spices, extracts and botanical ingredients for your next formulation.",
      backgroundImage: aerialFacility,
       imageAlt: "Aerial view of a landscaped industrial facility and surrounding grounds",
      textColor: "white",
      isActive: true,
      ctaLabel: "Explore Products",
      ctaHref: "/products",
    },
    {
      id: 2,
      title: "Let’s Talk About Your Next Order",
      subtitle: "Connect with Bright Fame Organic",
      description: "Share your specifications, quantity and delivery requirements with our team.",
      backgroundImage: facilityFront,
      imageAlt: "Front exterior view of a landscaped facility with a glass-fronted entrance",
      textColor: "white",
      isActive: true,
      ctaLabel: "Contact Our Team",
      ctaHref: "/contact",
    },
  ];

  const activeCmsSlides = useMemo(
    () => slides.filter((slide) => slide.isActive).map((slide) => ({
      ...slide,
      ctaLabel: "Explore Products",
      ctaHref: "/products",
      imageAlt: slide.title ? `${slide.title} — Bright Fame Organic` : "Bright Fame Organic ingredient range",
    })),
    [slides],
  );
  const activeSlides = useMemo(() => [...facilitySlides, ...activeCmsSlides], [activeCmsSlides]);

  // Keep selection in range if newly fetched CMS slides change the slide count.
  useEffect(() => {
    setCurrentSlide((index) => Math.min(index, activeSlides.length - 1));
  }, [activeSlides.length]);
  const safeCurrentSlide = Math.max(0, Math.min(currentSlide, activeSlides.length - 1));

  // Auto-advance pauses for user intent and respects reduced-motion settings.
  useEffect(() => {
    if (activeSlides.length <= 1 || shouldPause) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [activeSlides.length, shouldPause]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  if (activeSlides.length === 0) return null;

  const slide = activeSlides[safeCurrentSlide];

  return (
    <section
      className="relative isolate min-h-[470px] h-[62vh] max-h-[720px] overflow-hidden bg-[#173c2b] sm:min-h-[500px] md:h-[66vh]"
      aria-roledescription="carousel"
      aria-label="Bright Fame Organic — organic ingredients for business"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasFocus(false);
      }}
    >
      <div 
        role="img"
        aria-label={slide.imageAlt || "Bright Fame Organic facility"}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 motion-reduce:transition-none"
        style={{ 
          backgroundImage: `url('${slide.backgroundImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 54%',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#10271f]/90 via-[#10271f]/72 to-[#10271f]/18 sm:via-[#10271f]/65" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#10271f]/55 via-transparent to-[#10271f]/15" />

      <div className="relative z-10 flex h-full items-center py-14 sm:py-12">
        <div className="container mx-auto px-6 sm:px-20">
          <div className="max-w-3xl space-y-4 sm:space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4e5bd] sm:text-sm">
                Bright Fame Organic
              </p>
              <h1 
                key={`title-${slide.id}`}
                className="max-w-3xl text-3xl font-bold leading-[1.08] tracking-tight text-white animate-[slideInLeft_500ms_ease-out_both] motion-reduce:animate-none sm:text-4xl md:text-5xl lg:text-[3.7rem]"
              >
                {slide.title}
              </h1>
              <h2 
                className="text-lg font-semibold text-[#d4e5bd] sm:text-xl"
              >
                {slide.subtitle}
              </h2>
              <p 
                className="max-w-xl text-sm leading-relaxed text-white/90 sm:text-base md:text-lg"
              >
                {slide.description}
              </p>
              <div className="pt-2">
                <Button
                  asChild
                  className="h-11 rounded-md bg-[#d7e6c4] px-6 font-semibold text-[#173c2b] shadow-md transition-colors hover:bg-white focus-visible:ring-[#d7e6c4]"
                >
                  <a href={slide.ctaHref || "/products"}>{slide.ctaLabel || "Explore Products"}</a>
                </Button>
              </div>
          </div>
        </div>
      </div>

      {activeSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute bottom-5 left-5 z-20 rounded-full border border-white/35 bg-[#173c2b]/75 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-[#173c2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7e6c4] sm:bottom-auto sm:left-6 sm:top-1/2 sm:-translate-y-1/2"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute bottom-5 right-5 z-20 rounded-full border border-white/35 bg-[#173c2b]/75 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-[#173c2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7e6c4] sm:bottom-auto sm:right-6 sm:top-1/2 sm:-translate-y-1/2"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 sm:bottom-7">
            <div className="flex items-center gap-2.5 rounded-full border border-white/20 bg-[#173c2b]/65 px-3 py-2 backdrop-blur-sm">
              {activeSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7e6c4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#173c2b] ${
                    index === safeCurrentSlide
                      ? "w-7 bg-[#d7e6c4]"
                      : "w-2.5 bg-white/65 hover:bg-white"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === safeCurrentSlide ? "true" : undefined}
                />
              ))}
              <button
                onClick={() => setIsPaused((paused) => !paused)}
                className="ml-1 rounded-full p-1 text-white transition-colors hover:text-[#d7e6c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7e6c4]"
                aria-label={isPaused ? "Resume automatic slide advance" : "Pause automatic slide advance"}
                aria-pressed={isPaused}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}