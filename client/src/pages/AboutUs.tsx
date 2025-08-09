import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Factory, Leaf, Shield, Globe2, CheckCircle } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About Bright Fame Organic
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Committed to providing the highest quality organic and conventionally grown natural ingredients, 
              always GMO-free and sourced with care.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Company Mission */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                At Bright Fame Organic, we are committed to providing the highest quality organic and conventionally grown natural ingredients, 
                always GMO-free and sourced with care. Our mission is to bridge the gap between traditional agriculture and modern food, 
                nutraceutical, and herbal industries — delivering products that are safe, pure, and sustainably produced.
              </p>
            </div>

            {/* Certifications */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Global Certifications</h2>
              <p className="text-lg text-gray-700 mb-6">
                We are proudly certified by EU Organic, JAS, USDA NOP, NPOP, and India Organic, ensuring that every product 
                we supply meets the most stringent global quality and purity standards.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4 text-center">
                  <CardContent className="p-0">
                    <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <Badge variant="outline" className="text-xs">EU Organic</Badge>
                  </CardContent>
                </Card>
                <Card className="p-4 text-center">
                  <CardContent className="p-0">
                    <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <Badge variant="outline" className="text-xs">JAS</Badge>
                  </CardContent>
                </Card>
                <Card className="p-4 text-center">
                  <CardContent className="p-0">
                    <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <Badge variant="outline" className="text-xs">USDA NOP</Badge>
                  </CardContent>
                </Card>
                <Card className="p-4 text-center">
                  <CardContent className="p-0">
                    <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <Badge variant="outline" className="text-xs">NPOP</Badge>
                  </CardContent>
                </Card>
                <Card className="p-4 text-center">
                  <CardContent className="p-0">
                    <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <Badge variant="outline" className="text-xs">India Organic</Badge>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Facilities */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">State-of-the-Art Facilities</h2>
              <p className="text-lg text-gray-700 mb-6">
                Our operations are powered by state-of-the-art facilities:
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="p-6">
                  <CardContent className="p-0">
                    <div className="flex items-start space-x-4">
                      <Factory className="w-8 h-8 text-green-600 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          High-End Processing Unit
                        </h3>
                        <p className="text-gray-600 mb-2">
                          <strong>Location:</strong> Mehsana, Gujarat
                        </p>
                        <p className="text-gray-700 mb-3">
                          This organic dedicated unit is equipped with two pulverizer lines, each with a capacity of 800 kg/hour, 
                          enabling us to produce finely milled herbal and spice powders at scale.
                        </p>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Organic Certified
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6">
                  <CardContent className="p-0">
                    <div className="flex items-start space-x-4">
                      <Leaf className="w-8 h-8 text-green-600 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          Cumin Sorting Unit
                        </h3>
                        <p className="text-gray-600 mb-2">
                          <strong>Location:</strong> Mehsana, Gujarat
                        </p>
                        <p className="text-gray-700">
                          Specialized facility for cumin, coriander, and other whole spices sorting and grading, 
                          ensuring premium quality and purity standards for our spice products.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6">
                  <CardContent className="p-0">
                    <div className="flex items-start space-x-4">
                      <Leaf className="w-8 h-8 text-green-600 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          Solvent Extraction Plant
                        </h3>
                        <p className="text-gray-600 mb-2">
                          <strong>Location:</strong> Bithreddy Village, Denkanikottai Taluk, Krishnagiri District, Tamil Nadu
                        </p>
                        <p className="text-gray-700">
                          Specializing in the production of herbal extracts, natural caffeine, and plant-derived vitamins 
                          such as iron from guava leaves, beta-carotene from carrots, and more.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Product Range */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Complete Product Range</h2>
              <p className="text-lg text-gray-700 mb-6">
                We offer a complete range of products, including:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Whole herbs</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">TBC (Tea Bag Cut) herbs</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Herbal powders</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Standardized herbal extracts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expertise */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Expertise</h2>
              <p className="text-lg text-gray-700 mb-6">
                Our expertise in extraction allows us to supply natural bioactive compounds that retain their full potency, 
                aroma, and nutritional value. Whether it's botanical extracts, natural caffeine, plant-based vitamins, or 
                specialty herbal blends, we ensure traceability, consistency, and purity at every step.
              </p>
            </div>

            {/* Company Promise */}
            <div className="bg-green-50 rounded-lg p-8 text-center">
              <Globe2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Promise</h2>
              <p className="text-lg text-gray-700">
                At Bright Fame Organic, we don't just deliver ingredients — we deliver trust, quality, and sustainability, 
                from farm to final product.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}