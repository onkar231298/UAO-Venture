import { useEffect } from "react";

export default function CookiePolicy() {
  useEffect(() => {
    document.title = "Cookie Policy - Cape NatureX Organic";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Cookie Policy</h1>
          
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">What Are Cookies?</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and analyzing how you use our site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Essential Cookies</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Authentication and session management</li>
                <li>Security and fraud prevention</li>
                <li>Load balancing and performance optimization</li>
                <li>Basic website functionality</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Functional Cookies</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These cookies enable enhanced functionality and personalization, such as remembering your preferences and choices.
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Language and region preferences</li>
                <li>Currency selection</li>
                <li>User interface preferences</li>
                <li>Form data retention</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Analytics Cookies</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Page views and user journeys</li>
                <li>Website performance metrics</li>
                <li>Error tracking and diagnostics</li>
                <li>User behavior analysis</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Security Cookies</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These cookies help protect our website and users from security threats and ensure platform integrity.
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>reCAPTCHA verification</li>
                <li>Fraud detection and prevention</li>
                <li>Rate limiting and abuse protection</li>
                <li>Security monitoring</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Third-Party Cookies</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may use third-party services that set their own cookies. These include:
              </p>
              
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Google Services</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>Google reCAPTCHA for security verification</li>
                <li>Google Analytics for website performance analysis</li>
                <li>Google Maps for location services</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Content Delivery Networks</h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>CDN services for faster content delivery</li>
                <li>Image optimization services</li>
                <li>Font and asset delivery</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Cookie Duration</h2>
              
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Session Cookies</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These cookies are temporary and are deleted when you close your browser. They are used for essential website functionality.
              </p>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Persistent Cookies</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These cookies remain on your device for a set period or until you delete them. They remember your preferences across visits.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Managing Cookies</h2>
              
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Browser Settings</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You can control and manage cookies through your browser settings. Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>View and delete existing cookies</li>
                <li>Block cookies from specific websites</li>
                <li>Block third-party cookies</li>
                <li>Clear all cookies when closing the browser</li>
                <li>Set notifications when cookies are being sent</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Impact of Disabling Cookies</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Please note that disabling certain cookies may affect the functionality of our website:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                <li>You may need to re-enter information repeatedly</li>
                <li>Some features may not work properly</li>
                <li>Your preferences may not be saved</li>
                <li>Security features may be compromised</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Browser-Specific Instructions</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Google Chrome</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Settings → Privacy and Security → Cookies and other site data
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Mozilla Firefox</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Options → Privacy & Security → Cookies and Site Data
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Safari</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Preferences → Privacy → Manage Website Data
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Microsoft Edge</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Settings → Cookies and site permissions → Cookies and site data
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Updates to This Policy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for legal compliance. We will notify you of any significant changes by posting the updated policy on our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about our use of cookies, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Cape NatureX Organic Pvt. Ltd.</strong><br />
                  Email: admin@bright-organic.com<br />
                  Address: Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui, Mehsana, Gujarat 384001<br />
                  Phone: +91-7249847439
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}