"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface NotificationSettings {
  push_enabled: boolean;
  notify_new_recipes: boolean;
  notify_likes: boolean;
  notify_comments: boolean;
  notify_followers: boolean;
  weekly_digest: boolean;
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    push_enabled: true,
    notify_new_recipes: true,
    notify_likes: true,
    notify_comments: true,
    notify_followers: true,
    weekly_digest: true,
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
            push_enabled: data.push_enabled ?? true,
            notify_new_recipes: data.notify_new_recipes ?? true,
            notify_likes: data.notify_likes ?? true,
            notify_comments: data.notify_comments ?? true,
            notify_followers: data.notify_followers ?? true,
            weekly_digest: data.weekly_digest ?? true,
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

  const updateSetting = async (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    const prevSettings = { ...settings };
    setSettings(newSettings);
    setSaving(true);

    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (!res.ok) {
        setSettings(prevSettings);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      // Revert on error
      setSettings(prevSettings);
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
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {saving && (
          <span className="ml-auto text-sm text-gray-500">Saving...</span>
        )}
      </div>

      <div className="space-y-6">
        {/* Push Notifications */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Push Notifications</h2>
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Enable Push Notifications</p>
                <p className="text-sm text-gray-500">Receive notifications on your device</p>
              </div>
              <button
                onClick={() => updateSetting("push_enabled")}
                className={`relative w-12 h-7 shrink-0 rounded-full overflow-hidden transition-colors ${
                  settings.push_enabled ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.push_enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Activity Notifications */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Activity</h2>
          <div className="bg-white rounded-xl overflow-hidden divide-y divide-gray-100">
            <div className="flex items-center justify-between p-4 gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">New Recipes</p>
                <p className="text-sm text-gray-500">When people you follow post new recipes</p>
              </div>
              <button
                onClick={() => updateSetting("notify_new_recipes")}
                className={`relative w-12 h-7 shrink-0 rounded-full overflow-hidden transition-colors ${
                  settings.notify_new_recipes ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.notify_new_recipes ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Likes</p>
                <p className="text-sm text-gray-500">When someone likes your recipe</p>
              </div>
              <button
                onClick={() => updateSetting("notify_likes")}
                className={`relative w-12 h-7 shrink-0 rounded-full overflow-hidden transition-colors ${
                  settings.notify_likes ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.notify_likes ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Comments</p>
                <p className="text-sm text-gray-500">When someone comments on your recipe</p>
              </div>
              <button
                onClick={() => updateSetting("notify_comments")}
                className={`relative w-12 h-7 shrink-0 rounded-full overflow-hidden transition-colors ${
                  settings.notify_comments ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.notify_comments ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">New Followers</p>
                <p className="text-sm text-gray-500">When someone starts following you</p>
              </div>
              <button
                onClick={() => updateSetting("notify_followers")}
                className={`relative w-12 h-7 shrink-0 rounded-full overflow-hidden transition-colors ${
                  settings.notify_followers ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.notify_followers ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Email</h2>
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Weekly Digest</p>
                <p className="text-sm text-gray-500">Get a summary of trending recipes every week</p>
              </div>
              <button
                onClick={() => updateSetting("weekly_digest")}
                className={`relative w-12 h-7 shrink-0 rounded-full overflow-hidden transition-colors ${
                  settings.weekly_digest ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.weekly_digest ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          {settings.weekly_digest && (
            <p className="mt-2 text-sm text-green-600 px-1">
              ✓ You&apos;ll receive weekly recipe digests at your email
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
