"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/providers";

const themes = [
  {
    id: "default",
    name: "Sunrise",
    primary: "#ee751d",
    secondary: "#539657",
    bg: "#FFF8F0",
  },
  {
    id: "ocean",
    name: "Ocean",
    primary: "#2563eb",
    secondary: "#0d9488",
    bg: "#F0F7FF",
  },
  {
    id: "berry",
    name: "Berry",
    primary: "#9333ea",
    secondary: "#e11d48",
    bg: "#FBF5FF",
  },
  {
    id: "forest",
    name: "Forest",
    primary: "#059669",
    secondary: "#d97706",
    bg: "#F5FAF0",
  },
  {
    id: "sunset",
    name: "Sunset",
    primary: "#e11d48",
    secondary: "#ca8a04",
    bg: "#FFF5F2",
  },
  {
    id: "lavender",
    name: "Lavender",
    primary: "#6366f1",
    secondary: "#8b5cf6",
    bg: "#F5F3FF",
  },
];

export default function ThemeSettingsPage() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [selected, setSelected] = useState(currentTheme);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(currentTheme);
  }, [currentTheme]);

  const selectTheme = async (themeId: string) => {
    setSelected(themeId);
    setTheme(themeId);
    setSaving(true);

    try {
      // First get current preferences
      const res = await fetch("/api/user/preferences");
      if (res.ok) {
        const prefs = await res.json();
        // Save with updated theme
        await fetch("/api/user/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...prefs, color_theme: themeId }),
        });
      }
    } catch (error) {
      console.error("Failed to save theme:", error);
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Theme</h1>
        {saving && (
          <span className="ml-auto text-sm text-gray-500">Saving...</span>
        )}
      </div>

      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Choose Your Colors</p>

      {/* Theme Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => selectTheme(t.id)}
            className={`bg-white rounded-2xl overflow-hidden text-left transition-all ${
              selected === t.id
                ? "ring-3 ring-primary-500"
                : "ring-1 ring-gray-100"
            }`}
          >
            {/* Mini preview */}
            <div className="h-20 p-3" style={{ backgroundColor: t.bg }}>
              <div className="w-full h-full rounded-lg border border-black/5 flex flex-col overflow-hidden">
                {/* Mini header */}
                <div className="h-2.5 bg-white flex items-center gap-1 px-1.5">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: t.primary }} />
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: t.secondary }} />
                </div>
                {/* Mini body */}
                <div className="flex-1 p-1.5 flex flex-col gap-1" style={{ backgroundColor: t.bg }}>
                  <div className="h-1 rounded-full w-4/5 bg-gray-900/20" />
                  <div className="h-1 rounded-full w-3/5" style={{ backgroundColor: t.primary, opacity: 0.6 }} />
                  <div className="h-2 rounded-full w-2/5 mt-auto" style={{ backgroundColor: t.primary }} />
                </div>
                {/* Mini nav */}
                <div className="h-2.5 bg-white flex items-center justify-around px-2 border-t border-black/5">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: t.primary }} />
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                </div>
              </div>
            </div>
            {/* Name + check */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-sm font-semibold text-gray-900">{t.name}</span>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected === t.id
                    ? "border-primary-500 bg-primary-500"
                    : "border-gray-300"
                }`}
              >
                {selected === t.id && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Logo note */}
      <div className="bg-white rounded-xl p-4 flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#ee751d] via-[#f6ba79] to-[#539657] shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-900">The CookFeed logo and app icon always stay the same</span> regardless of your theme choice.
        </p>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-700">
            Your theme is saved to your account and syncs across all devices.
          </p>
        </div>
      </div>
    </main>
  );
}
