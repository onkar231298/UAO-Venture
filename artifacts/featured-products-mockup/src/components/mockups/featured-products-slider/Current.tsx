import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Leaf, MessageSquare } from "lucide-react";
import haritakiImage from "./assets/5fc9473871ecbfe5285f01bb3b3137463414db3365a54161302ce1de1647a243.webp";
import manjisthaImage from "./assets/1c4f3a9858cd39ab4a80464499c27cc9edfe8ec3e0f90b4886009cc8d6ccb33c.webp";
import mustardImage from "./assets/7aa5bdb9e708b45c42f58134717fedb4a7a078bb30a03f02b190140b9119b630.webp";
import bayLeafImage from "./assets/79d5e2843b7e7b451d9acc900196a364956f0612a26797fcc67e620df91de449.webp";
import neemImage from "./assets/b691f97d7461826e5f09e238fecebb8671f92049b48a700aea8ae7e0fde4686d.webp";
import cardamomImage from "./assets/ae7f670d6bb0ae9551852b9279dba457a945c6948c875d0123aa2e0db16b09a4.webp";
import tulsiImage from "./assets/56255a41e256501a1d4950ff6b93413c23d20d7a6956365de8cd9fd68626ffdd.webp";
import watermelonImage from "./assets/d32fee17e406a00facc577bf9456de74ea0b97e96b2468043ac55728ff0c01a7.webp";
import "./_group.css";

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

function CurrentProductCard({ product }: { product: (typeof products)[number] }) {
  return (
    <article className="w-[280px] flex-none overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg">
      <a href={`/products/${product.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-t-xl bg-gray-100">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.parentElement?.classList.add("current-image-failed");
            }}
          />
          <div className="absolute inset-0 hidden items-center justify-center text-center text-sm font-medium text-gray-400 [.current-image-failed_&]:flex">
            No Preview Available
          </div>
          {product.type && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-xs text-white">
              <Leaf className="h-3 w-3" />
              {product.type}
            </span>
          )}
          <button
            type="button"
            aria-label={`Add ${product.name} to wishlist`}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md bg-white text-gray-800 shadow-sm"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-600">SKU: {product.sku}</p>
          <p className="line-clamp-1 text-xs italic text-gray-500">{product.botanical}</p>
          <p className="text-sm text-gray-600">Origin: {product.origin}</p>
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-lg font-bold text-green-600">{product.price}</div>
              <div className="text-xs text-gray-500">per kg</div>
            </div>
            {product.moq && <span className="whitespace-nowrap rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">MOQ: {product.moq}</span>}
          </div>
        </div>
      </a>
      <div className="flex gap-2 px-4 pb-4">
        <button type="button" className="flex flex-1 items-center justify-center gap-1 rounded-md bg-green-600 px-3 py-2 text-xs text-white">
          <MessageSquare className="h-4 w-4" />
          Get Quote
        </button>
        <button type="button" className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700">Sample</button>
      </div>
    </article>
  );
}

export function Current() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const track = scrollRef.current;
    if (!track) return;
    const updateArrows = () => {
      setCanScrollLeft(track.scrollLeft > 0);
      setCanScrollRight(track.scrollLeft < track.scrollWidth - track.clientWidth - 1);
    };
    updateArrows();
    track.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      track.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  const scroll = (direction: number) => {
    const track = scrollRef.current;
    if (!track) return;
    const cardWidth = track.children[0]?.getBoundingClientRect().width ?? 280;
    const step = window.innerWidth < 768 ? 1 : 4;
    track.scrollBy({ left: direction * (cardWidth + 24) * step, behavior: "smooth" });
  };

  return (
    <section className="bg-[linear-gradient(135deg,#f0fdf4_0%,#ecfdf5_100%)] py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-12">
          <h2 className="mb-3 text-2xl font-bold text-gray-900 sm:mb-4 sm:text-3xl lg:text-4xl">Featured Products</h2>
          <p className="mx-auto max-w-2xl px-4 text-sm text-gray-600 sm:px-0 sm:text-base lg:text-lg">
            Discover our premium selection of organic ingredients, carefully sourced and quality-tested for your business needs.
          </p>
        </div>
        <div className="relative mx-auto max-w-7xl">
          {canScrollLeft && (
            <button
              type="button"
              aria-label="Previous products"
              onClick={() => scroll(-1)}
              className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-green-600 bg-white text-green-600 shadow-lg hover:bg-green-50 md:flex lg:left-4"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              aria-label="Next products"
              onClick={() => scroll(1)}
              className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-green-600 bg-white text-green-600 shadow-lg hover:bg-green-50 md:flex lg:right-4"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
          <div
            ref={scrollRef}
            className="scrollbar-hide overflow-x-auto scroll-smooth"
            style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory" }}
          >
            <div className="flex w-max gap-4 pb-2 sm:gap-6">
              {products.map((product) => (
                <div key={product.id} className="w-[280px] flex-none sm:w-[300px] lg:w-[280px]" style={{ scrollSnapAlign: "start" }}>
                  <CurrentProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 text-center sm:mt-12">
          <a href="/products" className="inline-flex rounded-lg border-2 border-green-600 px-4 py-2 font-medium text-green-600 transition-colors hover:bg-green-50 sm:px-6 sm:py-3">
            View All Products →
          </a>
        </div>
      </div>
    </section>
  );
}
