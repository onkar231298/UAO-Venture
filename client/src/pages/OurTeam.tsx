import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Award, Target, Lightbulb } from "lucide-react";

export default function OurTeam() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Our Leadership Team
            </h1>
            <p className="text-xl opacity-90 mb-8">
              At Bright Fame Organic, our strength lies in the vision, dedication, and expertise of our leadership team. 
              Each member brings a unique set of skills and years of industry experience, driving our mission to deliver 
              the highest-quality organic and natural ingredients worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            
            {/* Section Header */}
            <div className="text-center mb-12">
              <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Directors</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Our leadership team combines decades of experience in organic agriculture, food technology, 
                and business management to drive innovation and excellence in everything we do.
              </p>
            </div>

            {/* Team Members - Alternating Layout */}
            <div className="space-y-16 mb-16">
              
              {/* Dr. Niraj Patel - Left aligned */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-1 md:order-1">
                  <div className="w-48 h-48 bg-gray-200 rounded-2xl mx-auto md:mx-0 flex items-center justify-center shadow-lg">
                    <Users className="w-24 h-24 text-gray-400" />
                  </div>
                </div>
                <div className="order-2 md:order-2">
                  <Badge variant="outline" className="mb-4 bg-green-50 text-green-700 border-green-200 px-4 py-2">
                    Managing Director
                  </Badge>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Dr. Niraj Patel</h3>
                  <div className="flex items-center space-x-2 mb-4">
                    <Target className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">Strategic Vision & Leadership</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                    A young, dynamic, and self-made entrepreneur, Dr. Niraj Patel has built Bright Fame Organic from the ground up 
                    without any family business background. With an MS in Orthopedics, he made an inspiring transition into the food 
                    and spice industry in 1998, eventually becoming one of the most recognized figures in the sector.
                  </p>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    Known for his calm demeanor and strategic mindset, Dr. Niraj is often called "the man with future eyes" at 
                    Bright Fame Organic, guiding the company with innovative vision and leadership.
                  </p>
                </div>
              </div>

              {/* Ujjwal Dadhich - Right aligned */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-1 md:order-2">
                  <div className="w-48 h-48 bg-gray-200 rounded-2xl mx-auto md:mx-0 flex items-center justify-center shadow-lg">
                    <Users className="w-24 h-24 text-gray-400" />
                  </div>
                </div>
                <div className="order-2 md:order-1">
                  <Badge variant="outline" className="mb-4 bg-blue-50 text-blue-700 border-blue-200 px-4 py-2">
                    Director of Purchase
                  </Badge>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Ujjwal Dadhich</h3>
                  <div className="flex items-center space-x-2 mb-4">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-600 font-medium">Supply Chain Excellence</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                    With an extensive career in the Indian food and ingredients industry, Ujjwal Dadhich has worked with some of 
                    the country's most renowned companies before joining Bright Fame Organic. As Director of Purchase, he brings 
                    unmatched sourcing expertise and strong relationships across APMC markets and organic farming groups nationwide.
                  </p>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    Respected for his quiet leadership style and innovative ideas, Ujjwal plays a pivotal role in ensuring our 
                    supply chain remains strong, ethical, and efficient.
                  </p>
                </div>
              </div>

              {/* Onkar Suryawanshi - Left aligned */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-1 md:order-1">
                  <div className="w-48 h-48 bg-gray-200 rounded-2xl mx-auto md:mx-0 flex items-center justify-center shadow-lg">
                    <Users className="w-24 h-24 text-gray-400" />
                  </div>
                </div>
                <div className="order-2 md:order-2">
                  <Badge variant="outline" className="mb-4 bg-purple-50 text-purple-700 border-purple-200 px-4 py-2">
                    Director of Operations
                  </Badge>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Onkar Suryawanshi</h3>
                  <div className="flex items-center space-x-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-600 font-medium">Technology Innovation</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                    A qualified Food Technologist and technology enthusiast, Onkar Suryawanshi began his career at a young age, 
                    driven by a deep passion for food safety, certifications, and advanced processing technologies. As President 
                    of the NGO GSRL Foundation, he works to bridge the gap between industry and education.
                  </p>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    He mentors students in Food Technology and Dairy Technology and is actively involved in training farmers in 
                    organic agriculture practices. Onkar has published multiple research papers in his field.
                  </p>
                </div>
              </div>

              {/* Kamal Patel - Right aligned */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-1 md:order-2">
                  <div className="w-48 h-48 bg-gray-200 rounded-2xl mx-auto md:mx-0 flex items-center justify-center shadow-lg">
                    <Users className="w-24 h-24 text-gray-400" />
                  </div>
                </div>
                <div className="order-2 md:order-1">
                  <Badge variant="outline" className="mb-4 bg-orange-50 text-orange-700 border-orange-200 px-4 py-2">
                    Director of Supply Chain
                  </Badge>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Mr. Kamal Patel</h3>
                  <div className="flex items-center space-x-2 mb-4">
                    <Target className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-600 font-medium">Global Logistics Excellence</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                    With extensive experience in shipping, logistics, and international trade documentation, Mr. Kamal Patel ensures 
                    that Bright Fame Organic's products reach global markets with efficiency, compliance, and care. His deep knowledge 
                    of customs regulations, freight operations, and export procedures helps the company maintain a seamless, timely, 
                    and cost-effective supply chain.
                  </p>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    Known as "the smiling problem solver", Kamal handles challenges with remarkable ease and a positive attitude, 
                    ensuring that even complex situations are resolved smoothly. His ability to manage heavy workloads effortlessly, 
                    combined with his commitment to precision, makes him an invaluable asset in delivering our promise of quality 
                    from farm to customer.
                  </p>
                </div>
              </div>

            </div>

            {/* Company Values */}
            <div className="bg-green-50 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Leadership Philosophy</h3>
              <p className="text-lg text-gray-700 max-w-4xl mx-auto">
                Our directors share a common commitment to innovation, quality, and sustainable practices. Together, they have 
                built Bright Fame Organic into a trusted partner for businesses worldwide, ensuring that every product meets 
                the highest standards of purity, safety, and excellence.
              </p>
            </div>

          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}