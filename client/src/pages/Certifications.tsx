import { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Award, Globe, Shield, Leaf, FileCheck } from "lucide-react";
import EnhancedSEOHead from "@/components/EnhancedSEOHead";

export default function Certifications() {
  useEffect(() => {
    document.title = 'Our Certifications | BFI Organic - Quality Assurance & Compliance';
  }, []);

  const certifications = [
    {
      title: "USDA Organic",
      description: "Certified organic by the United States Department of Agriculture, ensuring our products meet strict organic standards.",
      icon: <Leaf className="w-8 h-8 text-green-600" />,
      status: "Certified",
      authority: "USDA",
      scope: "Global Recognition"
    },
    {
      title: "EU Organic Certification",
      description: "European Union organic certification for distribution across European markets.",
      icon: <Globe className="w-8 h-8 text-blue-600" />,
      status: "Certified",
      authority: "EU Commission",
      scope: "European Union"
    },
    {
      title: "India Organic (NPOP)",
      description: "National Programme for Organic Production certification for domestic and export markets.",
      icon: <Award className="w-8 h-8 text-orange-600" />,
      status: "Certified",
      authority: "APEDA, India",
      scope: "India & Export"
    },
    {
      title: "ISO 22000:2018",
      description: "Food Safety Management System certification ensuring safe food production.",
      icon: <Shield className="w-8 h-8 text-red-600" />,
      status: "Certified",
      authority: "ISO",
      scope: "International"
    },
    {
      title: "HACCP",
      description: "Hazard Analysis and Critical Control Points system for food safety.",
      icon: <CheckCircle className="w-8 h-8 text-purple-600" />,
      status: "Certified",
      authority: "HACCP International",
      scope: "Global"
    },
    {
      title: "GMP (Good Manufacturing Practices)",
      description: "Quality assurance that products are consistently produced and controlled.",
      icon: <FileCheck className="w-8 h-8 text-teal-600" />,
      status: "Certified",
      authority: "FDA Guidelines",
      scope: "International"
    }
  ];

  const complianceStandards = [
    "FDA Food Safety Modernization Act (FSMA)",
    "European Food Safety Authority (EFSA) Guidelines",
    "Codex Alimentarius Standards",
    "BRC Global Standards",
    "FSSAI (Food Safety and Standards Authority of India)",
    "Kosher Certification",
    "Halal Certification"
  ];

  return (
    <>
      <EnhancedSEOHead 
        title="Our Certifications | BFI Organic - Quality Assurance & Compliance"
        description="BFI Organic holds international certifications including USDA Organic, EU Organic, ISO 22000, HACCP, and GMP. Ensuring highest quality standards for organic ingredients worldwide."
        canonicalUrl="/certifications"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "BFI Organic",
          "url": "https://bright-organic.com",
          "hasCredential": certifications.map(cert => ({
            "@type": "EducationalOccupationalCredential",
            "name": cert.title,
            "description": cert.description,
            "credentialCategory": "Certification",
            "recognizedBy": {
              "@type": "Organization",
              "name": cert.authority
            }
          }))
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Our Certifications & Compliance
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Committed to the highest standards of quality, safety, and organic integrity
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="text-lg py-2 px-4">
                6+ International Certifications
              </Badge>
              <Badge variant="secondary" className="text-lg py-2 px-4">
                ISO 22000:2018 Certified
              </Badge>
              <Badge variant="secondary" className="text-lg py-2 px-4">
                USDA & EU Organic
              </Badge>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Certification Cards */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              Our Key Certifications
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {certifications.map((cert, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {cert.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 text-gray-800">
                          {cert.title}
                        </h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {cert.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              {cert.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            <strong>Authority:</strong> {cert.authority}
                          </p>
                          <p className="text-sm text-gray-500">
                            <strong>Scope:</strong> {cert.scope}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Compliance Standards */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              Additional Compliance Standards
            </h2>
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="grid md:grid-cols-2 gap-6">
                {complianceStandards.map((standard, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{standard}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quality Commitment */}
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-8 mb-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
              Our Quality Commitment
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Organic Integrity</h3>
                <p className="text-gray-600">
                  100% certified organic ingredients sourced from verified organic farms with complete traceability.
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Food Safety</h3>
                <p className="text-gray-600">
                  Rigorous food safety protocols following international standards to ensure product safety.
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Quality Excellence</h3>
                <p className="text-gray-600">
                  Continuous improvement and quality management systems ensuring consistent excellence.
                </p>
              </div>
            </div>
          </div>

          {/* Contact for Documentation */}
          <div className="text-center bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Need Certification Documents?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Request copies of our certification documents, compliance reports, and quality documentation 
              for your regulatory requirements.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileCheck className="w-5 h-5" />
              Request Documentation
            </a>
          </div>
        </div>
      </div>
    </>
  );
}