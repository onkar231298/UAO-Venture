import { useEffect } from "react";
import { Lightbulb, Microscope, FileText, Users } from "lucide-react";

export default function RDSupport() {
  useEffect(() => {
    document.title = "R&D Support Services - Bright Fame Organic";
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Research & Development Support
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Comprehensive R&D services to help you innovate and develop cutting-edge organic ingredient solutions
            </p>
          </div>

          {/* Service Overview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Innovation Partnership
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Our experienced R&D team collaborates with clients to develop innovative organic ingredient formulations, optimize processing methods, and create custom solutions that meet specific market requirements.
            </p>
          </div>

          {/* R&D Services */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Lightbulb className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Product Development
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Custom formulation development</li>
                <li>• Ingredient optimization</li>
                <li>• Stability testing</li>
                <li>• Shelf-life studies</li>
                <li>• Prototype creation</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Microscope className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Process Optimization
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Extraction method development</li>
                <li>• Purification processes</li>
                <li>• Scale-up feasibility studies</li>
                <li>• Yield optimization</li>
                <li>• Cost-effectiveness analysis</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <FileText className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Technical Documentation
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Technical data sheets</li>
                <li>• Method development reports</li>
                <li>• Analytical method validation</li>
                <li>• Patent support documentation</li>
                <li>• Regulatory submissions</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Collaborative Research
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Joint research projects</li>
                <li>• Academic partnerships</li>
                <li>• Industry collaborations</li>
                <li>• Technology transfer</li>
                <li>• Innovation consulting</li>
              </ul>
            </div>
          </div>

          {/* Research Areas */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Our Research Focus Areas
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Bioactive Compounds</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li>• Antioxidant research</li>
                  <li>• Anti-inflammatory compounds</li>
                  <li>• Adaptogenic properties</li>
                  <li>• Nutraceutical applications</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Sustainable Extraction</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li>• Green extraction methods</li>
                  <li>• Supercritical CO2 extraction</li>
                  <li>• Ultrasonic extraction</li>
                  <li>• Enzymatic processing</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Novel Applications</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li>• Functional food ingredients</li>
                  <li>• Cosmetic applications</li>
                  <li>• Pharmaceutical intermediates</li>
                  <li>• Natural preservatives</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quality Enhancement</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li>• Standardization protocols</li>
                  <li>• Purity improvement</li>
                  <li>• Stability enhancement</li>
                  <li>• Bioavailability studies</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="text-center bg-blue-600 text-white rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">
              Ready to Innovate Together?
            </h2>
            <p className="text-blue-100 mb-6">
              Let's discuss your R&D requirements and explore how we can support your innovation goals.
            </p>
            <div className="space-y-2">
              <p><strong>Email:</strong> admin@bright-organic.com</p>
              <p><strong>Phone:</strong> +91-7249847439</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}