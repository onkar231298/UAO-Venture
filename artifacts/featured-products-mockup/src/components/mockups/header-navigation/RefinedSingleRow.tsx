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
import "./RefinedSingleRow.css";

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
    <a href={href} className={`block rounded-lg ${className}`}>
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
}: {
  name: DropdownName;
  label: string;
  open: DropdownName | null;
  setOpen: (name: DropdownName | null) => void;
  children: ReactNode;
}) {
  const isOpen = open === name;
  return (
    <div className="bf-refined-nav-item">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setOpen(isOpen ? null : name)}
        className={`bf-refined-nav-trigger${isOpen ? " is-open" : ""}`}
      >
        <span>{label}</span>
        <ChevronDown className="bf-refined-chevron" aria-hidden="true" />
      </button>
      {isOpen && (
        <div className={`bf-refined-dropdown bf-refined-dropdown-${name}`}>
          {children}
        </div>
      )}
    </div>
  );
}

function CategoryLinks({ onClick }: { onClick?: () => void }) {
  return (
    <>
      <DropdownLink href="/products" className="bf-refined-dropdown-feature">
        All Ingredients
        <ChevronRight size={15} aria-hidden="true" />
      </DropdownLink>
      <div className="bf-refined-dropdown-rule" />
      <div className="bf-refined-link-grid">
        {categories.map((category) => (
          <a
            key={category.slug}
            href={`/ingredients/${category.slug}`}
            onClick={onClick}
            className="bf-refined-dropdown-link"
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
      <DropdownLink href="/products" className="bf-refined-dropdown-feature">
        All Health Support
        <ChevronRight size={15} aria-hidden="true" />
      </DropdownLink>
      <div className="bf-refined-dropdown-rule" />
      <div className="bf-refined-link-grid">
        {healthSupports.map((support) => (
          <a
            key={support.slug}
            href={`/health-support/${support.slug}`}
            onClick={onClick}
            className="bf-refined-dropdown-link"
          >
            {support.name}
          </a>
        ))}
      </div>
    </>
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
    <div className="bf-refined-mobile-section">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="bf-refined-mobile-trigger"
      >
        <span className="bf-refined-mobile-icon">{icon}</span>
        <span>{title}</span>
        <ChevronRight
          className={`bf-refined-mobile-chevron${open ? " is-open" : ""}`}
          size={16}
          aria-hidden="true"
        />
      </button>
      {open && <div className="bf-refined-mobile-links">{children}</div>}
    </div>
  );
}

export function RefinedSingleRow() {
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
    <header className="bf-refined-header">
      <div className="bf-refined-top">
        <div className="bf-refined-top-inner">
          <div className="bf-refined-brand">
            <a href="/" aria-label="Bright Fame Organic home" className="bf-refined-logo-link">
              <img
                src="/__featured-products-mockup/images/bright-fame-logo.png"
                alt="Bright Fame Organic"
                className="bf-refined-logo"
              />
            </a>
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={showMobileMenu}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="bf-refined-mobile-toggle"
            >
              <Menu size={20} />
            </button>
          </div>

          <nav className="bf-refined-nav" aria-label="Main navigation">
            <a href="/" aria-current="page" className="bf-refined-nav-link is-current">
              Home
            </a>
            <a href="/products" className="bf-refined-nav-link">
              Products
            </a>
            <DropdownMenu name="ingredients" label="Ingredients" open={openDropdown} setOpen={setOpenDropdown}>
              <div className="bf-refined-wide-menu"><CategoryLinks /></div>
            </DropdownMenu>
            <DropdownMenu name="industries" label="Industries" open={openDropdown} setOpen={setOpenDropdown}>
              <div className="bf-refined-industry-list">
                {industries.map((industry) => (
                  <DropdownLink key={industry.href} href={industry.href} className="bf-refined-industry-link">
                    <span className="bf-refined-industry-title">{industry.title}</span>
                    <span className="bf-refined-industry-description">{industry.description}</span>
                  </DropdownLink>
                ))}
              </div>
            </DropdownMenu>
            <DropdownMenu name="health" label="Health Support" open={openDropdown} setOpen={setOpenDropdown}>
              <div className="bf-refined-wide-menu"><HealthSupportLinks /></div>
            </DropdownMenu>
            <DropdownMenu name="about" label="About" open={openDropdown} setOpen={setOpenDropdown}>
              <div className="bf-refined-about-menu">
                {aboutLinks.map((link) => (
                  <a key={link.href} href={link.href} className="bf-refined-dropdown-link">
                    {link.name}
                  </a>
                ))}
              </div>
            </DropdownMenu>
            <a href="/contact" className="bf-refined-nav-link">Contact</a>
            <a href="/certifications" className="bf-refined-nav-link">Certifications</a>
          </nav>

          <div className="bf-refined-actions">
            <div className="bf-refined-country">
              <Globe size={15} strokeWidth={1.7} />
              <span>India</span>
            </div>
            <button type="button" aria-label="Wishlist" className="bf-refined-wishlist">
              <Heart size={18} strokeWidth={1.8} />
              <span>0</span>
            </button>
            <a href="/login" className="bf-refined-login">
              <User size={17} strokeWidth={1.8} />
              <span>Login</span>
            </a>
          </div>
        </div>
      </div>

      <div className="bf-refined-search-band">
        <div className="bf-refined-search-inner">
          <div className="bf-refined-category-wrap">
            <button
              type="button"
              aria-expanded={showCategories}
              onClick={() => setShowCategories(!showCategories)}
              className="bf-refined-category-button"
            >
              <Menu size={16} />
              <span className="bf-refined-category-full">ALL CATEGORIES</span>
              <span className="bf-refined-category-short">Categories</span>
              <ChevronDown size={13} />
            </button>
            {showCategories && (
              <div className="bf-refined-category-menu">
                {categories.map((category) => (
                  <a key={category.slug} href={`/ingredients/${category.slug}`} className="bf-refined-dropdown-link">
                    {category.name}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="bf-refined-search-area">
            <form onSubmit={handleSearch} className="bf-refined-search-form">
              <input
                type="search"
                placeholder="Search for organic ingredients..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchSubmitted("");
                }}
                aria-label="Search organic ingredients"
              />
              <button type="submit" aria-label="Search">
                <Search size={17} />
              </button>
            </form>
            {searchSubmitted && (
              <div className="bf-refined-search-result">
                Search for “{searchSubmitted}”
              </div>
            )}
          </div>
          <div className="bf-refined-support">
            <div className="bf-refined-phone">
              <span className="bf-refined-phone-icon"><Phone size={16} /></span>
              <span className="bf-refined-phone-copy">
                <span className="bf-refined-support-label">Customer Support</span>
                <span className="bf-refined-phone-number">+91-7249847439</span>
              </span>
            </div>
            <a
              href="https://wa.me/917249847439"
              target="_blank"
              rel="noopener noreferrer"
              className="bf-refined-whatsapp"
            >
              <MessageCircle size={17} />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {showMobileMenu && (
        <div className="bf-refined-mobile-menu">
          <nav aria-label="Mobile navigation" className="bf-refined-mobile-nav">
            <a href="/" className="bf-refined-mobile-link is-current">
              <span className="bf-refined-mobile-icon"><Leaf size={16} /></span>Home
            </a>
            <a href="/products" className="bf-refined-mobile-link">
              <span className="bf-refined-mobile-icon"><ShoppingCart size={16} /></span>Products
            </a>
            <MobileNavSection title="Ingredients" icon={<Leaf size={16} />} open={mobileExpanded === "ingredients"} onToggle={() => toggleMobileSection("ingredients")}>
              <a href="/products">All Ingredients</a>
              {categories.map((category) => <a key={category.slug} href={`/ingredients/${category.slug}`}>{category.name}</a>)}
            </MobileNavSection>
            <MobileNavSection title="Industries" icon={<ShoppingCart size={16} />} open={mobileExpanded === "industries"} onToggle={() => toggleMobileSection("industries")}>
              {industries.map((industry) => <a key={industry.href} href={industry.href}>{industry.title}</a>)}
            </MobileNavSection>
            <MobileNavSection title="Health Support" icon={<Heart size={16} />} open={mobileExpanded === "health"} onToggle={() => toggleMobileSection("health")}>
              <a href="/products">All Health Support</a>
              {healthSupports.map((support) => <a key={support.slug} href={`/health-support/${support.slug}`}>{support.name}</a>)}
            </MobileNavSection>
            <MobileNavSection title="About" icon={<Info size={16} />} open={mobileExpanded === "about"} onToggle={() => toggleMobileSection("about")}>
              {aboutLinks.map((link) => <a key={link.href} href={link.href}>{link.name}</a>)}
            </MobileNavSection>
            <a href="/blog" className="bf-refined-mobile-link">
              <span className="bf-refined-mobile-icon bf-refined-blog-mark">B</span>Blog
            </a>
            <a href="/contact" className="bf-refined-mobile-link">
              <span className="bf-refined-mobile-icon"><Phone size={16} /></span>Contact
            </a>
            <a href="/certifications" className="bf-refined-mobile-link">
              <span className="bf-refined-mobile-icon"><Award size={16} /></span>Certifications
            </a>
            <a href="/login" className="bf-refined-mobile-link">
              <span className="bf-refined-mobile-icon"><User size={16} /></span>Login
            </a>
            <button type="button" aria-label="Wishlist" className="bf-refined-mobile-link bf-refined-mobile-wishlist">
              <span className="bf-refined-mobile-icon"><Heart size={16} /></span>Wishlist <span className="bf-refined-mobile-count">0</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
