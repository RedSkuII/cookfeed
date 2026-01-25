import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-linear-to-br from-primary-400 to-primary-600 rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-5xl">🍳</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">
          CookFeed
        </h1>
        <p className="text-lg text-gray-600 text-center mb-8 max-w-sm">
          Your personal recipe book & feed. Save, organize, and share your favorite recipes.
        </p>

        {/* Auth Buttons */}
        <div className="w-full max-w-sm space-y-4">
          <Link href="/auth/signup" className="btn-primary w-full block text-center">
            Get Started
          </Link>
          <Link href="/auth/login" className="btn-outline w-full block text-center">
            Log In
          </Link>
        </div>

        {/* Features Preview */}
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-sm w-full">
          <div className="text-center">
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-xs text-gray-600">Save Recipes</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-xs text-gray-600">Find Easily</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-xs text-gray-600">Share & Follow</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>Made with ❤️ for home cooks</p>
      </footer>
    </main>
  );
}
