import { Facebook, Twitter, Linkedin, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-green-600 text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">BFI</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">BFI Organic</h3>
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
              <li><a href="#" className="hover:text-white transition-colors">Herbal Powders</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Liquid Extracts</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Essential Oils</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Raw Materials</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Custom Blends</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-green-100">
              <li><a href="#" className="hover:text-white transition-colors">Quality Testing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">R&D Support</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Regulatory Compliance</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Custom Packaging</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Logistics Solutions</a></li>
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
                <span>info@bfiorganic.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-green-500 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-green-100">
          <p>&copy; 2024 Bright Fame Organic Pvt. Ltd. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}