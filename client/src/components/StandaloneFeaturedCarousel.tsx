import React from 'react';

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

// Standalone Featured Products Carousel - No external dependencies
const StandaloneFeaturedCarousel: React.FC = () => {
  console.log('🚀 StandaloneFeaturedCarousel is loading!');
  console.log('🚀 Component timestamp:', Date.now());
  
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  
  // Fetch products on mount
  React.useEffect(() => {
    console.log('🔄 Starting to fetch featured products...');
    fetch('/api/products/featured?limit=8')
      .then(response => {
        console.log('📡 Response received:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('✅ Featured products fetched:', data.length, 'products');
        console.log('📦 First product:', data[0]?.name);
        setProducts(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('❌ Error fetching products:', error);
        setLoading(false);
      });
  }, []);

  const nextSlide = () => {
    if (currentIndex < products.length - 4) {
      setCurrentIndex(currentIndex + 1);
      console.log('➡️ Moving to slide:', currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      console.log('⬅️ Moving to slide:', currentIndex - 1);
    }
  };

  if (loading) {
    return React.createElement('section', {
      style: {
        padding: '64px 0',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'
      }
    }, 
      React.createElement('div', {
        style: { maxWidth: '1200px', margin: '0 auto', padding: '0 16px', textAlign: 'center' }
      },
        React.createElement('h2', {
          style: { fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '16px' }
        }, 'Featured Products'),
        React.createElement('p', {
          style: { fontSize: '1.125rem', color: '#6b7280' }
        }, 'Loading our premium selection...')
      )
    );
  }

  return React.createElement('section', {
    style: {
      padding: '64px 0',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'
    }
  },
    React.createElement('div', {
      style: { maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }
    },
      // Header
      React.createElement('div', {
        style: { textAlign: 'center', marginBottom: '48px' }
      },
        React.createElement('h2', {
          style: {
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px'
          }
        }, 'Featured Products'),
        React.createElement('p', {
          style: {
            fontSize: '1.125rem',
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto'
          }
        }, 'Discover our premium selection of organic ingredients, carefully sourced and quality-tested for your business needs.')
      ),
      
      // Carousel Container
      React.createElement('div', {
        style: { position: 'relative', maxWidth: '1000px', margin: '0 auto' }
      },
        // Previous Button
        currentIndex > 0 ? React.createElement('button', {
          onClick: prevSlide,
          style: {
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
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
        }, '←') : null,

        // Next Button
        currentIndex < products.length - 4 ? React.createElement('button', {
          onClick: nextSlide,
          style: {
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
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
        }, '→') : null,

        // Products Container
        React.createElement('div', {
          style: { overflow: 'hidden', borderRadius: '8px' }
        },
          React.createElement('div', {
            style: {
              display: 'flex',
              transform: `translateX(-${currentIndex * 25}%)`,
              transition: 'transform 0.3s ease-in-out',
              width: `${products.length * 25}%`
            }
          },
            ...products.map((product, index) => 
              React.createElement('div', {
                key: product.id,
                style: {
                  flex: '0 0 25%',
                  padding: '0 12px'
                }
              },
                React.createElement('div', {
                  style: {
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden',
                    height: '420px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  },
                  onMouseEnter: (e: any) => {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1)';
                  },
                  onMouseLeave: (e: any) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  },
                  onClick: () => window.location.href = `/product/${product.slug}`
                },
                  // Product Image
                  React.createElement('div', {
                    style: { height: '200px', position: 'relative' }
                  },
                    product.mainImage ? 
                      React.createElement('img', {
                        src: product.mainImage,
                        alt: product.name,
                        style: {
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }
                      }) :
                      React.createElement('div', {
                        style: {
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }
                      },
                        React.createElement('div', {
                          style: {
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            color: '#16a34a'
                          }
                        }, product.name.charAt(0))
                      ),
                    
                    // Product ID Badge
                    React.createElement('div', {
                      style: {
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }
                    }, product.productId)
                  ),

                  // Product Info
                  React.createElement('div', {
                    style: { padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }
                  },
                    React.createElement('h3', {
                      style: {
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '8px',
                        lineHeight: '1.4'
                      }
                    }, product.name),

                    product.origin ? React.createElement('p', {
                      style: {
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginBottom: '8px'
                      }
                    }, `Origin: ${product.origin}`) : null,

                    product.description ? React.createElement('p', {
                      style: {
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginBottom: '16px',
                        flex: 1
                      }
                    }, product.description.substring(0, 100) + '...') : null,

                    // Price and MOQ
                    React.createElement('div', {
                      style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                      }
                    },
                      React.createElement('div', {},
                        React.createElement('span', {
                          style: {
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: '#16a34a'
                          }
                        }, `$${product.priceUSD}`),
                        React.createElement('span', {
                          style: { fontSize: '0.875rem', color: '#6b7280' }
                        }, '/kg')
                      ),
                      product.moq ? React.createElement('span', {
                        style: {
                          fontSize: '0.75rem',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }
                      }, `MOQ: ${product.moq}kg`) : null
                    ),

                    // Action Button
                    React.createElement('button', {
                      style: {
                        width: '100%',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }
                    }, 'View Details')
                  )
                )
              )
            )
          )
        )
      ),

      // View All Products Button
      React.createElement('div', {
        style: { textAlign: 'center', marginTop: '48px' }
      },
        React.createElement('button', {
          style: {
            border: '2px solid #16a34a',
            color: '#16a34a',
            backgroundColor: 'transparent',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer'
          },
          onClick: () => window.location.href = '/products'
        }, 'View All Products →')
      )
    )
  );
};

export default StandaloneFeaturedCarousel;