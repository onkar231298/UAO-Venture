import { useEffect, useMemo, useState } from "react";
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

  const { data: slides = [] } = useQuery<HeroSlide[]>({
    queryKey: ["/api/hero-slides"],
    staleTime: 5 * 60 * 1000,
  });

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
    () =>
      slides.filter((slide) => slide.isActive).map((slide) => ({
        ...slide,
        ctaLabel: "Explore Products",
        ctaHref: "/products",
        imageAlt: slide.title
          ? `${slide.title} — Bright Fame Organic`
          : "Bright Fame Organic ingredient range",
      })),
    [slides],
  );
  const activeSlides = useMemo(() => [...facilitySlides, ...activeCmsSlides], [activeCmsSlides]);

  useEffect(() => {
    setCurrentSlide((index) => Math.min(index, activeSlides.length - 1));
  }, [activeSlides.length]);

  const safeCurrentSlide = Math.max(0, Math.min(currentSlide, activeSlides.length - 1));

  useEffect(() => {
    if (activeSlides.length <= 1 || shouldPause) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const interval = window.setInterval(() => {
      setCurrentSlide((previous) => (previous + 1) % activeSlides.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [activeSlides.length, shouldPause]);

  const nextSlide = () => setCurrentSlide((previous) => (previous + 1) % activeSlides.length);
  const prevSlide = () => setCurrentSlide((previous) => (previous - 1 + activeSlides.length) % activeSlides.length);

  if (activeSlides.length === 0) return null;

  const slide = activeSlides[safeCurrentSlide];

  return (
    <section
      className="relative isolate overflow-hidden bg-[#edf4e9] px-0 py-3 sm:py-5 lg:py-6"
      aria-roledescription="carousel"
      aria-label="Bright Fame Organic — organic ingredients for business"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasFocus(false);
      }}
    >
      <div className="w-full">
        <div
          className="grid w-full overflow-hidden rounded-none border-y border-[#31563d] bg-[#173c2b] shadow-[0_18px_55px_-38px_rgba(28,54,39,0.48)] md:min-h-[430px] md:grid-cols-[1.03fr_0.97fr] lg:min-h-[500px]"
          aria-live="off"
        >
          <div className="group relative min-h-[225px] overflow-hidden bg-[#dce2d2] sm:min-h-[290px] md:min-h-full">
            <img
              key={`image-${slide.id}`}
              src={slide.backgroundImage}
              alt={slide.imageAlt || "Bright Fame Organic facility"}
              className="absolute inset-0 h-full w-full object-cover object-center motion-safe:animate-[slideInLeft_500ms_ease-out_both] motion-reduce:animate-none"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#173c2b]/55 via-transparent to-[#173c2b]/5" />
            <div className="absolute bottom-4 left-4 rounded-full border border-white/45 bg-[#f8f7ef]/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#244332] backdrop-blur sm:bottom-6 sm:left-6 sm:text-[11px]">
              Bright Fame Organic
            </div>

            {activeSlides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-[#173c2b]/80 text-white shadow-md backdrop-blur transition-colors hover:bg-[#173c2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e1edc9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#173c2b] sm:left-5 sm:h-11 sm:w-11"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-[#173c2b]/80 text-white shadow-md backdrop-blur transition-colors hover:bg-[#173c2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e1edc9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#173c2b] sm:right-5 sm:h-11 sm:w-11"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-center px-6 py-8 sm:px-9 sm:py-10 md:px-9 md:py-12 lg:px-14 lg:py-14">
            <div className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4e5bd] sm:text-[11px]">
              <span className="h-px w-8 bg-[#a6bd8c]" aria-hidden="true" />
              Organic supply, considered
            </div>
            <div key={`copy-${slide.id}`} className="motion-safe:animate-[slideInLeft_500ms_ease-out_both] motion-reduce:animate-none">
              <h1 className="max-w-[13ch] font-serif text-[2.15rem] font-medium leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl lg:text-[3.6rem]">
                {slide.title}
              </h1>
              <h2 className="mt-4 text-base font-semibold leading-snug text-[#d4e5bd] sm:mt-5 sm:text-lg">
                {slide.subtitle}
              </h2>
              <p className="mt-3 max-w-[42ch] text-sm leading-7 text-white/85 sm:mt-4 sm:text-base sm:leading-8">
                {slide.description}
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row sm:mt-8">
              <Button
                asChild
                className="h-12 justify-center rounded-md bg-[#d7e6c4] px-5 font-semibold text-[#173c2b] shadow-sm transition-colors hover:bg-white focus-visible:ring-[#d7e6c4]"
              >
                <a href="/products">Explore Products</a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 justify-center rounded-md border-white/55 bg-transparent px-5 font-semibold text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:ring-[#d7e6c4]"
              >
                <a href="/contact">Contact Our Team</a>
              </Button>
            </div>
          </div>
        </div>

        {activeSlides.length > 1 && (
          <div className="flex min-h-14 flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 pt-3 sm:justify-between sm:px-1 sm:pt-4">
            <span className="hidden text-xs font-medium tracking-wide text-[#66715e] sm:block">
              {String(safeCurrentSlide + 1).padStart(2, "0")} <span className="mx-1 text-[#a8ae9d]">/</span>{" "}
              {String(activeSlides.length).padStart(2, "0")}
            </span>
            <div className="flex max-w-full items-center gap-2 overflow-x-auto rounded-full border border-[#d2d7c9] bg-[#fbfaf5] px-3 py-2">
              <div className="flex shrink-0 items-center gap-2" role="group" aria-label="Choose a slide">
                {activeSlides.map((item, index) => (
                  <button
                    key={`${index}-${item.id}`}
                    type="button"
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2.5 rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315d42] focus-visible:ring-offset-2 ${
                      index === safeCurrentSlide ? "w-7 bg-[#315d42]" : "w-2.5 bg-[#a8b09e] hover:bg-[#68785c]"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={index === safeCurrentSlide ? "true" : undefined}
                  />
                ))}
              </div>
              <span className="mx-0.5 h-4 w-px bg-[#d5d9cf]" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setIsPaused((paused) => !paused)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#31513a] transition-colors hover:bg-[#e8ecdf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315d42]"
                aria-label={isPaused ? "Resume automatic slide advance" : "Pause automatic slide advance"}
                aria-pressed={isPaused}
              >
                {isPaused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
