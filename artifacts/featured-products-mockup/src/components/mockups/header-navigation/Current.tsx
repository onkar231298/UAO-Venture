import { useState, type FormEvent, type ReactNode } from "react";
import {
  Award,
  ChevronDown,
  ChevronRight,
  Globe,
  Heart,
  Info,
  Leaf,
  Menu,
  MessageCircle,
  Phone,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import "./_group.css";

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

const aboutLinks = [
  { name: "About Us", href: "/about-us" },
  { name: "Our Team", href: "/our-team" },
  { name: "Our Farmers", href: "/our-farmers" },
];

type DropdownName = "ingredients" | "industries" | "health" | "about";

function DropdownLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className={`block rounded-md ${className}`}>
      {children}
    </a>
  );
}

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
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpen(isOpen ? null : name)}
        className={`flex h-auto items-center border-b-2 border-transparent p-0 pb-1 text-sm font-medium text-gray-700 transition-colors hover:border-green-600 hover:text-green-600 ${className}`}
      >
        {label} <ChevronDown className="ml-1 h-3 w-3" />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-[60] mt-2 rounded-md border border-gray-200 bg-white p-3 text-gray-800 shadow-xl">
          {children}
        </div>
      )}
    </div>
  );
}

function CategoryLinks({ onClick }: { onClick?: () => void }) {
  return (
    <>
      <DropdownLink
        href="/products"
        className="mb-3 bg-green-500 py-3 text-center font-semibold text-white hover:bg-green-600"
      >
        All Ingredients
      </DropdownLink>
      <div className="mb-2 border-t border-gray-200" />
      <div className="grid grid-cols-3 gap-1">
        {categories.map((category) => (
          <a
            key={category.slug}
            href={`/ingredients/${category.slug}`}
            onClick={onClick}
            className="rounded px-2 py-1.5 text-xs leading-tight hover:bg-gray-50"
          >
            {category.name}
          </a>
        ))}
      </div>
    </>
  );
}

function HealthSupportLinks({ onClick }: { onClick?: () => void }) {
  return (
    <>
      <DropdownLink
        href="/products"
        className="mb-3 bg-green-500 py-3 text-center font-semibold text-white hover:bg-green-600"
      >
        All Health Support
      </DropdownLink>
      <div className="mb-2 border-t border-gray-200" />
      <div className="grid grid-cols-3 gap-1">
        {healthSupports.map((support) => (
          <a
            key={support.slug}
            href={`/health-support/${support.slug}`}
            onClick={onClick}
            className="rounded px-2 py-1.5 text-xs leading-tight hover:bg-gray-50"
          >
            {support.name}
          </a>
        ))}
      </div>
    </>
  );
}

export function Current() {
  const [openDropdown, setOpenDropdown] = useState<DropdownName | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSubmitted, setSearchSubmitted] = useState("");
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchSubmitted(searchQuery.trim());
  };

  const toggleMobileSection = (section: string) => {
    setMobileExpanded(mobileExpanded === section ? null : section);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-lg">
      <div className="mx-auto max-w-[1280px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex shrink-0 items-center">
            <a href="/" className="flex cursor-pointer items-center transition-opacity hover:opacity-90">
              <img
                src="/__featured-products-mockup/images/bright-fame-logo.png"
                alt="Bright Fame Organic"
                className="h-10 w-auto object-contain sm:h-12"
              />
            </a>
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={showMobileMenu}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="ml-4 rounded-md p-2 text-gray-600 hover:bg-green-50 hover:text-green-600 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <nav className="hidden items-center space-x-3 xl:space-x-5 lg:flex">
            <a
              href="/"
              className="border-b-2 border-green-600 pb-1 text-sm font-medium text-green-600 transition-colors hover:border-green-600 hover:text-green-600"
            >
              Home
            </a>
            <a
              href="/products"
              className="border-b-2 border-transparent pb-1 text-sm font-medium text-gray-700 transition-colors hover:border-green-600 hover:text-green-600"
            >
              Products
            </a>
            <DropdownMenu name="ingredients" label="Ingredients" open={openDropdown} setOpen={setOpenDropdown}>
              <div className="w-[500px]">
                <CategoryLinks />
              </div>
            </DropdownMenu>
            <DropdownMenu name="industries" label="Industries" open={openDropdown} setOpen={setOpenDropdown}>
              <div className="w-80 space-y-2">
                {industries.map((industry) => (
                  <DropdownLink
                    key={industry.href}
                    href={industry.href}
                    className="rounded-md border border-gray-100 p-3 hover:bg-green-50"
                  >
                    <div className="font-medium text-gray-900">{industry.title}</div>
                    <div className="text-xs text-gray-600">{industry.description}</div>
                  </DropdownLink>
                ))}
              </div>
            </DropdownMenu>
            <DropdownMenu name="health" label="Health Support" open={openDropdown} setOpen={setOpenDropdown}>
              <div className="w-[500px]">
                <HealthSupportLinks />
              </div>
            </DropdownMenu>
            <DropdownMenu name="about" label="About" open={openDropdown} setOpen={setOpenDropdown}>
              <div className="w-48">
                {aboutLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block rounded px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </DropdownMenu>
            <a
              href="/contact"
              className="border-b-2 border-transparent pb-1 text-sm font-medium text-gray-700 transition-colors hover:border-green-600 hover:text-green-600"
            >
              Contact
            </a>
            <a
              href="/certifications"
              className="border-b-2 border-transparent pb-1 text-sm font-medium text-gray-700 transition-colors hover:border-green-600 hover:text-green-600"
            >
              Certifications
            </a>
          </nav>

          <div className="flex shrink-0 items-center space-x-1 sm:space-x-2">
            <div className="hidden items-center space-x-1 text-sm text-gray-600 xl:flex">
              <Globe className="h-4 w-4" />
              <span>India</span>
            </div>
            <button
              type="button"
              aria-label="Wishlist"
              className="hidden items-center rounded-md px-2 py-2 text-gray-600 hover:bg-red-50 hover:text-red-500 sm:flex"
            >
              <Heart className="h-5 w-5" />
              <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">0</span>
            </button>
            <a
              href="/login"
              className="flex items-center rounded-md px-2 py-2 text-gray-600 hover:bg-green-50 hover:text-green-600 sm:px-3"
            >
              <User className="mr-1 h-4 w-4" />
              <span className="hidden text-sm sm:inline">Login</span>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-green-600 text-white">
        <div className="mx-auto max-w-[1280px] px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative shrink-0">
              <button
                type="button"
                aria-expanded={showCategories}
                onClick={() => setShowCategories(!showCategories)}
                className="flex items-center space-x-1 rounded-lg bg-green-700 px-3 py-2 text-xs transition-colors hover:bg-green-800 sm:text-sm"
              >
                <Menu className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">ALL CATEGORIES</span>
                <span className="sm:hidden">Categories</span>
              </button>
              {showCategories && (
                <div className="absolute left-0 top-full z-[60] mt-2 w-64 rounded-md border border-gray-200 bg-white p-2 text-gray-800 shadow-xl">
                  {categories.map((category) => (
                    <a
                      key={category.slug}
                      href={`/ingredients/${category.slug}`}
                      className="block rounded px-3 py-2 text-sm hover:bg-green-50 hover:text-green-700"
                    >
                      {category.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="relative min-w-0 flex-1">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search for organic ingredients..."
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSearchSubmitted("");
                  }}
                  className="w-full rounded-lg border border-green-500 bg-white px-4 py-2 pr-12 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-300"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-700"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
              {searchSubmitted && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-lg">
                  Search for “{searchSubmitted}”
                </div>
              )}
            </div>

            <div className="hidden items-center space-x-4 text-sm lg:flex">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <div>
                  <div className="text-xs text-green-200">Customer Support</div>
                  <div className="font-medium">+91-7249847439</div>
                </div>
              </div>
              <a
                href="https://wa.me/917249847439"
                target="_blank"
                rel="noopener noreferrer"
                className="flex cursor-pointer items-center space-x-2 transition-colors hover:text-green-200"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {showMobileMenu && (
        <div className="border-t border-gray-200 bg-white shadow-lg lg:hidden">
          <nav className="mx-auto max-w-[1280px] space-y-1 px-4 py-2">
            <a href="/" className="flex items-center space-x-3 rounded-lg bg-green-50 px-3 py-3 text-green-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <Leaf className="h-4 w-4 text-green-600" />
              </span>
              <span className="font-medium">Home</span>
            </a>
            <a href="/products" className="flex items-center space-x-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </span>
              <span className="font-medium">All Products</span>
            </a>
            <MobileNavSection
              title="Ingredients"
              icon={<Leaf className="h-4 w-4 text-emerald-600" />}
              open={mobileExpanded === "ingredients"}
              onToggle={() => toggleMobileSection("ingredients")}
            >
              <a href="/ingredients" className="block py-2 text-sm text-gray-600 hover:text-green-600">→ View All Ingredients</a>
              {categories.map((category) => (
                <a key={category.slug} href={`/ingredients/${category.slug}`} className="block py-2 text-sm text-gray-600 hover:text-green-600">• {category.name}</a>
              ))}
            </MobileNavSection>
            <MobileNavSection
              title="Industries"
              icon={<ShoppingCart className="h-4 w-4 text-blue-600" />}
              open={mobileExpanded === "industries"}
              onToggle={() => toggleMobileSection("industries")}
            >
              {industries.map((industry) => (
                <a key={industry.href} href={industry.href} className="block py-2 text-sm text-gray-600 hover:text-green-600">{industry.title}</a>
              ))}
            </MobileNavSection>
            <MobileNavSection
              title="Health Support"
              icon={<Heart className="h-4 w-4 text-purple-600" />}
              open={mobileExpanded === "health"}
              onToggle={() => toggleMobileSection("health")}
            >
              <a href="/products" className="block py-2 text-sm text-gray-600 hover:text-green-600">→ View All Health Support</a>
              {healthSupports.map((support) => (
                <a key={support.slug} href={`/health-support/${support.slug}`} className="block py-2 text-sm text-gray-600 hover:text-green-600">• {support.name}</a>
              ))}
            </MobileNavSection>
            <MobileNavSection
              title="About"
              icon={<Info className="h-4 w-4 text-indigo-600" />}
              open={mobileExpanded === "about"}
              onToggle={() => toggleMobileSection("about")}
            >
              {aboutLinks.map((link) => (
                <a key={link.href} href={link.href} className="block py-2 text-sm text-gray-600 hover:text-green-600">→ {link.name}</a>
              ))}
            </MobileNavSection>
            <a href="/blog" className="flex items-center space-x-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">B</span>
              <span className="font-medium">Blog</span>
            </a>
            <a href="/contact" className="flex items-center space-x-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100"><Phone className="h-4 w-4 text-pink-600" /></span>
              <span className="font-medium">Contact</span>
            </a>
            <a href="/certifications" className="flex items-center space-x-3 rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100"><Award className="h-4 w-4 text-yellow-600" /></span>
              <span className="font-medium">Certifications</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileNavSection({
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-green-600"
      >
        <span className="flex items-center space-x-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">{icon}</span>
          <span className="font-medium">{title}</span>
        </span>
        <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>
      {open && <div className="mt-2 space-y-1 pl-14">{children}</div>}
    </div>
  );
}
