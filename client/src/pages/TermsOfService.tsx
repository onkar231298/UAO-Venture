import { useEffect } from "react";

export default function TermsOfService() {
  useEffect(() => {
    document.title = "Terms of Service - Bright Fame Organic";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By accessing and using the Bright Fame Organic website and platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Description of Service</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Bright Fame Organic provides a B2B platform for organic ingredients, facilitating product discovery, inquiries, quotations, and business transactions between suppliers and buyers in the organic ingredients industry.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">User Accounts and Eligibility</h2>
              
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Eligibility</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>You must be at least 18 years old to use this Service</li>
                <li>You must represent a legitimate business entity</li>
                <li>You must provide accurate and complete information</li>
                <li>You must comply with all applicable laws and regulations</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Account Security</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>You are responsible for maintaining account confidentiality</li>
                <li>You must notify us immediately of any unauthorized access</li>
                <li>You are liable for all activities under your account</li>
                <li>We reserve the right to suspend or terminate accounts</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Business Transactions</h2>
              
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Product Information</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We strive to provide accurate product information, but we do not guarantee the completeness or accuracy of product descriptions, specifications, or availability.
              </p>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Orders and Payments</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>All orders are subject to acceptance and availability</li>
                <li>Prices are subject to change without notice</li>
                <li>Payment terms are specified in individual agreements</li>
                <li>We reserve the right to refuse or cancel orders</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Shipping and Delivery</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Shipping terms, delivery times, and responsibilities are specified in individual sales agreements. Risk of loss transfers upon delivery to the carrier.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Acceptable Use</h2>
              
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Permitted Uses</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Legitimate business purposes related to organic ingredients</li>
                <li>Product research and inquiry submission</li>
                <li>Communication with BFI Organic representatives</li>
                <li>Accessing available resources and documentation</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Prohibited Activities</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Violating any applicable laws or regulations</li>
                <li>Impersonating others or providing false information</li>
                <li>Attempting to gain unauthorized access to systems</li>
                <li>Transmitting malicious code or harmful content</li>
                <li>Interfering with the operation of the Service</li>
                <li>Using the Service for competitive intelligence</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Intellectual Property</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The Service and its original content, features, and functionality are owned by Bright Fame Organic and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">User Content</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By submitting content to our Service, you grant us a non-exclusive, worldwide, royalty-free license to use, modify, and display such content for business purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Quality and Compliance</h2>
              
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Product Quality</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                All products meet applicable organic certification standards and quality specifications as detailed in product documentation and certificates.
              </p>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Regulatory Compliance</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Buyers are responsible for ensuring products comply with regulations in their jurisdiction. We provide available documentation to support compliance verification.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Disclaimers and Limitation of Liability</h2>
              
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Service Disclaimer</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The Service is provided "as is" without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or completely secure.
              </p>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Limitation of Liability</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                In no event shall Bright Fame Organic be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Termination</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Governing Law</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of significant changes by posting a notice on our website or sending an email notification.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Bright Fame International</strong><br />
                  Email: admin@bright-organic.com<br />
                  Address: [Your Business Address]<br />
                  Phone: [Your Contact Number]
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}