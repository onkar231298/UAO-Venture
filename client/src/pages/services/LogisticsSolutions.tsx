import { useEffect } from "react";
import { Truck, Plane, Ship, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LogisticsSolutions() {
  useEffect(() => {
    document.title = "Logistics Solutions - Atlas Ingredients";
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Logistics Solutions
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Comprehensive logistics and supply chain management services to ensure timely and secure delivery of your organic ingredients worldwide
            </p>
          </div>

          {/* Service Overview */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Global Supply Chain Excellence
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Our comprehensive logistics solutions ensure your organic ingredients reach their destination safely, on time, and in optimal condition. We manage the entire supply chain from our facilities to your doorstep with full traceability and compliance.
            </p>
          </div>

          {/* Transportation Options */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Truck className="w-8 h-8 text-orange-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Road Transportation
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Temperature-controlled trucks</li>
                <li>• Domestic distribution network</li>
                <li>• Last-mile delivery services</li>
                <li>• Express delivery options</li>
                <li>• Real-time tracking systems</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Ship className="w-8 h-8 text-orange-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Sea Freight
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Full container load (FCL)</li>
                <li>• Less than container load (LCL)</li>
                <li>• Reefer container services</li>
                <li>• Port-to-port delivery</li>
                <li>• Customs clearance support</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Plane className="w-8 h-8 text-orange-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Air Freight
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Express air cargo services</li>
                <li>• Temperature-sensitive shipping</li>
                <li>• Priority handling for urgents</li>
                <li>• Direct airport connections</li>
                <li>• Expedited customs processing</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <MapPin className="w-8 h-8 text-orange-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Warehousing & Storage
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Climate-controlled facilities</li>
                <li>• Inventory management systems</li>
                <li>• Pick and pack services</li>
                <li>• Quality control checkpoints</li>
                <li>• FIFO rotation protocols</li>
              </ul>
            </div>
          </div>

          {/* Global Coverage */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Global Coverage & Regional Expertise
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Americas</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li>• USA & Canada</li>
                  <li>• Mexico & Central America</li>
                  <li>• Brazil & South America</li>
                  <li>• Caribbean regions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Europe & Middle East</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li>• European Union</li>
                  <li>• United Kingdom</li>
                  <li>• Middle East & North Africa</li>
                  <li>• Russia & CIS countries</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Asia Pacific</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li>• Southeast Asia</li>
                  <li>• Australia & New Zealand</li>
                  <li>• Japan & South Korea</li>
                  <li>• China & Hong Kong</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Special Services */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Specialized Logistics Services
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Temperature-Controlled Logistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-600 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">Cold chain management (2-8°C)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-600 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">Frozen storage (-18°C to -25°C)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-600 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">Ambient temperature control</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Documentation & Compliance</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-600 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">Organic certification handling</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-600 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">Import/export documentation</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-600 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">Regulatory compliance management</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logistics Process */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Our Logistics Process
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mr-4 mt-1">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Order Processing & Planning</h3>
                  <p className="text-gray-700 dark:text-gray-300">Detailed logistics planning based on product requirements and destination</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mr-4 mt-1">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Packaging & Preparation</h3>
                  <p className="text-gray-700 dark:text-gray-300">Secure packaging with appropriate protection for shipping conditions</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mr-4 mt-1">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Transportation & Tracking</h3>
                  <p className="text-gray-700 dark:text-gray-300">Real-time tracking and monitoring throughout the journey</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mr-4 mt-1">4</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Delivery & Confirmation</h3>
                  <p className="text-gray-700 dark:text-gray-300">Safe delivery with proof of delivery and quality verification</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="text-center bg-orange-600 text-white rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">
              Need Logistics Support?
            </h2>
            <p className="text-orange-100 mb-6">
              Our logistics experts are ready to design a customized shipping solution for your organic ingredient requirements.
            </p>
            <div className="space-y-2">
              <p><strong>Email:</strong> admin@bright-organic.com</p>
              <p><strong>Phone:</strong> +91-7249847439</p>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}