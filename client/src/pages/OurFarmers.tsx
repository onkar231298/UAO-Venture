import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, Heart, Users, Award, Handshake, CheckCircle, Leaf, Globe2 } from "lucide-react";

export default function OurFarmers() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Our Farmers
              </h1>
              <p className="text-xl text-green-600 font-medium mb-8 italic">
                "From their hands to your table – a journey of trust, care, and purity."
              </p>
              <div className="w-24 h-1 bg-green-600 mx-auto"></div>
            </div>

            {/* Main Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                At Cape NatureX Organic, our farmers are not just suppliers – they are our partners, our family, and the backbone of our mission.
                We work hand-in-hand with farming communities across India, nurturing a shared vision of sustainable, chemical-free agriculture.
              </p>
              
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                We have established Internal Control Systems (ICS) in multiple regions of the country to ensure traceability, transparency, 
                and adherence to global organic standards. In the North-East, we proudly manage 950 hectares of land under Organic Certification, 
                producing some of the purest and most nutrient-rich crops in the world.
              </p>
              
              <p className="text-lg text-gray-700 leading-relaxed mb-12">
                Our commitment goes beyond buying produce – we actively invest in the growth and well-being of our farmers. This includes:
              </p>
            </div>

            {/* Support Services */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How We Support Our Farmers</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* High-quality seeds */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                    <Sprout className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    High-Quality Seeds & Planting Material
                  </h3>
                  <p className="text-gray-700">
                    Providing access to superior seeds and planting materials to ensure optimal crop yields and quality.
                  </p>
                </div>

                {/* Technical training */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center w-12 h-12 bg-[#e8efdc] rounded-lg mb-4">
                    <Users className="w-6 h-6 text-[#718b57]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Technical Training & Support
                  </h3>
                  <p className="text-gray-700">
                    Offering comprehensive training on organic farming practices and modern cultivation techniques.
                  </p>
                </div>

                {/* Storage facilities */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center w-12 h-12 bg-[#e8efdc] rounded-lg mb-4">
                    <Award className="w-6 h-6 text-[#718b57]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Storage & Post-Harvest Facilities
                  </h3>
                  <p className="text-gray-700">
                    Ensuring access to proper storage and post-harvest facilities to maintain crop quality.
                  </p>
                </div>

                {/* Fair procurement */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center w-12 h-12 bg-[#e8efdc] rounded-lg mb-4">
                    <Handshake className="w-6 h-6 text-[#718b57]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Fair & Timely Procurement
                  </h3>
                  <p className="text-gray-700">
                    Guaranteeing fair prices and timely procurement of produce, ensuring financial security for farmers.
                  </p>
                </div>

                {/* Certification support */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center w-12 h-12 bg-[#e8efdc] rounded-lg mb-4">
                    <CheckCircle className="w-6 h-6 text-[#718b57]" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Organic Certification Support
                  </h3>
                  <p className="text-gray-700">
                    Supporting farmers with organic certification and compliance at no additional cost.
                  </p>
                </div>

                {/* Own farms */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg mb-4">
                    <Leaf className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Model Organic Farms
                  </h3>
                  <p className="text-gray-700">
                    Operating our own organic farms as benchmarks for quality and live models for farmers to follow.
                  </p>
                </div>

              </div>
            </div>

            {/* Key Statistics */}
            <div className="bg-green-50 rounded-xl p-8 mb-12">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Impact</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="text-4xl font-bold text-green-600 mb-2">950</div>
                    <p className="text-gray-700">Hectares of Organic Certified Land in North-East India</p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-green-600 mb-2">ICS</div>
                    <p className="text-gray-700">Internal Control Systems across Multiple Regions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Our Network */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Building a Collaborative Network</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                We also operate our own organic farms, setting a benchmark for quality and giving farmers a live model to follow. 
                By inviting farmers from different regions to join our journey, we create a strong, collaborative network that shares knowledge, 
                improves yields, and ensures better livelihoods.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Every harvest we buy is more than just a transaction – it's a step towards protecting biodiversity, enriching rural communities, 
                and delivering safe, healthy food to the world. Together with our farmers, we are cultivating a greener future for generations to come.
              </p>
            </div>

            {/* Mission Statement */}
            <div className="bg-green-600 rounded-xl p-8 text-center text-white">
              <Globe2 className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Cultivating a Greener Future</h2>
              <p className="text-lg">
                Together with our farmers, we are protecting biodiversity, enriching rural communities, 
                and delivering safe, healthy food to the world.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}