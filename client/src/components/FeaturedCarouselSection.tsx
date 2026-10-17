import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, TouchEvent } from "react";
import { ArrowLeft, ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeaturedProductSlide, { type FeaturedProduct } from "@/components/FeaturedProductSlide";
import "./FeaturedCarouselSection.css";

const FEATURED_PRODUCTS_URL = "/api/products/featured?limit=8";

function SectionHeading() {
  return (
    <header className="featured-products-heading">
      <p className="featured-products-eyebrow">
        <Leaf aria-hidden="true" />
        Atlas Ingredients
      </p>
      <h2>Featured Products</h2>
      <p className="featured-products-intro">
        Explore ingredients from our current selection, with product details and buyer actions in one place.
      </p>
    </header>
  );
}

function FeaturedProductsLoading() {
  return (
    <div className="featured-products-panel featured-products-loading" aria-label="Loading featured products">
      <div className="featured-loading-image">
        <div className="featured-loading-orb" />
      </div>
      <div className="featured-loading-copy" aria-hidden="true">
        <span className="featured-loading-line featured-loading-short" />
        <span className="featured-loading-line featured-loading-title" />
        <span className="featured-loading-line" />
        <span className="featured-loading-line" />
        <span className="featured-loading-line featured-loading-action" />
      </div>
    </div>
  );
}

export default function FeaturedCarouselSection() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(FEATURED_PRODUCTS_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Featured products request failed (${response.status})`);
        }
        return response.json();
      })
      .then((data: unknown) => {
        if (!Array.isArray(data)) {
          throw new Error("Featured products response was not a list");
        }
        const nextProducts = data as FeaturedProduct[];
        setProducts(nextProducts);
        setActiveIndex((current) => (nextProducts.length ? Math.min(current, nextProducts.length - 1) : 0));
      })
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Error fetching featured products:", fetchError);
        setProducts([]);
        setError("We couldn’t load the featured products. Please try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [retryCount]);

  const moveSlide = (direction: number) => {
    if (products.length < 2) return;
    setActiveIndex((current) => (current + direction + products.length) % products.length);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable='true']")) {
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveSlide(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveSlide(1);
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (startX === null || endX === undefined) return;
    const distance = endX - startX;
    if (Math.abs(distance) < 48) return;
    moveSlide(distance > 0 ? -1 : 1);
  };

  return (
    <section
      ref={sectionRef}
      className="featured-products-section"
      aria-label="Featured products"
      tabIndex={0}
      aria-keyshortcuts="ArrowLeft ArrowRight"
      onKeyDown={handleKeyDown}
    >
      <div className="featured-products-container">
        <SectionHeading />

        {loading ? (
          <FeaturedProductsLoading />
        ) : error ? (
          <div className="featured-products-status" role="alert">
            <h3>Featured products are temporarily unavailable</h3>
            <p>{error}</p>
            <Button
              type="button"
              className="featured-retry-button"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Try again
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="featured-products-status">
            <h3>No featured products are available right now</h3>
            <p>Browse the full catalog to see the current product range.</p>
            <a className="featured-status-link" href="/products">View all products</a>
          </div>
        ) : (
          <>
            <div
              className="featured-products-panel"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <FeaturedProductSlide
                product={products[activeIndex]}
                index={activeIndex}
                total={products.length}
              />
              {products.length > 1 && (
                <div className="featured-slide-controls" aria-label="Featured product navigation">
                  <span className="featured-slide-count" aria-live="polite">
                    {String(activeIndex + 1).padStart(2, "0")}
                    <span aria-hidden="true"> / </span>
                    {String(products.length).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    className="featured-slide-arrow"
                    aria-label="Previous product"
                    onClick={() => moveSlide(-1)}
                  >
                    <ArrowLeft aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="featured-slide-arrow"
                    aria-label="Next product"
                    onClick={() => moveSlide(1)}
                  >
                    <ArrowRight aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            {products.length > 1 && (
              <nav className="featured-product-picker" aria-label="Choose a featured product">
                {products.map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`featured-product-picker-item${index === activeIndex ? " is-active" : ""}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                    aria-label={`Show product ${index + 1}: ${product.name}`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <span className="featured-product-picker-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="featured-product-picker-name">{product.name}</span>
                  </button>
                ))}
              </nav>
            )}
          </>
        )}

        <div className="featured-products-footer">
          <a href="/products" className="featured-view-all">
            View All Products <ArrowRight aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
