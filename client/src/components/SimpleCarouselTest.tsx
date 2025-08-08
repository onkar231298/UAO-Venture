function SimpleCarouselTest() {
  console.log('🟢 SimpleCarouselTest rendering successfully!');
  
  return (
    <section style={{
      padding: '64px 16px',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center' as const
      }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          Featured Products
        </h2>
        <p style={{
          fontSize: '1.125rem',
          color: '#6b7280',
          marginBottom: '48px'
        }}>
          Discover our premium selection of organic ingredients
        </p>

        <div style={{
          position: 'relative' as const,
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {/* Navigation Arrows */}
          <button 
            style={{
              position: 'absolute' as const,
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'white',
              border: '2px solid #16a34a',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              fontSize: '20px',
              zIndex: 10
            }}
            onClick={() => console.log('⬅️ Previous clicked')}
          >
            ←
          </button>

          <button 
            style={{
              position: 'absolute' as const,
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'white',
              border: '2px solid #16a34a',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              fontSize: '20px',
              zIndex: 10
            }}
            onClick={() => console.log('➡️ Next clicked')}
          >
            →
          </button>

          {/* Product Cards Container */}
          <div style={{
            overflow: 'hidden',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              transition: 'transform 0.3s ease-in-out',
              gap: '24px'
            }}>
              {/* Product Card 1 */}
              <div style={{
                flexShrink: 0,
                width: '25%',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                height: '384px',
                cursor: 'pointer'
              }}>
                <div style={{
                  height: '192px',
                  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative' as const
                }}>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: '#16a34a'
                  }}>
                    T
                  </div>
                  <div style={{
                    position: 'absolute' as const,
                    top: '8px',
                    left: '8px',
                    background: '#16a34a',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '16px',
                    fontSize: '12px'
                  }}>
                    BFI001
                  </div>
                </div>
                <div style={{
                  padding: '16px',
                  height: '192px',
                  display: 'flex',
                  flexDirection: 'column' as const
                }}>
                  <h3 style={{
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}>
                    Turmeric Powder
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '8px'
                  }}>
                    Origin: India
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    flex: 1
                  }}>
                    Premium quality turmeric powder with high curcumin content
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'auto'
                  }}>
                    <div>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#16a34a'
                      }}>
                        $12.50
                      </span>
                      <span style={{
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        /kg
                      </span>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      background: '#f3f4f6',
                      color: '#6b7280',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}>
                      MOQ: 100kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Repeat for 3 more cards */}
              {[2, 3, 4].map(num => (
                <div key={num} style={{
                  flexShrink: 0,
                  width: '25%',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                  height: '384px',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    height: '192px',
                    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative' as const
                  }}>
                    <div style={{
                      fontSize: '3rem',
                      fontWeight: 'bold',
                      color: '#16a34a'
                    }}>
                      {num === 2 ? 'G' : num === 3 ? 'C' : 'A'}
                    </div>
                    <div style={{
                      position: 'absolute' as const,
                      top: '8px',
                      left: '8px',
                      background: '#16a34a',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '16px',
                      fontSize: '12px'
                    }}>
                      BFI00{num}
                    </div>
                  </div>
                  <div style={{
                    padding: '16px',
                    height: '192px',
                    display: 'flex',
                    flexDirection: 'column' as const
                  }}>
                    <h3 style={{
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '8px'
                    }}>
                      {num === 2 ? 'Ginger Powder' : num === 3 ? 'Cinnamon Bark' : 'Ashwagandha Extract'}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '8px'
                    }}>
                      Origin: {num === 2 ? 'India' : num === 3 ? 'Sri Lanka' : 'India'}
                    </p>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      flex: 1
                    }}>
                      Premium quality organic ingredient for your business needs
                    </p>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 'auto'
                    }}>
                      <div>
                        <span style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#16a34a'
                        }}>
                          ${num === 2 ? '15.00' : num === 3 ? '28.50' : '45.00'}
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>
                          /kg
                        </span>
                      </div>
                      <span style={{
                        fontSize: '12px',
                        background: '#f3f4f6',
                        color: '#6b7280',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}>
                        MOQ: {num === 2 ? '50' : num === 3 ? '25' : '10'}kg
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '48px'
        }}>
          <button 
            style={{
              border: '2px solid #16a34a',
              color: '#16a34a',
              background: 'transparent',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '16px'
            }}
            onClick={() => window.location.href = '/products'}
          >
            View All Products →
          </button>
        </div>
      </div>
    </section>
  );
}

export default SimpleCarouselTest;