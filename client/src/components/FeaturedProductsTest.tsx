import React from 'react';

const FeaturedProductsTest: React.FC = () => {
  console.log('FeaturedProductsTest component is rendering!');
  
  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            FEATURED PRODUCTS TEST - THIS SHOULD APPEAR
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            If you can see this section with green background, the component is working!
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="bg-white rounded-lg shadow-md p-4">
              <div className="h-48 bg-gray-200 rounded mb-4 flex items-center justify-center">
                <span className="text-gray-500 text-lg">Product {num}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Test Product {num}</h3>
              <p className="text-sm text-gray-600 mb-3">This is a test product description</p>
              <div className="text-lg font-bold text-green-600">${99 + num}.00</div>
              <button className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProductsTest;