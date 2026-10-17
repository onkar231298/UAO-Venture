import { useState } from "react";
import { ArrowDownRight, ArrowLeft, ArrowRight, Check, Heart, Leaf, MessageSquare, X } from "lucide-react";
import haritakiImage from "./assets/5fc9473871ecbfe5285f01bb3b3137463414db3365a54161302ce1de1647a243.webp";
import manjisthaImage from "./assets/1c4f3a9858cd39ab4a80464499c27cc9edfe8ec3e0f90b4886009cc8d6ccb33c.webp";
import mustardImage from "./assets/7aa5bdb9e708b45c42f58134717fedb4a7a078bb30a03f02b190140b9119b630.webp";
import bayLeafImage from "./assets/79d5e2843b7e7b451d9acc900196a364956f0612a26797fcc67e620df91de449.webp";
import neemImage from "./assets/b691f97d7461826e5f09e238fecebb8671f92049b48a700aea8ae7e0fde4686d.webp";
import cardamomImage from "./assets/ae7f670d6bb0ae9551852b9279dba457a945c6948c875d0123aa2e0db16b09a4.webp";
import tulsiImage from "./assets/56255a41e256501a1d4950ff6b93413c23d20d7a6956365de8cd9fd68626ffdd.webp";
import watermelonImage from "./assets/d32fee17e406a00facc577bf9456de74ea0b97e96b2468043ac55728ff0c01a7.webp";

const products = [
  {
    id: 2918,
    name: "Haritaki Powder",
    slug: "-haritaki-powder",
    sku: "BFI7746",
    type: "Natural",
    image: haritakiImage,
    botanical: "Terminalia chebula",
    origin: "India",
    price: "$2.21",
    moq: "250 kg",
  },
  {
    id: 3107,
    name: "Manjistha (Rubia cordifolia) roots",
    slug: "manjistha-rubia-cordifolia-roots",
    sku: "BFI14098",
    type: "Natural",
    image: manjisthaImage,
    botanical: "Rubia cordifolia",
    origin: "India",
    price: "$5.03",
    moq: "250 kg",
  },
  {
    id: 3273,
    name: "Mustard Seeds (Black / Brown)",
    slug: "mustard-seeds-black-brown",
    sku: "BFI14266",
    type: "",
    image: mustardImage,
    botanical: "Brassica nigra / Brassica juncea",
    origin: "India",
    price: "Contact for Price",
    moq: "",
  },
  {
    id: 3284,
    name: "Organic Bay Leaf (Tej Patta)",
    slug: "organic-bay-leaf-tej-patta",
    sku: "BFI14277",
    type: "",
    image: bayLeafImage,
    botanical: "Cinnamomum tamala",
    origin: "India",
    price: "Contact for Price",
    moq: "",
  },
  {
    id: 3251,
    name: "Neem Leaves",
    slug: "neem-leaves-whole",
    sku: "BFI14244",
    type: "",
    image: neemImage,
    botanical: "Azadirachta indica",
    origin: "India",
    price: "Contact for Price",
    moq: "",
  },
  {
    id: 3226,
    name: "Green Cardamom Whole",
    slug: "green-cardamom-whole",
    sku: "BFI14218",
    type: "Organic",
    image: cardamomImage,
    botanical: "Elettaria cardamomum",
    origin: "India",
    price: "Contact for Price",
    moq: "",
  },
  {
    id: 3117,
    name: "Organic Tulsi (Holy Basil) Leaves",
    slug: "organic-tulsi-leaves",
    sku: "BFI14108",
    type: "Organic",
    image: tulsiImage,
    botanical: "Ocimum sanctum / Ocimum tenuiflorum",
    origin: "India",
    price: "$2.93",
    moq: "250 kg",
  },
  {
    id: 3238,
    name: "Watermelon Powder",
    slug: "watermelon-powder",
    sku: "BFI14231",
    type: "Organic",
    image: watermelonImage,
    botanical: "Citrullus lanatus",
    origin: "India",
    price: "Contact for Price",
    moq: "",
  },
];

type RequestKind = "quote" | "sample";

export function SplitShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [wishlisted, setWishlisted] = useState<number[]>([]);
  const [requestKind, setRequestKind] = useState<RequestKind | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const product = products[activeIndex];
  const isWishlisted = wishlisted.includes(product.id);

  const move = (direction: number) => {
    setActiveIndex((current) => (current + direction + products.length) % products.length);
  };

  const toggleWishlist = (id: number) => {
    setWishlisted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const openRequest = (kind: RequestKind) => {
    setRequestSent(false);
    setRequestKind(kind);
  };

  return (
    <main className="split-showcase">
      <style>{`
        .split-showcase {
          --forest: #123d2c;
          --deep-forest: #0b2d21;
          --moss: #81945c;
          --lime: #d7e19a;
          --paper: #f4f2e8;
          --ink: #24382d;
          min-height: 100vh;
          padding: clamp(18px, 4vw, 56px);
          color: var(--ink);
          background:
            radial-gradient(ellipse at 12% 0%, rgba(211, 223, 170, .34), transparent 34%),
            #e9eee2;
          font-family: "DM Sans", "Avenir Next", Avenir, sans-serif;
        }
        .split-showcase * { box-sizing: border-box; }
        .ss-shell { max-width: 1360px; margin: 0 auto; overflow: hidden; border-radius: 7px; background: var(--paper); box-shadow: 0 24px 70px rgba(25, 51, 35, .14); }
        .ss-ribbon { height: 34px; display: flex; align-items: center; justify-content: center; padding: 0 18px; color: #e6eccf; background: var(--deep-forest); font-size: 9px; letter-spacing: .14em; text-transform: uppercase; }
        .ss-nav { height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 0 clamp(22px, 5vw, 72px); color: #f4f2e8; background: var(--forest); }
        .ss-brand { color: #f5f2e6; text-decoration: none; font-size: 20px; font-weight: 700; letter-spacing: -.06em; }
        .ss-brand span { color: var(--lime); }
        .ss-nav-note { color: rgba(245, 242, 230, .65); font-size: 10px; letter-spacing: .16em; text-transform: uppercase; }
        .ss-hero { position: relative; display: grid; grid-template-columns: 1.03fr .97fr; min-height: 510px; overflow: hidden; color: #f6f3e8; background: var(--forest); }
        .ss-hero:before { position: absolute; inset: 0; pointer-events: none; content: ""; opacity: .28; background-image: radial-gradient(rgba(236,241,207,.3) .55px, transparent .55px); background-size: 5px 5px; mix-blend-mode: soft-light; }
        .ss-product-stage { position: relative; display: grid; place-items: center; min-height: 480px; padding: 34px clamp(24px, 5vw, 70px); }
        .ss-product-stage:before { position: absolute; width: 73%; aspect-ratio: 1; border: 1px solid rgba(231,237,205,.2); border-radius: 50%; content: ""; }
        .ss-product-stage:after { position: absolute; width: 58%; aspect-ratio: 1; border: 1px solid rgba(231,237,205,.14); border-radius: 50%; content: ""; }
        .ss-image-wrap { z-index: 1; display: grid; place-items: center; width: min(78%, 410px); aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, #f4f0df 0%, #e9e5d4 67%, rgba(233,229,212,.1) 68%); }
        .ss-product-image { width: 78%; height: 78%; object-fit: contain; filter: drop-shadow(0 24px 24px rgba(12, 31, 20, .23)); transition: opacity .2s, transform .35s; }
        .ss-product-image:hover { transform: translateY(-5px) rotate(-1deg); }
        .ss-image-count { position: absolute; bottom: 33px; left: clamp(24px, 5vw, 70px); color: rgba(244,242,232,.7); font-size: 10px; letter-spacing: .18em; }
        .ss-product-copy { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: center; padding: 68px clamp(28px, 6vw, 82px) 66px 28px; }
        .ss-eyebrow { display: flex; align-items: center; gap: 10px; margin: 0 0 23px; color: var(--lime); font-size: 10px; letter-spacing: .2em; text-transform: uppercase; }
        .ss-eyebrow:before { width: 28px; height: 1px; background: var(--lime); content: ""; }
        .ss-copy-title { max-width: 530px; margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: clamp(38px, 5.1vw, 70px); font-weight: 400; line-height: .99; letter-spacing: -.045em; text-wrap: balance; }
        .ss-copy-description { margin: 18px 0 26px; color: rgba(246,243,232,.67); font-size: 12px; line-height: 1.8; }
        .ss-product-details { display: flex; flex-wrap: wrap; gap: 0 24px; margin: 0 0 28px; }
        .ss-detail { min-width: 110px; padding: 12px 0 0; border-top: 1px solid rgba(239,241,213,.22); }
        .ss-detail-label { display: block; margin-bottom: 6px; color: rgba(244,242,232,.47); font-size: 9px; letter-spacing: .15em; text-transform: uppercase; }
        .ss-detail-value { color: #f4f2e8; font-size: 12px; }
        .ss-detail-value.italic { font-family: Georgia, serif; font-style: italic; }
        .ss-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; }
        .ss-button { min-height: 42px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 0 17px; border: 1px solid transparent; border-radius: 2px; cursor: pointer; font: inherit; font-size: 11px; font-weight: 600; text-decoration: none; transition: background .2s, color .2s, border-color .2s, transform .2s; }
        .ss-button:hover { transform: translateY(-2px); }
        .ss-button-primary { color: var(--deep-forest); background: var(--lime); }
        .ss-button-primary:hover { background: #e7edb4; }
        .ss-button-outline { color: #f4f2e8; border-color: rgba(244,242,232,.42); background: transparent; }
        .ss-button-outline:hover { border-color: #f4f2e8; background: rgba(244,242,232,.08); }
        .ss-wishlist { width: 42px; padding: 0; color: #f4f2e8; border-color: rgba(244,242,232,.35); background: transparent; }
        .ss-wishlist.is-active { color: #f5d0bb; border-color: #f5d0bb; }
        .ss-next-controls { position: absolute; right: clamp(24px, 5vw, 70px); bottom: 32px; display: flex; gap: 8px; }
        .ss-circle-control { width: 37px; height: 37px; display: grid; place-items: center; color: #f4f2e8; border: 1px solid rgba(244,242,232,.35); border-radius: 50%; background: transparent; cursor: pointer; transition: background .2s; }
        .ss-circle-control:hover { background: rgba(244,242,232,.13); }
        .ss-catalogue { padding: 28px clamp(22px, 5vw, 72px) 26px; background: #f7f5ed; }
        .ss-catalogue-top { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 17px; }
        .ss-catalogue-label { margin: 0 0 4px; color: #7f8b68; font-size: 9px; letter-spacing: .18em; text-transform: uppercase; }
        .ss-catalogue-title { margin: 0; color: var(--ink); font-family: Georgia, serif; font-size: 23px; font-weight: 400; }
        .ss-catalogue-count { color: #81887b; font-size: 10px; }
        .ss-product-list { display: grid; grid-template-columns: repeat(8, minmax(0,1fr)); gap: 10px; }
        .ss-product-tab { min-width: 0; padding: 8px 8px 10px; text-align: left; color: #596456; border: 1px solid #e5e5d9; background: #f2f0e6; cursor: pointer; transition: border-color .2s, background .2s, transform .2s; }
        .ss-product-tab:hover { transform: translateY(-2px); border-color: #a8b18b; }
        .ss-product-tab.is-selected { border-color: #637c4e; background: #e5e9d8; box-shadow: inset 0 -2px #637c4e; }
        .ss-tab-number { display: block; margin-bottom: 7px; color: #929985; font-size: 9px; letter-spacing: .1em; }
        .ss-tab-name { display: -webkit-box; overflow: hidden; min-height: 31px; color: #344234; font-family: Georgia, serif; font-size: 11px; line-height: 1.35; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
        .ss-footer-note { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 18px clamp(22px, 5vw, 72px); color: rgba(244,242,232,.68); background: var(--deep-forest); font-size: 9px; letter-spacing: .12em; text-transform: uppercase; }
        .ss-footer-note a { display: inline-flex; align-items: center; gap: 7px; color: var(--lime); text-decoration: none; }
        .ss-modal-backdrop { position: fixed; z-index: 20; inset: 0; display: grid; place-items: center; padding: 18px; background: rgba(8,27,19,.68); }
        .ss-modal { position: relative; width: min(100%, 430px); padding: 34px; color: var(--ink); background: #f7f5ed; box-shadow: 0 20px 80px rgba(0,0,0,.25); }
        .ss-modal-close { position: absolute; top: 13px; right: 13px; display: grid; width: 32px; height: 32px; place-items: center; border: 0; background: transparent; cursor: pointer; }
        .ss-modal h3 { margin: 0 0 8px; font: 400 30px/1.05 Georgia, serif; }
        .ss-modal p { margin: 0 0 20px; color: #687466; font-size: 12px; line-height: 1.55; }
        .ss-modal label { display: block; margin: 14px 0 6px; color: #687466; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; }
        .ss-modal input, .ss-modal textarea { width: 100%; padding: 11px 12px; color: var(--ink); border: 1px solid #d8ddcf; border-radius: 0; background: #fffef8; font: inherit; font-size: 13px; outline-color: #81945c; }
        .ss-modal textarea { min-height: 80px; resize: vertical; }
        .ss-modal-submit { width: 100%; margin-top: 19px; color: #f7f5ed; background: var(--forest); }
        .ss-success { display: flex; align-items: flex-start; gap: 11px; padding: 15px; color: #31543b; background: #e4ead8; font-size: 13px; line-height: 1.5; }
        @media (max-width: 760px) {
          .split-showcase { padding: 0; }
          .ss-shell { border-radius: 0; }
          .ss-nav { height: 64px; }
          .ss-nav-note { display: none; }
          .ss-hero { grid-template-columns: 1fr; }
          .ss-product-stage { min-height: 320px; padding: 25px 22px 45px; }
          .ss-image-wrap { width: min(70%, 300px); }
          .ss-image-count { bottom: 15px; left: 24px; }
          .ss-product-copy { padding: 38px 26px 72px; }
          .ss-copy-title { font-size: clamp(42px, 11vw, 64px); }
          .ss-next-controls { right: 24px; bottom: 22px; }
          .ss-product-list { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .ss-product-tab { display: flex; align-items: center; gap: 12px; padding: 10px; }
          .ss-tab-number { flex: 0 0 20px; margin: 0; }
          .ss-tab-name { min-height: auto; }
          .ss-footer-note { align-items: flex-start; flex-direction: column; }
        }
      `}</style>

      <div className="ss-shell">
        <div className="ss-ribbon">Bright Fame Organic &nbsp;·&nbsp; Botanical ingredients for business</div>
        <nav className="ss-nav" aria-label="Featured products">
          <a className="ss-brand" href="/products">bright fame<span> organic</span></a>
          <div className="ss-nav-note">Rooted in origin. Ready for your next batch.</div>
        </nav>

        <section className="ss-hero" aria-label={`Featured product: ${product.name}`}>
          <div className="ss-product-stage">
            <div className="ss-image-wrap">
              <img className="ss-product-image" key={product.image} src={product.image} alt={product.name} />
            </div>
            <span className="ss-image-count">{String(activeIndex + 1).padStart(2, "0")} &nbsp;/&nbsp; {String(products.length).padStart(2, "0")}</span>
          </div>
          <div className="ss-product-copy">
            <p className="ss-eyebrow">{product.type || "Botanical ingredient"} <span>·</span> Featured selection</p>
            <h1 className="ss-copy-title">{product.name}</h1>
            <p className="ss-copy-description">A closer look at an ingredient in our current product selection. Explore its botanical identity and sourcing origin, then connect with our team about your requirements.</p>
            <div className="ss-product-details">
              <div className="ss-detail"><span className="ss-detail-label">Botanical name</span><span className="ss-detail-value italic">{product.botanical}</span></div>
              <div className="ss-detail"><span className="ss-detail-label">Origin</span><span className="ss-detail-value">{product.origin}</span></div>
              <div className="ss-detail"><span className="ss-detail-label">SKU</span><span className="ss-detail-value">{product.sku}</span></div>
              <div className="ss-detail"><span className="ss-detail-label">Price</span><span className="ss-detail-value">{product.price}{product.moq ? " / kg" : ""}</span></div>
              {product.moq && <div className="ss-detail"><span className="ss-detail-label">MOQ</span><span className="ss-detail-value">{product.moq}</span></div>}
            </div>
            <div className="ss-actions">
              <a href={`/products/${product.slug}`} className="ss-button ss-button-primary">View product <ArrowDownRight size={15} /></a>
              <button type="button" className="ss-button ss-button-outline" onClick={() => openRequest("quote")}><MessageSquare size={15} /> Get Quote</button>
              <button type="button" className="ss-button ss-button-outline" onClick={() => openRequest("sample")}>Sample</button>
              <button type="button" aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} aria-pressed={isWishlisted} className={`ss-button ss-wishlist${isWishlisted ? " is-active" : ""}`} onClick={() => toggleWishlist(product.id)}><Heart size={16} fill={isWishlisted ? "currentColor" : "none"} /></button>
            </div>
            <div className="ss-next-controls">
              <button type="button" className="ss-circle-control" aria-label="Previous product" onClick={() => move(-1)}><ArrowLeft size={16} /></button>
              <button type="button" className="ss-circle-control" aria-label="Next product" onClick={() => move(1)}><ArrowRight size={16} /></button>
            </div>
          </div>
        </section>

        <section className="ss-catalogue" aria-label="Browse all featured products">
          <div className="ss-catalogue-top">
            <div><p className="ss-catalogue-label"><Leaf size={11} style={{ verticalAlign: "middle", marginRight: 5 }} />Current selection</p><h2 className="ss-catalogue-title">Explore the collection</h2></div>
            <span className="ss-catalogue-count">{products.length} ingredients</span>
          </div>
          <div className="ss-product-list">
            {products.map((item, index) => (
              <button type="button" key={item.id} aria-pressed={activeIndex === index} className={`ss-product-tab${activeIndex === index ? " is-selected" : ""}`} onClick={() => setActiveIndex(index)}>
                <span className="ss-tab-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="ss-tab-name">{item.name}</span>
              </button>
            ))}
          </div>
        </section>
        <div className="ss-footer-note"><span>Bright Fame Organic · Ingredient sourcing</span><a href="/products">View all products <ArrowRight size={12} /></a></div>
      </div>

      {requestKind && (
        <div className="ss-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRequestKind(null); }}>
          <section className="ss-modal" role="dialog" aria-modal="true" aria-labelledby="ss-modal-title">
            <button type="button" aria-label="Close request form" className="ss-modal-close" onClick={() => setRequestKind(null)}><X size={18} /></button>
            <p className="ss-catalogue-label">{requestKind === "quote" ? "Sourcing enquiry" : "Product sample"}</p>
            <h3 id="ss-modal-title">{requestKind === "quote" ? "Request a quote" : "Ask about a sample"}</h3>
            <p>{product.name} <span aria-hidden="true">·</span> SKU {product.sku}</p>
            {requestSent ? (
              <div className="ss-success"><Check size={18} /><span>Your {requestKind === "quote" ? "quote" : "sample"} enquiry for {product.name} is noted in this preview.</span></div>
            ) : (
              <form onSubmit={(event) => { event.preventDefault(); setRequestSent(true); }}>
                <label htmlFor="ss-email">Business email</label>
                <input id="ss-email" type="email" placeholder="name@company.com" required />
                <label htmlFor="ss-message">Message</label>
                <textarea id="ss-message" placeholder="Share your quantity or sourcing requirements" />
                <button className="ss-button ss-modal-submit" type="submit">Send {requestKind === "quote" ? "quote request" : "sample enquiry"} <ArrowRight size={15} /></button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
