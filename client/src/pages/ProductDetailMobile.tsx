import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function ProductDetailMobile() {
  const { slug } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: product, isLoading, error } = useQuery({
    queryKey: [`/api/products/slug/${slug}`],
  });

  if (isLoading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial' }}>
        <div style={{ background: '#f5f5f5', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial', textAlign: 'center' }}>
        <h1>Product Not Found</h1>
        <p>The product you're looking for doesn't exist.</p>
      </div>
    );
  }

  const allImages = [
    ...(product.mainImage ? [product.mainImage] : []),
    ...(product.galleryImages || []),
  ].filter(Boolean);

  const currentImage = allImages[currentImageIndex];

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9', fontFamily: 'Arial, sans-serif' }}>
      {/* Mobile Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e5e5', padding: '16px', position: 'sticky', top: 0, zIndex: 20 }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#333', lineHeight: '1.3' }}>
          {product.name}
        </h1>
        {product.botanicalName && (
          <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic', margin: '4px 0 0 0' }}>
            {product.botanicalName}
          </p>
        )}
      </div>

      <div style={{ paddingBottom: '80px' }}>
        {/* Product Image Section */}
        <div style={{ background: 'white' }}>
          <div style={{ position: 'relative' }}>
            {currentImage ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={currentImage}
                  alt={`${product.name}`}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                />
                
                {allImages.length > 1 && (
                  <>
                    <button
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                    >
                      ←
                    </button>
                    <button
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => setCurrentImageIndex((prev) => (prev + 1) % allImages.length)}
                    >
                      →
                    </button>
                    <div style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      fontSize: '12px',
                      padding: '4px 12px',
                      borderRadius: '16px'
                    }}>
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{
                width: '100%',
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ffa500, #ff7f50)',
                color: 'white'
              }}>
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 16px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px'
                  }}>
                    📦
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: '14px' }}>Premium Quality Product</div>
                </div>
              </div>
            )}
            
            {/* Product Type Badge */}
            {product.productType && (
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: '#16a34a',
                color: 'white',
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                🌿 {product.productType === 'organic' ? 'Organic' : 'Premium'}
              </div>
            )}
          </div>
          
          {/* Image Thumbnails */}
          {allImages.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', padding: '16px', overflowX: 'auto' }}>
              {allImages.map((image, index) => (
                <button
                  key={index}
                  style={{
                    flexShrink: 0,
                    width: '56px',
                    height: '56px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: index === currentImageIndex ? '2px solid #f97316' : '2px solid #e5e5e5',
                    cursor: 'pointer',
                    padding: 0,
                    background: 'none'
                  }}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div style={{ background: 'white', marginTop: '8px', padding: '16px' }}>
          {/* Basic Info */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>Product ID:</span>
              <span style={{ fontSize: '14px', color: '#333' }}>{product.productId}</span>
            </div>
            
            {product.origin && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>Origin:</span>
                <span style={{ fontSize: '14px', color: '#333' }}>{product.origin}</span>
              </div>
            )}
            
            {product.form && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>Form:</span>
                <span style={{ fontSize: '14px', color: '#333' }}>{product.form}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>MOQ:</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f97316' }}>
                {product.moq || 'Contact for details'}
              </span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                Description
              </h3>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5', margin: 0 }}>
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* Specifications Preview */}
        <div style={{ background: 'white', marginTop: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
            Quick Specifications
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
            {product.botanicalName && (
              <>
                <span style={{ color: '#666' }}>Botanical Name:</span>
                <span style={{ color: '#333' }}>{product.botanicalName}</span>
              </>
            )}
            {product.shelfLife && (
              <>
                <span style={{ color: '#666' }}>Shelf Life:</span>
                <span style={{ color: '#333' }}>{product.shelfLife}</span>
              </>
            )}
            {product.moistureContent && (
              <>
                <span style={{ color: '#666' }}>Moisture:</span>
                <span style={{ color: '#333' }}>{product.moistureContent}</span>
              </>
            )}
            {product.meshSize && (
              <>
                <span style={{ color: '#666' }}>Mesh Size:</span>
                <span style={{ color: '#333' }}>{product.meshSize}</span>
              </>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div style={{ background: 'white', marginTop: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            Need More Information?
          </h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            Contact our team for detailed specifications, pricing, and custom requirements.
          </p>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid #e5e5e5',
        padding: '16px',
        zIndex: 30,
        boxShadow: '0 -4px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button style={{
            height: '48px',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            background: 'white',
            color: '#333',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            ❤️ Save Product
          </button>
          <button style={{
            height: '48px',
            border: 'none',
            borderRadius: '8px',
            background: '#f97316',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            💬 Get Quote
          </button>
        </div>
      </div>
    </div>
  );
}