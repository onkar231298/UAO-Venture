import React from 'react';

const FeaturedProducts: React.FC = () => {
  console.log('FeaturedProducts component rendering...');
  
  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Products - Simple Version
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Testing if this component renders properly
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="h-48 bg-gray-200 rounded mb-4"></div>
            <h3 className="font-semibold text-gray-900 mb-2">Test Product 1</h3>
            <p className="text-sm text-gray-600 mb-3">This is a test product</p>
            <div className="text-lg font-bold text-green-600">$99.00</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="h-48 bg-gray-200 rounded mb-4"></div>
            <h3 className="font-semibold text-gray-900 mb-2">Test Product 2</h3>
            <p className="text-sm text-gray-600 mb-3">This is a test product</p>
            <div className="text-lg font-bold text-green-600">$99.00</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="h-48 bg-gray-200 rounded mb-4"></div>
            <h3 className="font-semibold text-gray-900 mb-2">Test Product 3</h3>
            <p className="text-sm text-gray-600 mb-3">This is a test product</p>
            <div className="text-lg font-bold text-green-600">$99.00</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="h-48 bg-gray-200 rounded mb-4"></div>
            <h3 className="font-semibold text-gray-900 mb-2">Test Product 4</h3>
            <p className="text-sm text-gray-600 mb-3">This is a test product</p>
            <div className="text-lg font-bold text-green-600">$99.00</div>
          </div>
        </div>
      </div>
    </section>
  );
};



export default FeaturedProducts;