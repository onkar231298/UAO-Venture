import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  priceUSD: string;
  mainImage?: string;
  origin?: string;
  form?: string;
  moq?: number;
  productId: string;
}

const FeaturedProductsCarouselNew = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);

  console.log('🎯 FeaturedProductsCarouselNew component mounting...');
  console.log('🎯 Window location:', window.location.href);
  console.log('🎯 Current time:', new Date().toISOString());

  const { data: featuredProducts, isLoading, error } = useQuery({
    queryKey: ['/api/products/featured'],
    queryFn: async (): Promise<Product[]> => {
      console.log('🔄 Fetching featured products from API...');
      try {
        const response = await fetch('/api/products/featured?limit=8');
        console.log('🔄 Response status:', response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`Failed to fetch featured products: ${response.status}`);
        }
        const data = await response.json();
        console.log('✅ Featured products loaded successfully:', data.length, 'items');
        console.log('✅ First product:', data[0]?.name);
        return data;
      } catch (err) {
        console.error('❌ Error fetching featured products:', err);
        throw err;
      }
    },
  });

  console.log('🔍 Query state:', { isLoading, error: error?.message, dataLength: featuredProducts?.length });

  // Update items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width >= 1024) setItemsPerView(4);
      else if (width >= 768) setItemsPerView(3);
      else if (width >= 640) setItemsPerView(2);
      else setItemsPerView(1);
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  const nextSlide = () => {
    if (featuredProducts && currentIndex < featuredProducts.length - itemsPerView) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <section style={{
        padding: '64px 0',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '16px' }}>
              Featured Products
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
              Loading our premium selection...
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                height: '300px',
                background: '#f3f4f6',
                animation: 'pulse 2s infinite'
              }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !featuredProducts || featuredProducts.length === 0) {
    return (
      <section style={{
        padding: '64px 0',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '16px' }}>
            Featured Products
          </h2>
          <p>No featured products available.</p>
        </div>
      </section>
    );
  }

  const canScrollNext = currentIndex < featuredProducts.length - itemsPerView;
  const canScrollPrev = currentIndex > 0;

  return (
    <section style={{
      padding: '64px 0',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Featured Products
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Discover our premium selection of organic ingredients, carefully sourced and quality-tested for your business needs.
          </p>
        </div>

        {/* Carousel Container */}
        <div style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Previous Button */}
          {canScrollPrev && (
            <button
              onClick={prevSlide}
              style={{
                position: 'absolute',
                left: '-24px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                backgroundColor: 'white',
                border: '2px solid #16a34a',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0fdf4';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"></polyline>
              </svg>
            </button>
          )}

          {/* Next Button */}
          {canScrollNext && (
            <button
              onClick={nextSlide}
              style={{
                position: 'absolute',
                right: '-24px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                backgroundColor: 'white',
                border: '2px solid #16a34a',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0fdf4';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
          )}

          {/* Products Viewport */}
          <div style={{ overflow: 'hidden', borderRadius: '8px' }}>
            <div style={{
              display: 'flex',
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              transition: 'transform 0.3s ease-in-out',
              width: `${(featuredProducts.length / itemsPerView) * 100}%`
            }}>
              {featuredProducts.map((product, index) => (
                <div
                  key={product.id}
                  style={{
                    flex: `0 0 ${100 / featuredProducts.length}%`,
                    padding: '0 12px'
                  }}
                >
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden',
                    height: '420px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                  onClick={() => window.location.href = `/product/${product.slug}`}
                  >
                    {/* Product Image */}
                    <div style={{ height: '200px', position: 'relative' }}>
                      {product.mainImage ? (
                        <img
                          src={product.mainImage}
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            color: '#16a34a'
                          }}>
                            {product.name.charAt(0)}
                          </div>
                        </div>
                      )}
                      
                      {/* Product ID Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {product.productId}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '8px',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {product.name}
                      </h3>

                      {product.origin && (
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          marginBottom: '8px'
                        }}>
                          Origin: {product.origin}
                        </p>
                      )}

                      {product.description && (
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          marginBottom: '16px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          flex: 1
                        }}>
                          {product.description}
                        </p>
                      )}

                      {/* Price and MOQ */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                      }}>
                        <div>
                          <span style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: '#16a34a'
                          }}>
                            ${product.priceUSD}
                          </span>
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>/kg</span>
                        </div>
                        {product.moq && (
                          <span style={{
                            fontSize: '0.75rem',
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}>
                            MOQ: {product.moq}kg
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        style={{
                          width: '100%',
                          backgroundColor: '#16a34a',
                          color: 'white',
                          padding: '10px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#15803d';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#16a34a';
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* View All Products Button */}
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <button
            style={{
              border: '2px solid #16a34a',
              color: '#16a34a',
              backgroundColor: 'transparent',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0fdf4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={() => window.location.href = '/products'}
          >
            View All Products →
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProductsCarouselNew;