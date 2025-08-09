import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Factory, Leaf, Shield, Globe2, CheckCircle, Zap, Truck, Settings } from "lucide-react";

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
              
              {/* Organic Farmland Highlight */}
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <Leaf className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">950 Hectares Under Organic Certification</h3>
                    <p className="text-gray-700">
                      We manage extensive organic farmland across multiple regions, ensuring sustainable cultivation practices 
                      and maintaining the highest standards of organic agriculture for our premium ingredient sourcing.
                    </p>
                  </div>
                </div>
              </div>
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
              <p className="text-lg text-gray-700 mb-8">
                Our operations are powered by state-of-the-art facilities:
              </p>
              
              <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
                {/* High-End Processing Unit */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-shadow group">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-xl mb-6 group-hover:bg-green-200 transition-colors">
                    <Settings className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    High-End Processing Unit
                  </h3>
                  <p className="text-sm text-green-600 font-medium mb-4">
                    Location: Mehsana, Gujarat
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    This organic dedicated unit is equipped with two pulverizer lines, each with a capacity of 800 kg/hour, 
                    enabling us to produce finely milled herbal and spice powders at scale.
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    Organic Certified
                  </div>
                </div>

                {/* Cumin Sorting Unit */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-shadow group">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-6 group-hover:bg-blue-200 transition-colors">
                    <Zap className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Cumin Sorting Unit
                  </h3>
                  <p className="text-sm text-blue-600 font-medium mb-4">
                    Location: Mehsana, Gujarat
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Specialized facility for cumin, coriander, and other whole spices sorting and grading, 
                    ensuring premium quality and purity standards for our spice products.
                  </p>
                </div>

                {/* Solvent Extraction Plant */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-shadow group">
                  <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-xl mb-6 group-hover:bg-purple-200 transition-colors">
                    <Factory className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Solvent Extraction Plant
                  </h3>
                  <p className="text-sm text-purple-600 font-medium mb-4">
                    Location: Bithreddy Village, Denkanikottai Taluk, Krishnagiri District, Tamil Nadu
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Specializing in the production of herbal extracts, natural caffeine, and plant-derived vitamins 
                    such as iron from guava leaves, beta-carotene from carrots, and more.
                  </p>
                </div>
              </div>
            </div>

            {/* Product Range */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Complete Product Range</h2>
              <p className="text-lg text-gray-700 mb-6">
                We offer a complete range of products, including:
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Adaptogenic Herbs</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Amino Acids</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Bioactives & Nutrients</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Culinary Herbs</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Custom Blends</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Essential Oils</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Extraction Grade Raw Materials</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Extracts & Powders</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Herbal Powders</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Liquid Extracts</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Mushroom Powders</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Nutraceuticals & Dietary Supplements</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Oleoresins</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Phytoactive Compounds</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Plant-Based Proteins</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Probiotics</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Probiotics & Enzymes</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Seeds & Grains</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Spice Powders</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Spray Dried Fruits and Vegetables</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Superfoods & Super Greens</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Teas & Infusions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Vitamins & Minerals</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Whole Herbs</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Whole Spices</span>
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