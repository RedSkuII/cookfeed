import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-8 bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/settings" className="w-10 h-10 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
      </div>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          Last updated: January 25, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-700">
            By accessing and using CookFeed, you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Use of Service</h2>
          <p className="text-gray-700">
            CookFeed is a personal recipe management application. You may use the service to:
          </p>
          <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
            <li>Store and organize your personal recipes</li>
            <li>Share recipes with other users (if made public)</li>
            <li>Browse and save recipes from other users</li>
            <li>Customize your cooking experience</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Content</h2>
          <p className="text-gray-700">
            You retain ownership of all recipes and content you create. By posting content publicly, 
            you grant CookFeed a license to display that content to other users.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Privacy</h2>
          <p className="text-gray-700">
            Your privacy is important to us. Please review our{" "}
            <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>{" "}
            to understand how we collect and use your information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Prohibited Activities</h2>
          <p className="text-gray-700">You agree not to:</p>
          <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
            <li>Post harmful, offensive, or inappropriate content</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on the intellectual property rights of others</li>
            <li>Attempt to compromise the security of the service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Contact</h2>
          <p className="text-gray-700">
            If you have questions about these terms, please contact us at support@cookfeed.app
          </p>
        </section>
      </div>
    </main>
  );
}
