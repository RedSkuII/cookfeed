"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState({
    pushEnabled: false,
    newRecipes: true,
    likes: true,
    comments: true,
    followers: true,
    weeklyDigest: false,
  });

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem("cookfeed_notification_settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const updateSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem("cookfeed_notification_settings", JSON.stringify(newSettings));
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
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
      </div>

      <div className="space-y-6">
        {/* Push Notifications */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Push Notifications</h2>
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">Enable Push Notifications</p>
                <p className="text-sm text-gray-500">Receive notifications on your device</p>
              </div>
              <button
                onClick={() => updateSetting("pushEnabled")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.pushEnabled ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.pushEnabled ? "translate-x-5" : "translate-x-0.5"
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
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">New Recipes</p>
                <p className="text-sm text-gray-500">When people you follow post new recipes</p>
              </div>
              <button
                onClick={() => updateSetting("newRecipes")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.newRecipes ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.newRecipes ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">Likes</p>
                <p className="text-sm text-gray-500">When someone likes your recipe</p>
              </div>
              <button
                onClick={() => updateSetting("likes")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.likes ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.likes ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">Comments</p>
                <p className="text-sm text-gray-500">When someone comments on your recipe</p>
              </div>
              <button
                onClick={() => updateSetting("comments")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.comments ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.comments ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">New Followers</p>
                <p className="text-sm text-gray-500">When someone starts following you</p>
              </div>
              <button
                onClick={() => updateSetting("followers")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.followers ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.followers ? "translate-x-5" : "translate-x-0.5"
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
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-gray-900">Weekly Digest</p>
                <p className="text-sm text-gray-500">Get a summary of trending recipes</p>
              </div>
              <button
                onClick={() => updateSetting("weeklyDigest")}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  settings.weeklyDigest ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.weeklyDigest ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
