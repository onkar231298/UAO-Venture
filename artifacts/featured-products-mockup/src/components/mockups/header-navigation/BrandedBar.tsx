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
  X,
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

function DropLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return <a href={href} className={`block rounded-lg ${className}`}>{children}</a>;
}

function NavDropdown({
  name,
  label,
  open,
  onToggle,
  children,
  className = "",
}: {
  name: DropdownName;
  label: string;
  open: DropdownName | null;
  onToggle: (name: DropdownName) => void;
  children: ReactNode;
  className?: string;
}) {
  const active = open === name;
  return (
    <div className="bf-branded-dropdown">
      <button
        type="button"
        aria-expanded={active}
        onClick={() => onToggle(name)}
        className={`bf-branded-navlink ${active ? "is-open" : ""}`}
      >
        {label}<ChevronDown aria-hidden="true" size={14} className={active ? "bf-chevron-up" : ""} />
      </button>
      {active && <div className={`bf-branded-popover ${className}`}>{children}</div>}
    </div>
  );
}

function MobileSection({
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
    <section className="bf-mobile-section">
      <button type="button" aria-expanded={open} onClick={onToggle} className="bf-mobile-section-trigger">
        <span className="bf-mobile-icon">{icon}</span><span>{title}</span>
        <ChevronRight size={17} className={open ? "bf-mobile-chevron-open" : ""} />
      </button>
      {open && <div className="bf-mobile-section-content">{children}</div>}
    </section>
  );
}

export function BrandedBar() {
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
  const toggleDropdown = (name: DropdownName) => setOpenDropdown(openDropdown === name ? null : name);
  const currentPath = typeof window === "undefined" ? "/" : window.location.pathname;
  const activeHome = currentPath === "/" || currentPath.includes("/preview/");

  const navLink = (label: string, href: string, emphasized = false) => (
    <a href={href} className={`bf-branded-navlink ${emphasized ? "is-current" : ""}`}>{label}</a>
  );

  return (
    <header className="bf-branded-header">
      <style>{`
        .bf-branded-header{--forest:#174b35;--forest-deep:#103d2b;--leaf:#a8c879;--cream:#fbfaf5;--ink:#25352d;--muted:#6b776f;--line:#e4e9df;position:sticky;top:0;z-index:50;background:var(--cream);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(23,55,38,.08)}
        .bf-branded-header *{box-sizing:border-box}.bf-branded-masthead{background:#fbfaf5}
        .bf-branded-inner{max-width:1320px;margin:0 auto;padding:0 28px}
        .bf-branded-top{height:82px;display:flex;align-items:center;justify-content:space-between;gap:20px}
        .bf-branded-logo{display:flex;align-items:center;flex:none}.bf-branded-logo img{display:block;width:auto;height:48px;object-fit:contain}
        .bf-branded-tagline{margin-left:17px;padding-left:17px;border-left:1px solid #dbe2d7;color:#788379;font-size:10px;font-weight:700;letter-spacing:.13em;line-height:1.45;text-transform:uppercase}
        .bf-branded-tools{display:flex;align-items:center;gap:10px}.bf-branded-country{display:flex;align-items:center;gap:7px;padding:8px 10px;color:#66736a;font-size:12px;border-right:1px solid #dfe5dc;margin-right:3px}
        .bf-branded-action{min-height:38px;display:flex;align-items:center;gap:7px;padding:7px 10px;border:0;border-radius:7px;background:transparent;color:#48574d;font-size:13px;font-weight:650;text-decoration:none;cursor:pointer;transition:background .16s ease,color .16s ease}
        .bf-branded-action:hover{background:#edf2e8;color:var(--forest)}.bf-branded-wishlist{gap:5px}.bf-branded-count{display:grid;place-items:center;width:19px;height:19px;border-radius:50%;background:#e8eee0;color:var(--forest);font-size:10px}
        .bf-branded-account{border:1px solid #dce4d8;background:#fffdf8;padding:8px 13px}.bf-branded-account:hover{background:#f0f5eb}
        .bf-branded-menu-toggle{display:none;border:1px solid #dce4d8;border-radius:7px;padding:9px;background:transparent;color:var(--forest)}
        .bf-branded-navband{background:var(--forest);color:#fff}
        .bf-branded-nav{min-height:56px;display:flex;align-items:stretch;justify-content:center;gap:5px}
        .bf-branded-navlink{position:relative;display:flex;align-items:center;justify-content:center;gap:5px;min-height:56px;padding:0 13px;border:0;background:transparent;color:#f3f6ef;font-size:13px;font-weight:640;letter-spacing:.005em;text-decoration:none;white-space:nowrap;cursor:pointer;transition:background .18s ease,color .18s ease}
        .bf-branded-navlink:hover,.bf-branded-navlink.is-open{background:rgba(255,255,255,.09);color:white}
        .bf-branded-navlink.is-current{background:var(--forest-deep);color:#fff;font-weight:750}
        .bf-branded-navlink.is-current:after{position:absolute;right:12px;bottom:0;left:12px;height:3px;background:var(--leaf);content:""}
        .bf-branded-navlink svg{transition:transform .18s ease}.bf-branded-navlink .bf-chevron-up{transform:rotate(180deg)}
        .bf-branded-dropdown{position:relative}.bf-branded-popover{position:absolute;top:calc(100% + 1px);left:0;z-index:80;min-width:205px;padding:12px;border:1px solid #e2e8df;border-radius:0 0 10px 10px;background:#fffefa;color:var(--ink);box-shadow:0 18px 35px rgba(20,52,35,.17);animation:bfDropIn .16s ease-out}
        .bf-branded-popover.bf-popover-wide{width:480px}.bf-branded-popover.bf-popover-industry{width:320px}.bf-branded-popover .bf-drop-link{padding:9px 10px;color:#3c4d41;font-size:13px;text-decoration:none;transition:background .15s ease,color .15s ease}.bf-branded-popover .bf-drop-link:hover{background:#f0f5eb;color:var(--forest)}
        .bf-branded-popover .bf-all-link{margin-bottom:10px;padding:11px 12px;background:var(--forest);color:white;font-weight:700;text-align:center}.bf-branded-popover .bf-all-link:hover{background:#236345;color:white}
        .bf-drop-rule{height:1px;margin:0 0 8px;background:#e7ece4}.bf-drop-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px}
        .bf-industry-link{margin-bottom:7px;border:1px solid #e8ece5;padding:11px 12px;text-decoration:none;color:#324538}.bf-industry-link:last-child{margin-bottom:0}.bf-industry-link:hover{background:#f2f6ed;border-color:#d6e1ce}
        .bf-industry-title{font-weight:700;font-size:13px}.bf-industry-copy{margin-top:3px;color:#718075;font-size:11px;line-height:1.45}
        .bf-branded-service{background:#eef2e8;border-bottom:1px solid #dfe6d9}
        .bf-branded-service-row{min-height:68px;display:flex;align-items:center;gap:16px}
        .bf-branded-categories{position:relative;flex:none}.bf-category-short{display:none}.bf-category-button{height:42px;display:flex;align-items:center;gap:9px;padding:0 15px;border:1px solid #cddbc6;border-radius:7px;background:#e2ebd9;color:#294832;font-size:11px;font-weight:800;letter-spacing:.07em;cursor:pointer;transition:background .16s ease}
        .bf-category-button:hover,.bf-category-button[aria-expanded="true"]{background:#d3e2ca}
        .bf-category-popover{position:absolute;top:calc(100% + 8px);left:0;z-index:90;width:245px;padding:7px;border:1px solid #e1e8de;border-radius:9px;background:#fffefa;box-shadow:0 16px 30px rgba(23,55,38,.16)}
        .bf-category-popover a{display:block;padding:10px 11px;border-radius:6px;color:#415347;font-size:13px;text-decoration:none}.bf-category-popover a:hover{background:#f0f5eb;color:var(--forest)}
        .bf-branded-search-wrap{position:relative;flex:1;max-width:610px}.bf-branded-search{position:relative;display:flex;height:42px;border:1px solid #d7dfd3;border-radius:7px;background:#fffefa;box-shadow:0 1px 2px rgba(30,58,37,.04)}
        .bf-branded-search:focus-within{border-color:#819e6e;box-shadow:0 0 0 3px rgba(96,132,74,.12)}
        .bf-branded-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;padding:0 14px;color:#293b2f;font:inherit;font-size:13px}.bf-branded-search input::placeholder{color:#879188}
        .bf-branded-search button{width:44px;flex:none;border:0;border-left:1px solid #edf0e9;border-radius:0 6px 6px 0;background:transparent;color:var(--forest);cursor:pointer}.bf-branded-search button:hover{background:#f1f5ed}
        .bf-search-result{position:absolute;top:calc(100% + 7px);right:0;left:0;z-index:70;padding:12px 15px;border:1px solid #e1e8de;border-radius:8px;background:#fffefa;color:#4b5d50;font-size:13px;box-shadow:0 12px 24px rgba(23,55,38,.12)}
        .bf-branded-contact{display:flex;align-items:center;gap:17px;margin-left:auto;color:#3d5143}.bf-support-info{display:flex;align-items:center;gap:9px}.bf-support-info>svg{color:#50724d}.bf-support-label{color:#7b887c;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.bf-support-number{margin-top:2px;color:#273b2d;font-size:13px;font-weight:750;white-space:nowrap}
        .bf-whatsapp{display:flex;align-items:center;gap:7px;padding:10px 12px;border:1px solid #d4dfcf;border-radius:7px;color:#345640;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap;transition:background .16s ease}.bf-whatsapp:hover{background:#e3ecdc}
        .bf-mobile-panel{display:none}.bf-mobile-toplinks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;margin-bottom:6px}
        .bf-mobile-link{display:flex;align-items:center;min-height:43px;padding:9px 12px;border-radius:7px;color:#405147;font-size:14px;font-weight:650;text-decoration:none}.bf-mobile-link:hover,.bf-mobile-link.current{background:#edf3e8;color:#214b33}
        .bf-mobile-section{border-top:1px solid #edf0ea}.bf-mobile-section-trigger{width:100%;display:flex;align-items:center;gap:10px;padding:12px 8px;border:0;background:transparent;color:#33453a;font:inherit;font-size:14px;font-weight:650;text-align:left;cursor:pointer}
        .bf-mobile-section-trigger>svg:last-child{margin-left:auto;color:#7b887d;transition:transform .18s ease}.bf-mobile-chevron-open{transform:rotate(90deg)}
        .bf-mobile-icon{display:grid;place-items:center;width:27px;height:27px;border-radius:7px;background:#edf3e8;color:#3d7046}.bf-mobile-section-content{padding:0 8px 12px 45px}.bf-mobile-section-content a{display:block;padding:8px 0;color:#56665b;font-size:13px;text-decoration:none}.bf-mobile-section-content a:hover{color:#204b33}
        @keyframes bfDropIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:1100px){.bf-branded-inner{padding-right:20px;padding-left:20px}.bf-branded-nav{gap:0}.bf-branded-navlink{padding-right:9px;padding-left:9px;font-size:12px}.bf-branded-contact{gap:9px}.bf-branded-country{display:none}}
        @media(max-width:920px){.bf-branded-top{height:72px}.bf-branded-logo img{height:44px}.bf-branded-tagline{display:none}.bf-branded-menu-toggle{display:grid;place-items:center;margin-left:10px}.bf-branded-brand-side{display:flex;align-items:center}.bf-branded-navband{display:none}.bf-branded-service-row{gap:10px}.bf-branded-contact{display:none}.bf-branded-search-wrap{max-width:none}.bf-mobile-panel{display:block;padding:8px 20px 14px;border-top:1px solid #e5eadf;background:#fffefa;box-shadow:0 12px 20px rgba(23,55,38,.08)}}
        @media(max-width:640px){.bf-branded-inner{padding-right:15px;padding-left:15px}.bf-branded-top{height:68px}.bf-branded-logo img{height:40px}.bf-branded-tools{gap:2px}.bf-branded-account{padding:8px}.bf-branded-account span{display:none}.bf-branded-wishlist{padding:8px}.bf-branded-count{display:none}.bf-branded-service-row{min-height:unset;display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;padding-top:10px;padding-bottom:10px}.bf-category-button{height:40px;padding:0 10px;font-size:10px;letter-spacing:.03em}.bf-category-button .bf-category-long{display:none}.bf-category-short{display:inline}.bf-branded-search{height:40px}.bf-branded-search input{padding-left:10px;font-size:12px}.bf-branded-search button{width:37px}.bf-mobile-panel{display:block;padding:8px 15px 14px;border-top:1px solid #e5eadf;background:#fffefa;box-shadow:0 12px 20px rgba(23,55,38,.08)}}
        @media(min-width:641px) and (max-width:920px){.bf-branded-service-row{min-height:64px}.bf-category-button{padding:0 12px}.bf-branded-search-wrap{max-width:470px}}
        @media(prefers-reduced-motion:reduce){.bf-branded-header *{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
      `}</style>

      <div className="bf-branded-masthead">
        <div className="bf-branded-inner bf-branded-top">
          <div className="bf-branded-brand-side">
            <a href="/" className="bf-branded-logo" aria-label="Bright Fame Organic home">
              <img src="/__featured-products-mockup/images/bright-fame-logo.png" alt="Bright Fame Organic" />
            </a>
            <div className="bf-branded-tagline">Certified organic<br />ingredient supply</div>
            <button
              type="button"
              aria-label={showMobileMenu ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={showMobileMenu}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="bf-branded-menu-toggle"
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          <div className="bf-branded-tools">
            <div className="bf-branded-country"><Globe size={15} /><span>India</span></div>
            <button type="button" aria-label="Wishlist" className="bf-branded-action bf-branded-wishlist">
              <Heart size={18} /><span>Wishlist</span><span className="bf-branded-count">0</span>
            </button>
            <a href="/login" className="bf-branded-action bf-branded-account"><User size={17} /><span>Login</span></a>
          </div>
        </div>
      </div>

      <div className="bf-branded-navband">
        <nav className="bf-branded-inner bf-branded-nav" aria-label="Main navigation">
          {navLink("Home", "/", activeHome)}
          {navLink("Products", "/products")}
          <NavDropdown name="ingredients" label="Ingredients" open={openDropdown} onToggle={toggleDropdown} className="bf-popover-wide">
              <DropLink href="/products" className="bf-drop-link bf-all-link">All Ingredients</DropLink>
              <div className="bf-drop-rule" />
              <div className="bf-drop-grid">{categories.map((category) => <DropLink key={category.slug} href={`/ingredients/${category.slug}`} className="bf-drop-link">{category.name}</DropLink>)}</div>
          </NavDropdown>
          <NavDropdown name="industries" label="Industries" open={openDropdown} onToggle={toggleDropdown} className="bf-popover-industry">
              {industries.map((industry) => (
                <DropLink key={industry.href} href={industry.href} className="bf-industry-link">
                  <div className="bf-industry-title">{industry.title}</div><div className="bf-industry-copy">{industry.description}</div>
                </DropLink>
              ))}
          </NavDropdown>
          <NavDropdown name="health" label="Health Support" open={openDropdown} onToggle={toggleDropdown} className="bf-popover-wide">
              <DropLink href="/products" className="bf-drop-link bf-all-link">All Health Support</DropLink>
              <div className="bf-drop-rule" />
              <div className="bf-drop-grid">{healthSupports.map((support) => <DropLink key={support.slug} href={`/health-support/${support.slug}`} className="bf-drop-link">{support.name}</DropLink>)}</div>
          </NavDropdown>
          <NavDropdown name="about" label="About" open={openDropdown} onToggle={toggleDropdown}>
            {aboutLinks.map((link) => <DropLink key={link.href} href={link.href} className="bf-drop-link">{link.name}</DropLink>)}
          </NavDropdown>
          {navLink("Contact", "/contact")}
          {navLink("Certifications", "/certifications")}
        </nav>
      </div>

      <div className="bf-branded-service">
        <div className="bf-branded-inner bf-branded-service-row">
          <div className="bf-branded-categories">
            <button type="button" aria-expanded={showCategories} onClick={() => setShowCategories(!showCategories)} className="bf-category-button">
              <ShoppingCart size={15} /><span className="bf-category-long">ALL CATEGORIES</span><span className="bf-category-short">Categories</span>
              <ChevronDown size={13} />
            </button>
            {showCategories && (
              <div className="bf-category-popover">
                {categories.map((category) => <a key={category.slug} href={`/ingredients/${category.slug}`}>{category.name}</a>)}
              </div>
            )}
          </div>
          <div className="bf-branded-search-wrap">
            <form onSubmit={handleSearch} className="bf-branded-search">
              <input
                value={searchQuery}
                onChange={(event) => { setSearchQuery(event.target.value); setSearchSubmitted(""); }}
                placeholder="Search organic ingredients..."
                aria-label="Search organic ingredients"
              />
              <button type="submit" aria-label="Search"><Search size={17} /></button>
            </form>
            {searchSubmitted && <div className="bf-search-result" role="status">Search for “{searchSubmitted}”</div>}
          </div>
          <div className="bf-branded-contact">
            <div className="bf-support-info">
              <Phone size={17} />
              <div><div className="bf-support-label">Customer support</div><div className="bf-support-number">+91-7249847439</div></div>
            </div>
            <a href="https://wa.me/917249847439" target="_blank" rel="noopener noreferrer" className="bf-whatsapp"><MessageCircle size={16} /><span>WhatsApp</span></a>
          </div>
        </div>
      </div>

      {showMobileMenu && (
        <div className="bf-mobile-panel">
          <nav aria-label="Mobile navigation">
            <div className="bf-mobile-toplinks">
              <a href="/" className={`bf-mobile-link ${activeHome ? "current" : ""}`}><Leaf size={16} style={{ marginRight: 9 }} />Home</a>
              <a href="/products" className="bf-mobile-link"><ShoppingCart size={16} style={{ marginRight: 9 }} />Products</a>
              <a href="/contact" className="bf-mobile-link"><Phone size={16} style={{ marginRight: 9 }} />Contact</a>
              <a href="/certifications" className="bf-mobile-link"><Award size={16} style={{ marginRight: 9 }} />Certifications</a>
              <a href="/blog" className="bf-mobile-link"><span style={{ display: "inline-grid", placeItems: "center", width: 16, height: 16, marginRight: 9, borderRadius: 4, background: "#f4ead8", color: "#8a6336", fontSize: 10, fontWeight: 800 }}>B</span>Blog</a>
            </div>
            <MobileSection title="Ingredients" icon={<Leaf size={15} />} open={mobileExpanded === "ingredients"} onToggle={() => toggleMobileSection("ingredients")}>
              <a href="/products">All Ingredients</a>
              {categories.map((category) => <a key={category.slug} href={`/ingredients/${category.slug}`}>{category.name}</a>)}
            </MobileSection>
            <MobileSection title="Industries" icon={<ShoppingCart size={15} />} open={mobileExpanded === "industries"} onToggle={() => toggleMobileSection("industries")}>
              {industries.map((industry) => <a key={industry.href} href={industry.href}>{industry.title}</a>)}
            </MobileSection>
            <MobileSection title="Health Support" icon={<Heart size={15} />} open={mobileExpanded === "health"} onToggle={() => toggleMobileSection("health")}>
              <a href="/products">All Health Support</a>
              {healthSupports.map((support) => <a key={support.slug} href={`/health-support/${support.slug}`}>{support.name}</a>)}
            </MobileSection>
            <MobileSection title="About" icon={<Info size={15} />} open={mobileExpanded === "about"} onToggle={() => toggleMobileSection("about")}>
              {aboutLinks.map((link) => <a key={link.href} href={link.href}>{link.name}</a>)}
            </MobileSection>
          </nav>
        </div>
      )}
    </header>
  );
}
