import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  priceUSD: string;
  mainImage?: string;
  origin?: string;
  form?: string;
  moq?: number;
  productId: string;
}

export default function FeaturedProductsCarouselWorking() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  console.log('🎯 FeaturedProductsCarouselWorking component rendering at:', new Date().toISOString());
  console.log('🔍 Current state - products:', products.length, 'loading:', loading, 'currentIndex:', currentIndex);

  useEffect(() => {
    console.log('🔄 useEffect triggered, fetching featured products...');
    
    fetch('/api/products/featured?limit=8')
      .then(response => {
        console.log('📡 Fetch response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('✅ Featured products received:', data.length, 'items');
        console.log('📦 First product:', data[0]?.name);
        setProducts(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('❌ Error fetching featured products:', error);
        setLoading(false);
      });
  }, []);

  const nextSlide = () => {
    if (currentIndex < products.length - 4) {
      const newIndex = currentIndex + 1;
      console.log('➡️ Moving to next slide:', newIndex);
      setCurrentIndex(newIndex);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      console.log('⬅️ Moving to previous slide:', newIndex);
      setCurrentIndex(newIndex);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-lg text-gray-600">Loading our premium selection...</p>
          </div>
          <div className="grid grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg h-96 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products.length) {
    return (
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
          <p className="text-lg text-gray-600">No featured products available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our premium selection of organic ingredients, carefully sourced and quality-tested for your business needs.
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white border-2 border-green-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-green-50 transition-colors z-10"
            >
              ←
            </button>
          )}

          {currentIndex < products.length - 4 && (
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white border-2 border-green-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-green-50 transition-colors z-10"
            >
              →
            </button>
          )}

          {/* Carousel Container */}
          <div className="overflow-hidden rounded-lg">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 25}%)`,
                width: `${(products.length / 4) * 100}%`
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex-none w-1/4 px-3"
                  style={{ width: `${100 / products.length}%` }}
                >
                  <div
                    className="bg-white rounded-lg shadow-md overflow-hidden h-96 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => window.location.href = `/product/${product.slug}`}
                  >
                    {/* Product Image */}
                    <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center relative">
                      {product.mainImage ? (
                        <img
                          src={product.mainImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-4xl font-bold text-green-600">
                          {product.name.charAt(0)}
                        </div>
                      )}
                      
                      {/* Product ID Badge */}
                      <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                        {product.productId}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 flex flex-col h-48">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>

                      {product.origin && (
                        <p className="text-sm text-gray-600 mb-2">
                          Origin: {product.origin}
                        </p>
                      )}

                      {product.description && (
                        <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">
                          {product.description}
                        </p>
                      )}

                      {/* Price and MOQ */}
                      <div className="flex justify-between items-center mt-auto">
                        <div>
                          <span className="text-lg font-bold text-green-600">
                            ${product.priceUSD}
                          </span>
                          <span className="text-sm text-gray-500">/kg</span>
                        </div>
                        {product.moq && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            MOQ: {product.moq}kg
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <button
            className="border-2 border-green-600 text-green-600 bg-transparent hover:bg-green-50 px-6 py-3 rounded-lg font-medium transition-colors"
            onClick={() => window.location.href = '/products'}
          >
            View All Products →
          </button>
        </div>
      </div>
    </section>
  );
}