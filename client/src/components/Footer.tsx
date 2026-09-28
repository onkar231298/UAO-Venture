import { Facebook, Twitter, Linkedin, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#294a2c] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#718b57] via-[#95b259] to-[#718b57]" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.9fr_1.15fr] lg:gap-12 lg:py-14">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex flex-col items-start gap-4">
              <div className="flex h-[70px] w-[220px] items-center rounded-md bg-[#fbfaf6] px-3">
                <img
                  src="/cape-naturex-logo.png"
                  alt="Cape NatureX Organic"
                  className="h-auto max-h-full w-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight"><strong>Cape NatureX Organic</strong></h3>
                <p className="text-xs text-[#c5d3b6]">Pvt. Ltd.</p>
              </div>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[#e0e7d7]">
              Your trusted partner for premium organic ingredients with comprehensive B2B solutions.
            </p>
            <div className="flex space-x-3">
              <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors hover:bg-[#718b57]">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Twitter" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors hover:bg-[#718b57]">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-colors hover:bg-[#718b57]">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#c5d3b6]">Products</h4>
            <ul className="space-y-2.5 text-sm text-[#e0e7d7]">
              <li><Link href="/ingredients/herbal-powders" className="hover:text-white transition-colors">Herbal Powders</Link></li>
              <li><Link href="/ingredients/liquid-extracts" className="hover:text-white transition-colors">Liquid Extracts</Link></li>
              <li><Link href="/ingredients/essential-oils" className="hover:text-white transition-colors">Essential Oils</Link></li>
              <li><Link href="/ingredients/raw-materials" className="hover:text-white transition-colors">Raw Materials</Link></li>
              <li><Link href="/ingredients/custom-blends" className="hover:text-white transition-colors">Custom Blends</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#c5d3b6]">Services</h4>
            <ul className="space-y-2.5 text-sm text-[#e0e7d7]">
              <li><Link href="/services/quality-testing" className="hover:text-white transition-colors">Quality Testing</Link></li>
              <li><Link href="/services/rd-support" className="hover:text-white transition-colors">R&D Support</Link></li>
              <li><Link href="/services/regulatory-compliance" className="hover:text-white transition-colors">Regulatory Compliance</Link></li>
              <li><Link href="/services/custom-packaging" className="hover:text-white transition-colors">Custom Packaging</Link></li>
              <li><Link href="/services/logistics-solutions" className="hover:text-white transition-colors">Logistics Solutions</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#c5d3b6]">Contact Info</h4>
            <div className="space-y-3 text-sm text-[#e0e7d7]">
              <div className="flex items-start space-x-2">
                <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-[#95b259]" />
                <div>
                  <p>Opp. Murlidhar Guest House,</p>
                  <p>Mehsana-Vishnagar Road, Kansarakui</p>
                  <p>Mehsana, Gujarat 384001</p>
                  <p>India</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-[#95b259]" />
                <span>+91-7249847439</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-[#95b259]" />
                <span>admin@bright-organic.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/15 py-6 text-sm text-[#d4ddca] md:flex-row">
          <p>&copy; 2024 Cape NatureX Organic Pvt. Ltd. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}