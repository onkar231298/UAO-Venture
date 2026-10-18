import { useEffect } from "react";
import { CheckCircle, Award, Users, Globe } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function QualityTesting() {
  useEffect(() => {
    document.title = "Quality Testing Services - Atlas Ingredients";
  }, []);

  return (
    <div className="atlas-public-theme min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Quality Testing Services
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Comprehensive quality assurance and testing services to ensure your organic ingredients meet the highest standards
            </p>
          </div>

          {/* Service Overview */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Our Testing Capabilities
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              At Atlas Ingredients, we maintain state-of-the-art testing facilities to ensure every product meets international quality standards. Our comprehensive testing protocols guarantee the purity, potency, and safety of all organic ingredients.
            </p>
          </div>

          {/* Testing Services */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Chemical Analysis
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Active compound identification</li>
                <li>• Moisture content analysis</li>
                <li>• Ash content testing</li>
                <li>• pH and acidity testing</li>
                <li>• Heavy metals detection</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Award className="w-8 h-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Microbiological Testing
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Total plate count</li>
                <li>• Yeast and mold testing</li>
                <li>• Pathogen detection</li>
                <li>• Salmonella screening</li>
                <li>• E.coli testing</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Users className="w-8 h-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Pesticide Residue Testing
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Multi-residue analysis</li>
                <li>• Organochlorine compounds</li>
                <li>• Organophosphorus compounds</li>
                <li>• Carbamate pesticides</li>
                <li>• Pyrethroid analysis</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Globe className="w-8 h-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Nutritional Analysis
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Protein content analysis</li>
                <li>• Fat and fiber testing</li>
                <li>• Vitamin content analysis</li>
                <li>• Mineral profiling</li>
                <li>• Caloric value determination</li>
              </ul>
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Our Testing Standards & Certifications
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">ISO 17025</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">Accredited testing laboratory standards</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">USDA Organic</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">Certified organic testing protocols</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">EU Organic</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">European organic compliance testing</p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="text-center bg-green-600 text-white rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">
              Need Quality Testing Services?
            </h2>
            <p className="text-green-100 mb-6">
              Contact our quality assurance team to discuss your testing requirements and get a customized testing plan.
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