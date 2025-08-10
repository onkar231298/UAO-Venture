import { useEffect } from "react";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy - Bright Fame Organic";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Introduction</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Bright Fame International ("Bright Fame Organic", "we", "us", or "our") operates the Bright Fame Organic website and B2B platform for organic ingredients. This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Personal Information</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Name and contact information (email, phone number, address)</li>
                <li>Company details and business information</li>
                <li>Account credentials and authentication data</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Business Information</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Product inquiries and purchase requirements</li>
                <li>Order history and transaction data</li>
                <li>Communication records and support interactions</li>
                <li>Usage patterns and preferences</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Technical Information</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>IP address and location data for currency detection</li>
                <li>Device information and browser details</li>
                <li>Website usage analytics and interaction data</li>
                <li>Security verification data (reCAPTCHA)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Processing and fulfilling your orders and inquiries</li>
                <li>Providing customer support and technical assistance</li>
                <li>Communicating about products, services, and business opportunities</li>
                <li>Personalizing your experience and improving our services</li>
                <li>Ensuring platform security and preventing fraud</li>
                <li>Complying with legal obligations and business requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Information Sharing</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>With your explicit consent</li>
                <li>To trusted service providers who assist in operating our business</li>
                <li>When required by law or to protect our legal rights</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Data Security</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Secure data transmission using encryption protocols</li>
                <li>Access controls and authentication systems</li>
                <li>Regular security assessments and updates</li>
                <li>Employee training on data protection practices</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Your Rights</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Access and review your personal information</li>
                <li>Request corrections to inaccurate data</li>
                <li>Request deletion of your personal information</li>
                <li>Object to processing of your personal information</li>
                <li>Request data portability</li>
                <li>Withdraw consent where applicable</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Cookies and Tracking</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our website uses cookies and similar technologies to enhance your browsing experience, analyze website traffic, and provide personalized content. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">International Transfers</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                As we operate globally, your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data during such transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Changes to This Policy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Bright Fame International</strong><br />
                  Email: privacy@brightfameorganic.com<br />
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