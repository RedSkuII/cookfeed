import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-8 bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/settings" className="w-10 h-10 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
      </div>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          Last updated: January 25, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
          <p className="text-gray-700 mb-3">
            When you use CookFeed, we may collect the following information:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li><strong>Account Information:</strong> Email address, name, and profile photo (when using Google Sign-In)</li>
            <li><strong>Recipe Data:</strong> Recipes you create, including ingredients, steps, and photos</li>
            <li><strong>Usage Data:</strong> How you interact with the app (pages visited, features used)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
          <p className="text-gray-700 mb-3">We use your information to:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Provide and improve the CookFeed service</li>
            <li>Store and sync your recipes across devices</li>
            <li>Enable social features like sharing and following</li>
            <li>Send important service updates</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Storage</h2>
          <p className="text-gray-700">
            Your recipe data is currently stored locally on your device using browser storage. 
            We do not transfer your personal recipes to external servers without your explicit consent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Third-Party Services</h2>
          <p className="text-gray-700 mb-3">
            We use the following third-party services:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li><strong>Google Sign-In:</strong> For authentication (subject to Google&apos;s Privacy Policy)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Your Rights</h2>
          <p className="text-gray-700 mb-3">You have the right to:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Access your personal data</li>
            <li>Delete your account and associated data</li>
            <li>Export your recipes</li>
            <li>Opt out of non-essential data collection</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Security</h2>
          <p className="text-gray-700">
            We implement appropriate security measures to protect your data. 
            However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contact Us</h2>
          <p className="text-gray-700">
            If you have questions about this Privacy Policy, please contact us at privacy@cookfeed.app
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Changes to This Policy</h2>
          <p className="text-gray-700">
            We may update this Privacy Policy from time to time. We will notify you of any 
            significant changes by posting a notice in the app.
          </p>
        </section>
      </div>
    </main>
  );
}
