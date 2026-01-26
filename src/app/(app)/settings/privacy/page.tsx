"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PrivacySettings {
  profile_public: boolean;
  show_activity: boolean;
  allow_comments: boolean;
  show_favorites: boolean;
  show_followers: boolean;
  show_email: boolean;
}

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_public: true,
    show_activity: false,
    allow_comments: true,
    show_favorites: false,
    show_followers: true,
    show_email: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load settings from server
    async function loadSettings() {
      try {
        const res = await fetch("/api/user/preferences");
        if (res.ok) {
          const data = await res.json();
          setSettings({
            profile_public: data.profile_public ?? true,
            show_activity: data.show_activity ?? false,
            allow_comments: data.allow_comments ?? true,
            show_favorites: data.show_favorites ?? false,
            show_followers: data.show_followers ?? true,
            show_email: data.show_email ?? false,
          });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const updateSetting = async (key: keyof PrivacySettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    setSaving(true);

    try {
      await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      // Revert on error
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="px-4 pt-4 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/settings" className="w-10 h-10 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Privacy</h1>
        </div>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </main>
    );
  }

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
        {saving && (
          <span className="ml-auto text-sm text-gray-500">Saving...</span>
        )}
      </div>

      <div className="space-y-6">
        {/* Profile Visibility */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Profile Visibility</h2>
          <div className="bg-white rounded-xl overflow-hidden divide-y divide-gray-100">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">Public Profile</p>
                <p className="text-sm text-gray-500">Anyone can view your profile and public recipes. When off, only you can see your profile.</p>
              </div>
              <button
                onClick={() => updateSetting("profile_public")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.profile_public ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.profile_public ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">Show Activity Status</p>
                <p className="text-sm text-gray-500">Let others see when you were last active on your profile</p>
              </div>
              <button
                onClick={() => updateSetting("show_activity")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.show_activity ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.show_activity ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">Show Email Address</p>
                <p className="text-sm text-gray-500">Display your email on your public profile</p>
              </div>
              <button
                onClick={() => updateSetting("show_email")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.show_email ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.show_email ? "translate-x-5" : "translate-x-0"
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
                onClick={() => updateSetting("allow_comments")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.allow_comments ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.allow_comments ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">Show Favorites</p>
                <p className="text-sm text-gray-500">Let others see your public saved collections. You can also set individual collections as private.</p>
              </div>
              <button
                onClick={() => updateSetting("show_favorites")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.show_favorites ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.show_favorites ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">Show Followers</p>
                <p className="text-sm text-gray-500">Display your follower and following counts on your profile</p>
              </div>
              <button
                onClick={() => updateSetting("show_followers")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.show_followers ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.show_followers ? "translate-x-5" : "translate-x-0"
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
              Your privacy settings are synced to your account and apply across all devices.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
