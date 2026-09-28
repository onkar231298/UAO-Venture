import { useEffect } from "react";
import { Shield, FileCheck, Globe, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RegulatoryCompliance() {
  useEffect(() => {
    document.title = "Regulatory Compliance Services - Cape NatureX Organic";
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
              Regulatory Compliance Services
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Comprehensive regulatory support to ensure your organic ingredients meet all international standards and compliance requirements
            </p>
          </div>

          {/* Service Overview */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Regulatory Expertise
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Our regulatory compliance team ensures that all organic ingredients meet the stringent requirements of various international markets, helping you navigate complex regulatory landscapes with confidence.
            </p>
          </div>

          {/* Compliance Services */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Shield className="w-8 h-8 text-red-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Organic Certification
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• USDA Organic certification</li>
                <li>• EU Organic regulation compliance</li>
                <li>• JAS Organic (Japan) standards</li>
                <li>• NOP (National Organic Program)</li>
                <li>• Organic certification maintenance</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <FileCheck className="w-8 h-8 text-red-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Documentation Support
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Certificate of analysis preparation</li>
                <li>• Regulatory filing assistance</li>
                <li>• Import/export documentation</li>
                <li>• Compliance auditing</li>
                <li>• Record keeping systems</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <Globe className="w-8 h-8 text-red-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  International Standards
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• FDA compliance (USA)</li>
                <li>• EFSA regulations (Europe)</li>
                <li>• Health Canada requirements</li>
                <li>• TGA guidelines (Australia)</li>
                <li>• FSSAI standards (India)</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Risk Management
                </h3>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Regulatory risk assessment</li>
                <li>• Compliance monitoring</li>
                <li>• Change impact analysis</li>
                <li>• Regulatory updates tracking</li>
                <li>• Non-compliance mitigation</li>
              </ul>
            </div>
          </div>

          {/* Key Certifications */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Our Key Certifications & Accreditations
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">USDA Organic</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">Certified organic supplier</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">EU Organic</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">European organic compliance</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">ISO 22000</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">Food safety management</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">HACCP</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">Hazard analysis protocols</p>
              </div>
            </div>
          </div>

          {/* Regulatory Process */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Our Compliance Process
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center mr-4 mt-1">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Regulatory Assessment</h3>
                  <p className="text-gray-700 dark:text-gray-300">Initial evaluation of product requirements and target markets</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center mr-4 mt-1">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Gap Analysis</h3>
                  <p className="text-gray-700 dark:text-gray-300">Identification of compliance gaps and required documentation</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center mr-4 mt-1">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Implementation</h3>
                  <p className="text-gray-700 dark:text-gray-300">Development and implementation of compliance strategies</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center mr-4 mt-1">4</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Monitoring & Maintenance</h3>
                  <p className="text-gray-700 dark:text-gray-300">Ongoing compliance monitoring and regulatory updates</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="text-center bg-red-600 text-white rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">
              Need Regulatory Compliance Support?
            </h2>
            <p className="text-red-100 mb-6">
              Our regulatory experts are ready to help you navigate complex compliance requirements and ensure market access.
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