import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo Circle */}
        <div className="w-28 h-28 rounded-full bg-linear-to-br from-brand-500 via-brand-300 to-brand-secondary-500 mb-6 shadow-lg" />

        {/* Title */}
        <h1 className="text-2xl font-black text-gray-900 leading-tight mb-3 text-center">
          Your Recipes,<br />Shared with Love
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed max-w-xs px-2">
          Cook, share, and discover recipes from a community of home chefs who care about real food.
        </p>

        {/* CTA Button */}
        <Link
          href="/auth/signup"
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm px-8 py-3 rounded-full shadow-lg transition-colors mb-3"
        >
          Get Started Free
        </Link>
        <p className="text-xs text-gray-400 mb-8">No credit card required</p>

        {/* Feature Cards */}
        <div className="space-y-3 max-w-sm w-full mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Save & Organize</p>
              <p className="text-xs text-gray-500 mt-0.5">Keep all your recipes in one place, tagged and searchable.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-secondary-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Community</p>
              <p className="text-xs text-gray-500 mt-0.5">Follow home cooks, share tips, and discover new flavors.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Cook Mode</p>
              <p className="text-xs text-gray-500 mt-0.5">Step-by-step view keeps your screen on while you cook.</p>
            </div>
          </div>
        </div>

        {/* Log In Link */}
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-brand-500 font-semibold">Log In</Link>
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-brand-200 py-4 text-center">
        <p className="text-xs text-gray-400">Made with warmth by the CookFeed team</p>
        <div className="flex justify-center gap-4 mt-2">
          <span className="text-xs text-gray-500">About</span>
          <span className="text-xs text-gray-500">Privacy</span>
          <span className="text-xs text-gray-500">Terms</span>
        </div>
      </footer>
    </main>
  );
}
