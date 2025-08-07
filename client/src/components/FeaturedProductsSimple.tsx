import React from 'react';

// Simple Featured Products component without any complex dependencies
const FeaturedProductsSimple = () => {
  console.log('🌟 FeaturedProductsSimple is rendering!');
  
  // Hardcoded featured products for testing
  const sampleProducts = [
    { id: 1, name: 'Organic Turmeric Powder', price: '$45.00', image: null },
    { id: 2, name: 'Ashwagandha Root Extract', price: '$89.00', image: null },
    { id: 3, name: 'Organic Moringa Leaf Powder', price: '$32.00', image: null },
    { id: 4, name: 'Organic Ginger Powder', price: '$28.00', image: null }
  ];

  return (
    <section style={{ 
      padding: '64px 0', 
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 16px'
      }}>
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
            Discover our premium selection of organic ingredients
          </p>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '24px',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {sampleProducts.map((product) => (
            <div key={product.id} style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{ 
                height: '200px', 
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
              
              <div style={{ padding: '24px' }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  color: '#111827', 
                  marginBottom: '8px'
                }}>
                  {product.name}
                </h3>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280', 
                  marginBottom: '16px'
                }}>
                  Premium quality organic ingredient for your business needs
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center'
                }}>
                  <span style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    color: '#16a34a'
                  }}>
                    {product.price}
                  </span>
                  <button style={{ 
                    backgroundColor: '#16a34a', 
                    color: 'white', 
                    padding: '8px 16px', 
                    borderRadius: '6px', 
                    border: 'none', 
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#15803d';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#16a34a';
                  }}>
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <button style={{ 
            border: '2px solid #16a34a', 
            color: '#16a34a', 
            backgroundColor: 'transparent',
            padding: '12px 24px', 
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0fdf4';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}>
            View All Products
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProductsSimple;