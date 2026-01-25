"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState({
    profilePublic: true,
    showActivity: true,
    allowComments: true,
    showFavorites: false,
    showFollowers: true,
  });

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem("cookfeed_privacy_settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const updateSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem("cookfeed_privacy_settings", JSON.stringify(newSettings));
  };

  return (
    <main className="px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings" className="w-10 h-10 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Privacy</h1>
      </div>

      <div className="space-y-6">
        {/* Profile Visibility */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Profile Visibility</h2>
          <div className="bg-white rounded-xl overflow-hidden divide-y divide-gray-100">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">Public Profile</p>
                <p className="text-sm text-gray-500">Anyone can view your profile and recipes</p>
              </div>
              <button
                onClick={() => updateSetting("profilePublic")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.profilePublic ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.profilePublic ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">Show Activity Status</p>
                <p className="text-sm text-gray-500">Let others see when you were last active</p>
              </div>
              <button
                onClick={() => updateSetting("showActivity")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.showActivity ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.showActivity ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Interactions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Interactions</h2>
          <div className="bg-white rounded-xl overflow-hidden divide-y divide-gray-100">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">Allow Comments</p>
                <p className="text-sm text-gray-500">Let others comment on your recipes</p>
              </div>
              <button
                onClick={() => updateSetting("allowComments")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.allowComments ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.allowComments ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">Show Favorites</p>
                <p className="text-sm text-gray-500">Let others see recipes you&apos;ve favorited</p>
              </div>
              <button
                onClick={() => updateSetting("showFavorites")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.showFavorites ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.showFavorites ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">Show Followers</p>
                <p className="text-sm text-gray-500">Display your follower and following counts</p>
              </div>
              <button
                onClick={() => updateSetting("showFollowers")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.showFollowers ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.showFollowers ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Data</h2>
          <div className="bg-white rounded-xl overflow-hidden divide-y divide-gray-100">
            <Link href="/privacy" className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <p className="font-medium text-gray-900">Privacy Policy</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/terms" className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <p className="font-medium text-gray-900">Terms of Service</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700">
              Your privacy settings are stored locally on your device. Changes take effect immediately.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
