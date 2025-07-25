import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Leaf, Award, Microscope, Beaker } from 'lucide-react';

export default function ParallaxHero() {
  const [scrollY, setScrollY] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const slides = [
    {
      title: "Nature Meets Innovation",
      subtitle: "Certified, Traceable, and High-Performance Extracts & Powders for Food, Pharma, and Wellness Applications.",
      accent: "at Bright Fame Organics"
    },
    {
      title: "Premium Organic Ingredients",
      subtitle: "From Ashwagandha to Turmeric - sourced directly from certified organic farms with complete traceability.",
      accent: "for Global Markets"
    },
    {
      title: "Research-Driven Quality",
      subtitle: "State-of-the-art R&D facilities ensuring every batch meets the highest international standards.",
      accent: "with Scientific Excellence"
    }
  ];

  return (
    <div className="relative h-screen overflow-hidden bg-gradient-to-br from-green-50 via-amber-50 to-emerald-100">
      {/* Animated Background SVG */}
      <div className="absolute inset-0 w-full h-full">
        <svg 
          viewBox="0 0 1920 1080" 
          className="w-full h-full object-cover"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        >
          {/* Sky Layer with Gradient */}
          <defs>
            <linearGradient id="skyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#98FB98" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#F0FFF0" stopOpacity="0.1" />
            </linearGradient>
            
            <linearGradient id="labGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="0.05" />
            </linearGradient>

            <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
            </radialGradient>

            {/* Molecular pattern */}
            <pattern id="moleculePattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="3" fill="#10b981" opacity="0.2">
                <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite"/>
              </circle>
              <circle cx="80" cy="60" r="2" fill="#059669" opacity="0.3">
                <animate attributeName="opacity" values="0.3;0.5;0.3" dur="4s" repeatCount="indefinite"/>
              </circle>
              <line x1="20" y1="20" x2="80" y2="60" stroke="#065f46" strokeWidth="1" opacity="0.1"/>
            </pattern>
          </defs>

          {/* Sky Background */}
          <rect width="1920" height="1080" fill="url(#skyGradient)" />

          {/* Floating Organic Certifications */}
          <g opacity="0.4">
            <circle cx="200" cy="150" r="40" fill="#22c55e" opacity="0.2">
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0,0; 10,-5; 0,0" 
                dur="6s" 
                repeatCount="indefinite"
              />
            </circle>
            <text x="200" y="155" textAnchor="middle" fontSize="12" fill="#166534" fontWeight="bold">USDA</text>
            
            <circle cx="1600" cy="200" r="35" fill="#10b981" opacity="0.2">
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0,0; -8,3; 0,0" 
                dur="7s" 
                repeatCount="indefinite"
              />
            </circle>
            <text x="1600" y="205" textAnchor="middle" fontSize="11" fill="#064e3b" fontWeight="bold">EU ORG</text>

            <circle cx="1400" cy="120" r="30" fill="#059669" opacity="0.2">
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0,0; 5,8; 0,0" 
                dur="8s" 
                repeatCount="indefinite"
              />
            </circle>
            <text x="1400" y="125" textAnchor="middle" fontSize="10" fill="#065f46" fontWeight="bold">NOP</text>
          </g>

          {/* Background Lab Silhouette */}
          <g opacity="0.1" transform="translate(1200, 600)">
            <rect x="0" y="0" width="400" height="200" fill="url(#labGradient)" rx="10"/>
            <circle cx="80" cy="60" r="25" fill="#1e40af" opacity="0.3"/>
            <rect x="200" y="40" width="15" height="80" fill="#1e40af" opacity="0.4"/>
            <rect x="250" y="50" width="20" height="70" fill="#1e40af" opacity="0.3"/>
          </g>

          {/* Molecular Background Pattern */}
          <rect width="1920" height="1080" fill="url(#moleculePattern)" opacity="0.3"/>

          {/* Light Rays */}
          <g opacity="0.2">
            <polygon 
              points="0,0 300,200 250,300 0,100" 
              fill="url(#glowGradient)"
              transform="rotate(-15)"
            >
              <animateTransform 
                attributeName="transform" 
                type="rotate" 
                values="-15; -10; -15" 
                dur="10s" 
                repeatCount="indefinite"
              />
            </polygon>
          </g>

          {/* Midground - Floating Category Bubbles */}
          <g opacity="0.8">
            {/* Herbs Bubble */}
            <circle cx="400" cy="400" r="60" fill="#22c55e" opacity="0.3">
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0,0; 0,-10; 0,0" 
                dur="4s" 
                repeatCount="indefinite"
              />
            </circle>
            <text x="400" y="405" textAnchor="middle" fontSize="14" fill="#166534" fontWeight="bold">Herbs</text>

            {/* Extracts Bubble */}
            <circle cx="800" cy="350" r="55" fill="#f59e0b" opacity="0.3">
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0,0; 5,-8; 0,0" 
                dur="5s" 
                repeatCount="indefinite"
              />
            </circle>
            <text x="800" y="355" textAnchor="middle" fontSize="13" fill="#92400e" fontWeight="bold">Extracts</text>

            {/* Nutra Bubble */}
            <circle cx="1200" cy="380" r="50" fill="#8b5cf6" opacity="0.3">
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0,0; -3,7; 0,0" 
                dur="6s" 
                repeatCount="indefinite"
              />
            </circle>
            <text x="1200" y="385" textAnchor="middle" fontSize="12" fill="#6b21a8" fontWeight="bold">Nutra</text>

            {/* Spices Bubble */}
            <circle cx="600" cy="500" r="45" fill="#ef4444" opacity="0.3">
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0,0; 8,5; 0,0" 
                dur="7s" 
                repeatCount="indefinite"
              />
            </circle>
            <text x="600" y="505" textAnchor="middle" fontSize="11" fill="#991b1b" fontWeight="bold">Spices</text>

            {/* Food Ingredients Bubble */}
            <circle cx="1000" cy="480" r="40" fill="#06b6d4" opacity="0.3">
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0,0; -6,-4; 0,0" 
                dur="5.5s" 
                repeatCount="indefinite"
              />
            </circle>
            <text x="1000" y="480" textAnchor="middle" fontSize="10" fill="#0e7490" fontWeight="bold">Food</text>
            <text x="1000" y="492" textAnchor="middle" fontSize="10" fill="#0e7490" fontWeight="bold">Ingredients</text>
          </g>

          {/* 3D Spice Bowl Center */}
          <g transform="translate(960, 450)" opacity="0.9">
            <ellipse cx="0" cy="20" rx="80" ry="15" fill="#8b4513" opacity="0.4"/>
            <ellipse cx="0" cy="0" rx="70" ry="35" fill="#d2691e" opacity="0.8"/>
            
            {/* Spices in bowl */}
            <circle cx="-20" cy="-5" r="8" fill="#ffb347">
              <animate attributeName="cy" values="-5;-8;-5" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="15" cy="-3" r="6" fill="#8b4513">
              <animate attributeName="cy" values="-3;-6;-3" dur="4s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="-8" r="5" fill="#ff6347">
              <animate attributeName="cy" values="-8;-11;-8" dur="2.5s" repeatCount="indefinite"/>
            </circle>
            
            {/* Rising aroma particles */}
            <g opacity="0.6">
              <circle cx="-10" cy="-40" r="2" fill="#fbbf24">
                <animate attributeName="cy" values="-40;-80;-40" dur="4s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.6;0;0.6" dur="4s" repeatCount="indefinite"/>
              </circle>
              <circle cx="10" cy="-50" r="1.5" fill="#f59e0b">
                <animate attributeName="cy" values="-50;-90;-50" dur="5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.6;0;0.6" dur="5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="0" cy="-60" r="1" fill="#d97706">
                <animate attributeName="cy" values="-60;-100;-60" dur="3.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.6;0;0.6" dur="3.5s" repeatCount="indefinite"/>
              </circle>
            </g>
          </g>

          {/* Foreground Herbs - Left Side */}
          <g transform="translate(100, 600)" opacity="0.8">
            {/* Ashwagandha plant */}
            <path d="M0,200 Q20,150 40,100 Q30,80 50,60" stroke="#22c55e" strokeWidth="4" fill="none">
              <animateTransform 
                attributeName="transform" 
                type="rotate" 
                values="0 25 130; 3 25 130; 0 25 130" 
                dur="6s" 
                repeatCount="indefinite"
              />
            </path>
            <ellipse cx="45" cy="70" rx="15" ry="8" fill="#16a34a" opacity="0.7">
              <animateTransform 
                attributeName="transform" 
                type="rotate" 
                values="0 45 70; 5 45 70; 0 45 70" 
                dur="6s" 
                repeatCount="indefinite"
              />
            </ellipse>
            
            {/* Dew drops */}
            <circle cx="50" cy="75" r="2" fill="#38bdf8" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3s" repeatCount="indefinite"/>
            </circle>
          </g>

          {/* Foreground Herbs - Right Side */}
          <g transform="translate(1700, 650)" opacity="0.8">
            {/* Tulsi plant */}
            <path d="M0,150 Q-20,120 -10,90 Q-5,70 -25,50" stroke="#059669" strokeWidth="3" fill="none">
              <animateTransform 
                attributeName="transform" 
                type="rotate" 
                values="0 -12 100; -3 -12 100; 0 -12 100" 
                dur="7s" 
                repeatCount="indefinite"
              />
            </path>
            <ellipse cx="-20" cy="60" rx="12" ry="6" fill="#065f46" opacity="0.7">
              <animateTransform 
                attributeName="transform" 
                type="rotate" 
                values="0 -20 60; -4 -20 60; 0 -20 60" 
                dur="7s" 
                repeatCount="indefinite"
              />
            </ellipse>

            {/* Flying bee */}
            <circle cx="-40" cy="40" r="3" fill="#fbbf24">
              <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0,0; -20,-10; 0,0; 15,5; 0,0" 
                dur="8s" 
                repeatCount="indefinite"
              />
            </circle>
          </g>
        </svg>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex items-center justify-center h-full text-center px-4">
        <div className="max-w-4xl mx-auto">
          {/* Main Content */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-4">
              <span className="block">{slides[currentSlide].title}</span>
              <span className="block text-3xl md:text-4xl text-green-600 font-normal mt-2">
                {slides[currentSlide].accent}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {slides[currentSlide].subtitle}
            </p>
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Explore Our Products
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            
            {/* Feature Icons */}
            <div className="flex justify-center items-center space-x-8 mt-8 text-gray-600">
              <div className="flex items-center space-x-2">
                <Award className="w-6 h-6 text-yellow-600" />
                <span className="text-sm font-medium">Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Leaf className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium">100% Organic</span>
              </div>
              <div className="flex items-center space-x-2">
                <Microscope className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium">Lab Tested</span>
              </div>
              <div className="flex items-center space-x-2">
                <Beaker className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-medium">Research Driven</span>
              </div>
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center space-x-2 mt-12">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-green-600 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}