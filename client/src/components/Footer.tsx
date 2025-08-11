import { Facebook, Twitter, Linkedin, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-green-600 text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">Bright Fame Organic</span>
              </div>
              <div>
                <h3 className="font-bold text-lg"><strong>Bright Fame Organic</strong></h3>
                <p className="text-xs text-green-200">Pvt. Ltd.</p>
              </div>
            </div>
            <p className="text-sm text-green-100 leading-relaxed">
              Your trusted partner for premium organic ingredients with comprehensive B2B solutions.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center hover:bg-green-800 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center hover:bg-green-800 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center hover:bg-green-800 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Products</h4>
            <ul className="space-y-2 text-sm text-green-100">
              <li><Link href="/ingredients/herbal-powders" className="hover:text-white transition-colors">Herbal Powders</Link></li>
              <li><Link href="/ingredients/liquid-extracts" className="hover:text-white transition-colors">Liquid Extracts</Link></li>
              <li><Link href="/ingredients/essential-oils" className="hover:text-white transition-colors">Essential Oils</Link></li>
              <li><Link href="/ingredients/raw-materials" className="hover:text-white transition-colors">Raw Materials</Link></li>
              <li><Link href="/ingredients/custom-blends" className="hover:text-white transition-colors">Custom Blends</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-green-100">
              <li><Link href="/services/quality-testing" className="hover:text-white transition-colors">Quality Testing</Link></li>
              <li><Link href="/services/rd-support" className="hover:text-white transition-colors">R&D Support</Link></li>
              <li><Link href="/services/regulatory-compliance" className="hover:text-white transition-colors">Regulatory Compliance</Link></li>
              <li><Link href="/services/custom-packaging" className="hover:text-white transition-colors">Custom Packaging</Link></li>
              <li><Link href="/services/logistics-solutions" className="hover:text-white transition-colors">Logistics Solutions</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Info</h4>
            <div className="space-y-3 text-sm text-green-100">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <div>
                  <p>C/O Bright Fame International</p>
                  <p>Opp. Murlidhar Guest House,</p>
                  <p>Mehsana-Vishnagar Road, Kansarakui</p>
                  <p>Mehsana, Gujarat 384001</p>
                  <p>India</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+91-7249847439</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>admin@bright-organic.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-green-500 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-green-100">
          <p>&copy; 2024 Bright Fame Organic Pvt. Ltd. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}