import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import aerialFacility from "@assets/WhatsApp_Image_2026-10-17_at_8.01.44_AM_(1)_1792207629039.jpeg";
import facilityFront from "@assets/WhatsApp_Image_2026-10-17_at_8.01.43_AM_(1)_1792207629041.jpeg";
import rawMaterialReceiving from "@assets/WhatsApp_Image_2026-10-17_at_9.15.32_AM_1792213063349.jpeg";
import ingredientSorting from "@assets/WhatsApp_Image_2026-10-17_at_9.24.20_AM_1792213063350.jpeg";
import processingEquipment from "@assets/WhatsApp_Image_2026-10-17_at_9.28.03_AM_1792213063351.jpeg";
import packagingArea from "@assets/WhatsApp_Image_2026-10-17_at_9.37.50_AM_1792213063351.jpeg";
import steamSterilisation from "@assets/WhatsApp_Image_2026-10-17_at_9.42.51_AM_1792213063351.jpeg";
import dispatchArea from "@assets/WhatsApp_Image_2026-10-17_at_9.47.43_AM_1792213063352.jpeg";
import laboratory from "@assets/WhatsApp_Image_2026-10-17_at_9.50.22_AM_1792213063348.jpeg";
import { getSafeHeroActionHref, isExternalHeroActionHref } from "@shared/heroSlideActions";

interface HeroAction {
  label: string;
  href: string;
  external: boolean;
}

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
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  buttonText?: string | null;
  buttonLink?: string | null;
  secondaryButtonText?: string | null;
  secondaryButtonLink?: string | null;
  actions: HeroAction[];
}

function makeHeroAction(label: string | null | undefined, destination: string | null | undefined): HeroAction | null {
  const href = getSafeHeroActionHref(destination);
  const safeLabel = label?.trim();
  if (!safeLabel || !href) return null;
  return { label: safeLabel, href, external: isExternalHeroActionHref(href) };
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

  const facilitySlideContent: Omit<HeroSlide, "actions">[] = [
    {
      id: 1,
      title: "Organic Ingredients for Your Next Product",
      subtitle: "Explore our ingredient range",
      description: "Find organic herbs, spices, extracts and botanicals for your food, wellness and manufacturing needs.",
      backgroundImage: aerialFacility,
      imageAlt: "Aerial view of a landscaped industrial facility and surrounding grounds",
      textColor: "white",
      isActive: true,
      ctaLabel: "Explore Products",
      ctaHref: "/products",
      secondaryCtaLabel: "Talk to Our Team",
      secondaryCtaHref: "/contact",
    },
    {
      id: 2,
      title: "Let’s Plan Your Next Order",
      subtitle: "Connect with Atlas Ingredients",
      description: "Share your ingredient specifications, target quantities and delivery needs with our team.",
      backgroundImage: facilityFront,
      imageAlt: "Front exterior view of a landscaped facility with a glass-fronted entrance",
      textColor: "white",
      isActive: true,
      ctaLabel: "Talk to Our Team",
      ctaHref: "/contact",
      secondaryCtaLabel: "Explore Products",
      secondaryCtaHref: "/products",
    },
    {
      id: 3,
      title: "Ingredient Receiving & Inspection",
      subtitle: "A careful start for every order",
      description: "See the receiving and sampling areas where incoming ingredients are prepared for review.",
      backgroundImage: rawMaterialReceiving,
      imageAlt: "Raw materials arriving at a receiving and inspection area",
      textColor: "white",
      isActive: true,
      ctaLabel: "Discuss Your Requirements",
      ctaHref: "/contact",
      secondaryCtaLabel: "Explore Products",
      secondaryCtaHref: "/products",
    },
    {
      id: 4,
      title: "Careful Sorting, Step by Step",
      subtitle: "A closer look at ingredient preparation",
      description: "Our team sorts turmeric as ingredients move through the preparation process.",
      backgroundImage: ingredientSorting,
      imageAlt: "Workers sorting turmeric in a clean production area",
      textColor: "white",
      isActive: true,
      ctaLabel: "Explore Products",
      ctaHref: "/products",
      secondaryCtaLabel: "Talk to Our Team",
      secondaryCtaHref: "/contact",
    },
    {
      id: 5,
      title: "Processing Equipment, Up Close",
      subtitle: "From raw ingredient to finished product",
      description: "Explore the machinery and production spaces shown across our facility.",
      backgroundImage: processingEquipment,
      imageAlt: "Stainless steel ingredient processing equipment on the production floor",
      textColor: "white",
      isActive: true,
      ctaLabel: "Ask About Processing",
      ctaHref: "/contact",
      secondaryCtaLabel: "Explore Products",
      secondaryCtaHref: "/products",
    },
    {
      id: 6,
      title: "Steam Sterilisation Area",
      subtitle: "A look inside our facility",
      description: "See the dedicated steam sterilisation space and speak with our team about your product needs.",
      backgroundImage: steamSterilisation,
      imageAlt: "Steam sterilisation equipment in a dedicated production area",
      textColor: "white",
      isActive: true,
      ctaLabel: "Discuss Your Requirements",
      ctaHref: "/contact",
      secondaryCtaLabel: "Explore Products",
      secondaryCtaHref: "/products",
    },
    {
      id: 7,
      title: "Laboratory & Sample Review",
      subtitle: "Discuss your quality requirements",
      description: "Take a closer look at the laboratory space and measurement equipment used for product review.",
      backgroundImage: laboratory,
      imageAlt: "Laboratory workspace with testing equipment and a seated technician",
      textColor: "white",
      isActive: true,
      ctaLabel: "Discuss Quality Needs",
      ctaHref: "/contact",
      secondaryCtaLabel: "Explore Products",
      secondaryCtaHref: "/products",
    },
    {
      id: 8,
      title: "Packaging for Your Supply Needs",
      subtitle: "A view of the packaging area",
      description: "Talk with us about packaging formats, order quantities and delivery requirements.",
      backgroundImage: packagingArea,
      imageAlt: "Workers preparing ingredient packages in the packaging area",
      textColor: "white",
      isActive: true,
      ctaLabel: "Discuss Packaging",
      ctaHref: "/contact",
      secondaryCtaLabel: "Explore Products",
      secondaryCtaHref: "/products",
    },
    {
      id: 9,
      title: "Ready for the Next Step",
      subtitle: "Plan your next supply",
      description: "Share the quantities and delivery timing you need, and our team can discuss next steps.",
      backgroundImage: dispatchArea,
      imageAlt: "Packaged raw materials and forklift in the dispatch area",
      textColor: "white",
      isActive: true,
      ctaLabel: "Talk to Our Team",
      ctaHref: "/contact",
      secondaryCtaLabel: "Explore Products",
      secondaryCtaHref: "/products",
    },
  ];

  const facilitySlides: HeroSlide[] = facilitySlideContent.map((slide) => ({
    ...slide,
    actions: [
      makeHeroAction(slide.ctaLabel, slide.ctaHref),
      makeHeroAction(slide.secondaryCtaLabel, slide.secondaryCtaHref),
    ].filter((action): action is HeroAction => action !== null),
  }));

  const activeCmsSlides = useMemo(
    () =>
      slides.filter((slide) => slide.isActive).map((slide) => {
        const configuredButtonText = slide.buttonText?.trim();
        const configuredButtonLink = slide.buttonLink?.trim();
        const buttonSuggestsContact = /contact|talk|discuss|enquir|inquir|quote/i.test(configuredButtonText || "");
        const inferredPrimaryHref = buttonSuggestsContact ? "/contact" : "/products";
        const primaryHref = configuredButtonLink || inferredPrimaryHref;
        const safePrimaryHref = getSafeHeroActionHref(primaryHref);
        const hasContactPrimary = safePrimaryHref
          ? /^\/contact(?:\/|$|[?#])/i.test(safePrimaryHref)
          : false;

        return {
          ...slide,
          actions: [
            makeHeroAction(
              configuredButtonText || (hasContactPrimary ? "Talk to Our Team" : "Explore Products"),
              primaryHref,
            ),
            makeHeroAction(
              slide.secondaryButtonText?.trim() || (hasContactPrimary ? "Explore Products" : "Talk to Our Team"),
              slide.secondaryButtonLink?.trim() || (hasContactPrimary ? "/products" : "/contact"),
            ),
          ].filter((action): action is HeroAction => action !== null),
          imageAlt: slide.title
            ? `${slide.title} — Atlas Ingredients`
            : "Atlas Ingredients ingredient range",
        };
      }),
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
      aria-label="Atlas Ingredients — organic ingredients for business"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasFocus(false);
      }}
    >
      <div className="w-full">
        <div
          className="hero-slider-frame grid w-full overflow-hidden rounded-none border-y border-[#31563d] bg-[#173c2b] shadow-[0_18px_55px_-38px_rgba(28,54,39,0.48)] md:min-h-[430px] md:grid-cols-[1.03fr_0.97fr] lg:min-h-[500px]"
          aria-live="off"
        >
          <div className="hero-photo-frame group relative min-h-[225px] overflow-hidden bg-[#dce2d2] sm:min-h-[290px] md:min-h-full">
            <img
              key={`image-${slide.id}`}
              src={slide.backgroundImage}
              alt={slide.imageAlt || "Atlas Ingredients facility"}
              className="hero-slide-photo-dissolve absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#173c2b]/55 via-transparent to-[#173c2b]/5" />
            <div className="absolute bottom-4 left-4 z-10 rounded-full border border-white/45 bg-[#f8f7ef]/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#244332] backdrop-blur sm:bottom-6 sm:left-6 sm:text-[11px]">
              Atlas Ingredients
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

          <div className="hero-slider-copy-panel flex min-w-0 flex-col justify-center px-6 py-8 sm:px-9 sm:py-10 md:px-7 md:py-9 lg:px-14 lg:py-14">
            <div className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4e5bd] sm:text-[11px]">
              <span className="h-px w-8 bg-[#a6bd8c]" aria-hidden="true" />
              Organic supply, considered
            </div>
            <div key={`copy-${slide.id}`} className="hero-slide-copy-dissolve">
              <h1 className="max-w-[13ch] font-serif text-[2.15rem] font-medium leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl md:text-[2.75rem] lg:text-[3.6rem]">
                {slide.title}
              </h1>
              <h2 className="mt-4 text-base font-semibold leading-snug text-[#d4e5bd] sm:mt-5 sm:text-lg">
                {slide.subtitle}
              </h2>
              <p className="mt-3 max-w-[42ch] text-sm leading-7 text-white/85 sm:mt-4 sm:text-base sm:leading-8">
                {slide.description}
              </p>
            </div>

            {slide.actions.length > 0 && (
              <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row sm:mt-8 md:flex-wrap">
                {slide.actions.map((action, index) => (
                  <Button
                    key={`${action.href}-${index}`}
                    asChild
                    variant={index === 0 ? "default" : "outline"}
                    className={index === 0
                      ? "h-12 w-fit max-w-full justify-center rounded-md bg-[#d7e6c4] px-5 font-semibold text-[#173c2b] shadow-sm transition-colors hover:bg-white focus-visible:ring-[#d7e6c4] md:px-3 lg:px-5"
                      : "h-12 w-fit max-w-full justify-center rounded-md border-white/55 bg-transparent px-5 font-semibold text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:ring-[#d7e6c4] md:px-3 lg:px-5"}
                  >
                    <a
                      href={action.href}
                      target={action.external ? "_blank" : undefined}
                      rel={action.external ? "noopener noreferrer" : undefined}
                    >
                      {action.label}
                    </a>
                  </Button>
                ))}
              </div>
            )}
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
