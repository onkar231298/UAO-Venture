import { useEffect } from "react";
import { Package, Recycle, Palette, Shield } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CustomPackaging() {
  useEffect(() => {
    document.title = "Custom Packaging Services - Atlas Ingredients";
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
              Custom Packaging Services
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Tailored packaging solutions designed to protect your organic ingredients while meeting your brand and sustainability requirements
            </p>
          </div>

          {/* Service Overview */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Packaging Excellence
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Our custom packaging solutions ensure product integrity, extend shelf life, and enhance your brand presence while maintaining sustainability standards. We offer flexible packaging options from small-scale to bulk industrial requirements.
            </p>
          </div>

          {/* Packaging Services */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Package className="w-8 h-8 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Flexible Packaging Options
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Multi-layer barrier films</li>
                <li>• Stand-up pouches</li>
                <li>• Aluminum foil lined bags</li>
                <li>• Vacuum sealed packaging</li>
                <li>• Nitrogen flushed containers</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Recycle className="w-8 h-8 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Sustainable Solutions
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Biodegradable packaging materials</li>
                <li>• Recycled content options</li>
                <li>• Compostable packaging</li>
                <li>• Minimal packaging designs</li>
                <li>• Reusable container programs</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Palette className="w-8 h-8 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Brand Customization
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Custom label design</li>
                <li>• Brand color matching</li>
                <li>• Logo integration</li>
                <li>• Product information panels</li>
                <li>• Regulatory compliance labeling</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Shield className="w-8 h-8 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Protection & Preservation
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Moisture barrier protection</li>
                <li>• Light-resistant materials</li>
                <li>• Oxygen barrier technology</li>
                <li>• Temperature-resistant packaging</li>
                <li>• Tamper-evident sealing</li>
              </ul>
            </div>
          </div>

          {/* Package Types */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Available Package Sizes & Types
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Small Scale</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li>• 50g - 1kg pouches</li>
                  <li>• Retail-ready packaging</li>
                  <li>• Sample size containers</li>
                  <li>• Trial pack options</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Medium Scale</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li>• 1kg - 25kg bags</li>
                  <li>• Multi-layer sacks</li>
                  <li>• Pillow bags</li>
                  <li>• Block bottom bags</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Bulk Industrial</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li>• 25kg - 1000kg containers</li>
                  <li>• FIBC (bulk bags)</li>
                  <li>• Drums and barrels</li>
                  <li>• Custom bulk solutions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Packaging Features */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Advanced Packaging Features
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Barrier Technologies</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-600 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">High barrier films for extended shelf life</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-600 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">UV protection for light-sensitive products</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-600 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">Aroma barrier to preserve essential oils</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Smart Packaging</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-600 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">QR codes for traceability</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-600 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">Temperature indicators</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-600 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">Freshness monitoring systems</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="text-center bg-purple-600 text-white rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">
              Ready for Custom Packaging?
            </h2>
            <p className="text-purple-100 mb-6">
              Let's design the perfect packaging solution for your organic ingredients that meets your specific requirements.
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