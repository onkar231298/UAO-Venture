import React from 'react';

const TestCarousel = () => {
  console.log('🎯 TEST CAROUSEL IS RENDERING NOW!');
  console.log('🎯 Test timestamp:', new Date().toISOString());
  
  return (
    <div style={{
      padding: '32px',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
      textAlign: 'center' as const
    }}>
      <h2 style={{ fontSize: '2rem', color: '#16a34a', marginBottom: '16px' }}>
        🎠 FEATURED PRODUCTS CAROUSEL TEST
      </h2>
      <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
        This test component is rendering successfully!
      </p>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        marginTop: '24px'
      }}>
        <button style={{
          backgroundColor: '#16a34a',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer'
        }}>
          ← Previous
        </button>
        <button style={{
          backgroundColor: '#16a34a',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer'
        }}>
          Next →
        </button>
      </div>
    </div>
  );
};

export default TestCarousel;