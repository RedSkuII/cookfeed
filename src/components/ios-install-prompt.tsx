"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "cookfeed-ios-install-dismissed";

export function IOSInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on iOS Safari when NOT already running as standalone PWA
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true;
    const dismissed = localStorage.getItem(DISMISS_KEY);

    if (isIOS && !isStandalone && !dismissed) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-2 right-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 safe-area-bottom animate-in slide-in-from-bottom">
      <button
        onClick={dismiss}
        className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-xl leading-none"
        aria-label="Dismiss"
      >
        &times;
      </button>
      <div className="flex items-start gap-3 pr-4">
        <div className="text-3xl shrink-0">🍳</div>
        <div>
          <p className="font-bold text-gray-900 text-sm">Install CookFeed</p>
          <p className="text-xs text-gray-500 mt-1">
            Tap the <span className="inline-flex items-center">
              <svg className="w-4 h-4 inline text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </span> Share button, then <strong>&quot;Add to Home Screen&quot;</strong> to install CookFeed as an app.
          </p>
        </div>
      </div>
    </div>
  );
}
