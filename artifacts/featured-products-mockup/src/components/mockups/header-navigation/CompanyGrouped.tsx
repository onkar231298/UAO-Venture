import { useState, type FormEvent, type ReactNode } from "react";
import {
  Award,
  Check,
  ChevronDown,
  ChevronRight,
  Globe,
  Heart,
  Leaf,
  Menu,
  MessageCircle,
  Phone,
  Search,
  User,
} from "lucide-react";
import "./_group.css";
import "./CompanyGrouped.css";

const categories = [
  { name: "Herbal Powders", slug: "herbal-powders" },
  { name: "Spices", slug: "spices" },
  { name: "Essential Oils", slug: "essential-oils" },
  { name: "Adaptogenic Herbs", slug: "adaptogenic-herbs" },
  { name: "Ayurvedic Herbs", slug: "ayurvedic-herbs" },
  { name: "Botanical Extracts", slug: "botanical-extracts" },
];

const healthSupports = [
  { name: "Digestive Support", slug: "digestive-health" },
  { name: "Immune Support", slug: "immune-health" },
  { name: "Cognitive Support", slug: "cognitive-health" },
  { name: "Stress Relief", slug: "stress-relief" },
  { name: "Energy & Vitality", slug: "energy-vitality" },
  { name: "Cardiovascular Support", slug: "cardiovascular-health" },
];

const industries = [
  {
    title: "Food Ingredients",
    description: "EU certified organic ingredients for food manufacturers",
    href: "/food-ingredients",
  },
  {
    title: "Organic Herbs",
    description: "Premium medicinal & Ayurvedic herbs for pharma industry",
    href: "/organic-herbs",
  },
  {
    title: "EU Organic Spices",
    description: "European market certified organic spices & seasonings",
    href: "/eu-organic-spices",
  },
];

const companyLinks = [
  { name: "About Us", href: "/about-us", detail: "Our story & standards" },
  { name: "Our Team", href: "/our-team", detail: "Meet your partners" },
  { name: "Our Farmers", href: "/our-farmers", detail: "From source to supply" },
  { name: "Contact", href: "/contact", detail: "Talk with our team" },
  { name: "Certifications", href: "/certifications", detail: "Proof behind every claim" },
];

type DropdownName = "ingredients" | "industries" | "health" | "company";

function DropdownMenu({
  name,
  label,
  open,
  setOpen,
  children,
  className = "",
}: {
  name: DropdownName;
  label: string;
  open: DropdownName | null;
  setOpen: (name: DropdownName | null) => void;
  children: ReactNode;
  className?: string;
}) {
  const isOpen = open === name;
  return (
    <div className="bf-group-menu relative">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpen(isOpen ? null : name)}
        className={`bf-group-nav-trigger flex items-center gap-1.5 ${isOpen ? "is-open" : ""} ${className}`}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="bf-group-dropdown absolute left-0 top-full z-[60] mt-3 text-gray-800">
          {children}
        </div>
      )}
    </div>
  );
}

function MobileSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[#e8e9df] last:border-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3.5 text-left text-[14px] font-semibold text-[#303b2f]"
      >
        {title}
        <ChevronRight className={`h-4 w-4 text-[#75806d] transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && <div className="grid gap-1 pb-3 pl-3">{children}</div>}
    </section>
  );
}

function SimpleMenuLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="bf-group-dropdown-link">
      {children}
    </a>
  );
}

export function CompanyGrouped() {
  const [openDropdown, setOpenDropdown] = useState<DropdownName | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(false);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedSearch(searchQuery.trim());
  };

  const toggleMobileSection = (section: string) => {
    setMobileExpanded(mobileExpanded === section ? null : section);
  };

  return (
    <header className="bf-group-header sticky top-0 z-50">
      <div className="bf-group-topline">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-4 sm:px-7 lg:px-9">
          <span className="hidden items-center gap-2 sm:flex">
            <span className="h-px w-5 bg-[#94aa72]" />
            Certified organic ingredients, thoughtfully sourced
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Trusted supply for makers worldwide
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-4 py-3.5 sm:px-7 lg:px-9">
        <div className="flex min-h-[56px] items-center justify-between gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <a href="/" aria-label="Bright Fame Organic home" className="flex items-center transition-opacity hover:opacity-80">
              <img
                src="/__featured-products-mockup/images/bright-fame-logo.png"
                alt="Bright Fame Organic"
                className="h-10 w-auto object-contain sm:h-12"
              />
            </a>
            <button
              type="button"
              aria-label={showMobileMenu ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={showMobileMenu}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="bf-group-mobile-toggle ml-1 rounded-full p-2.5 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <nav aria-label="Primary navigation" className="hidden items-center gap-3 xl:gap-5 lg:flex">
            <a href="/" className="bf-group-nav-link is-current">Home</a>
            <a href="/products" className="bf-group-nav-link">Products</a>
            <DropdownMenu name="ingredients" label="Ingredients" open={openDropdown} setOpen={setOpenDropdown}>
              <div className="w-[490px] p-4">
                <div className="mb-3 flex items-end justify-between">
                  <div>
                    <div className="bf-group-kicker">Explore the range</div>
                    <div className="mt-1 text-[19px] font-semibold tracking-[-0.03em] text-[#263629]">Organic ingredients</div>
                  </div>
                  <a href="/products" className="text-xs font-semibold text-[#55743d] hover:underline">All Ingredients →</a>
                </div>
                <div className="grid grid-cols-2 gap-1 border-t border-[#e8e9df] pt-3">
                  {categories.map((category) => (
                    <SimpleMenuLink key={category.slug} href={`/ingredients/${category.slug}`}>{category.name}</SimpleMenuLink>
                  ))}
                </div>
              </div>
            </DropdownMenu>
            <DropdownMenu name="industries" label="Industries" open={openDropdown} setOpen={setOpenDropdown}>
              <div className="w-[340px] space-y-1 p-3">
                {industries.map((industry) => (
                  <a key={industry.href} href={industry.href} className="bf-group-industry-link">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0f2e8] text-[#5e7647]"><Leaf className="h-4 w-4" /></span>
                    <span><span className="block text-sm font-semibold text-[#2e392f]">{industry.title}</span><span className="mt-0.5 block text-xs leading-relaxed text-[#74796e]">{industry.description}</span></span>
                  </a>
                ))}
              </div>
            </DropdownMenu>
            <DropdownMenu name="health" label="Health Support" open={openDropdown} setOpen={setOpenDropdown}>
              <div className="w-[490px] p-4">
                <div className="mb-3 flex items-end justify-between">
                  <div>
                    <div className="bf-group-kicker">Find by function</div>
                    <div className="mt-1 text-[19px] font-semibold tracking-[-0.03em] text-[#263629]">Health support</div>
                  </div>
                  <a href="/products" className="text-xs font-semibold text-[#55743d] hover:underline">All Health Support →</a>
                </div>
                <div className="grid grid-cols-2 gap-1 border-t border-[#e8e9df] pt-3">
                  {healthSupports.map((support) => (
                    <SimpleMenuLink key={support.slug} href={`/health-support/${support.slug}`}>{support.name}</SimpleMenuLink>
                  ))}
                </div>
              </div>
            </DropdownMenu>
            <DropdownMenu name="company" label="Company" open={openDropdown} setOpen={setOpenDropdown}>
              <div className="w-[300px] p-3">
                <div className="px-3 pb-2 pt-1">
                  <div className="bf-group-kicker">People, purpose & proof</div>
                  <div className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-[#263629]">Get to know us</div>
                </div>
                {companyLinks.map((link, index) => (
                  <a key={link.href} href={link.href} className="bf-group-company-link">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f2f3ec] text-[#68804e]">
                      {index === 4 ? <Award className="h-4 w-4" /> : index === 3 ? <Phone className="h-4 w-4" /> : <Leaf className="h-4 w-4" />}
                    </span>
                    <span><span className="block text-sm font-semibold text-[#303a30]">{link.name}</span><span className="mt-0.5 block text-[11px] text-[#818479]">{link.detail}</span></span>
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#a1a593]" />
                  </a>
                ))}
              </div>
            </DropdownMenu>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden items-center gap-1.5 border-r border-[#e7e8de] pr-3 text-[12px] font-medium text-[#70786b] xl:flex">
              <Globe className="h-4 w-4 text-[#748761]" />
              <span>India</span>
            </div>
            <button
              type="button"
              aria-label={wishlisted ? "Remove from wishlist" : "Wishlist"}
              aria-pressed={wishlisted}
              onClick={() => setWishlisted(!wishlisted)}
              className={`bf-group-icon-button hidden sm:flex ${wishlisted ? "is-selected" : ""}`}
            >
              <Heart className={`h-[18px] w-[18px] ${wishlisted ? "fill-current" : ""}`} />
              <span className="ml-1 text-[11px] tabular-nums">{wishlisted ? "1" : "0"}</span>
            </button>
            <a href="/login" className="bf-group-account">
              <User className="h-[17px] w-[17px]" />
              <span className="hidden sm:inline">Login</span>
            </a>
          </div>
        </div>
      </div>

      <div className="bf-group-searchbar">
        <div className="mx-auto flex max-w-[1320px] items-center gap-2 px-4 py-2.5 sm:gap-4 sm:px-7 lg:px-9">
          <div className="relative shrink-0">
            <button
              type="button"
              aria-expanded={showCategories}
              onClick={() => setShowCategories(!showCategories)}
              className="bf-group-category-button"
            >
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline">ALL CATEGORIES</span>
              <span className="sm:hidden">Categories</span>
              <ChevronDown className={`hidden h-3 w-3 sm:block transition-transform ${showCategories ? "rotate-180" : ""}`} />
            </button>
            {showCategories && (
              <div className="bf-group-dropdown absolute left-0 top-full z-[60] mt-2 w-64 p-2">
                <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#89917d]">Browse ingredients</div>
                {categories.map((category) => (
                  <a key={category.slug} href={`/ingredients/${category.slug}`} className="bf-group-dropdown-link">{category.name}</a>
                ))}
              </div>
            )}
          </div>
          <div className="relative min-w-0 flex-1">
            <form onSubmit={handleSearch} className="relative">
              <input
                aria-label="Search organic ingredients"
                type="search"
                placeholder="Search organic ingredients..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSubmittedSearch("");
                }}
                className="bf-group-search-input"
              />
              <button type="submit" aria-label="Search" className="bf-group-search-submit"><Search className="h-4 w-4" /></button>
            </form>
            {submittedSearch && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[#e7e8de] bg-white px-4 py-3 text-sm text-[#596253] shadow-lg">
                Search for “{submittedSearch}”
              </div>
            )}
          </div>
          <div className="hidden items-center gap-5 text-[12px] lg:flex">
            <a href="tel:+917249847439" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"><Phone className="h-4 w-4" /></span>
              <span><span className="block text-[10px] tracking-wide text-[#d6dfc9]">CUSTOMER SUPPORT</span><span className="mt-0.5 block font-semibold tracking-[.02em]">+91-7249847439</span></span>
            </a>
            <a href="https://wa.me/917249847439" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border-l border-white/20 pl-5 font-medium transition-opacity hover:opacity-75">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {showMobileMenu && (
        <div className="bf-group-mobile-panel lg:hidden">
          <nav aria-label="Mobile navigation" className="mx-auto max-w-[1320px] px-4 py-2 sm:px-7">
            <a href="/" className="bf-group-mobile-link is-current"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e9efdf] text-[#5e7848]"><Leaf className="h-4 w-4" /></span>Home</a>
            <a href="/products" className="bf-group-mobile-link"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f3ec] text-[#71805f]"><Search className="h-4 w-4" /></span>Products</a>
            <a href="/blog" className="bf-group-mobile-link"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f3ec] text-[#71805f]">B</span>Blog</a>
            <MobileSection title="Ingredients" open={mobileExpanded === "ingredients"} onToggle={() => toggleMobileSection("ingredients")}>
              <a href="/ingredients" className="bf-group-mobile-sub-link">View All Ingredients</a>
              <a href="/products" className="bf-group-mobile-sub-link font-semibold">All Ingredients</a>
              {categories.map((category) => <a key={category.slug} href={`/ingredients/${category.slug}`} className="bf-group-mobile-sub-link">{category.name}</a>)}
            </MobileSection>
            <MobileSection title="Industries" open={mobileExpanded === "industries"} onToggle={() => toggleMobileSection("industries")}>
              {industries.map((industry) => <a key={industry.href} href={industry.href} className="bf-group-mobile-sub-link">{industry.title}<span className="block text-[11px] font-normal text-[#85897d]">{industry.description}</span></a>)}
            </MobileSection>
            <MobileSection title="Health Support" open={mobileExpanded === "health"} onToggle={() => toggleMobileSection("health")}>
              <a href="/products" className="bf-group-mobile-sub-link font-semibold">All Health Support</a>
              {healthSupports.map((support) => <a key={support.slug} href={`/health-support/${support.slug}`} className="bf-group-mobile-sub-link">{support.name}</a>)}
            </MobileSection>
            <MobileSection title="Company" open={mobileExpanded === "company"} onToggle={() => toggleMobileSection("company")}>
              {companyLinks.map((link) => <a key={link.href} href={link.href} className="bf-group-mobile-sub-link">{link.name}</a>)}
            </MobileSection>
            <div className="flex items-center justify-between border-t border-[#e8e9df] py-3">
              <a href="/login" className="flex items-center gap-2 text-sm font-semibold text-[#384638]"><User className="h-4 w-4" /> Login</a>
              <button type="button" onClick={() => setWishlisted(!wishlisted)} className="flex items-center gap-2 text-sm font-semibold text-[#65744f]" aria-pressed={wishlisted}>
                <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} /> Wishlist {wishlisted ? "1" : "0"}
              </button>
            </div>
            <div className="flex items-center gap-4 border-t border-[#e8e9df] py-3 text-xs text-[#596653]">
              <a href="tel:+917249847439" className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />+91-7249847439</a>
              <a href="https://wa.me/917249847439" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
