"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Recipe = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  visibility: string;
  tags: string[];
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [madeRecipes, setMadeRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "public" | "private" | "made">("all");
  const [profile, setProfile] = useState<{ name?: string; bio?: string; profileImage?: string }>({});

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/user/recipes");
        if (res.ok) {
          const data = await res.json();
          setRecipes(data.recipes || []);
          setMadeRecipes(data.madeRecipes || []);
        }
      } catch (error) {
        console.error("Failed to load recipes:", error);
      } finally {
        setLoading(false);
      }
    }
    
    // Load profile from localStorage (could be moved to API later)
    const savedProfile = JSON.parse(localStorage.getItem("cookfeed_profile") || "{}");
    setProfile(savedProfile);
    
    loadData();
  }, []);

  // Filter recipes based on active tab
  const filteredRecipes = activeTab === "made" 
    ? madeRecipes 
    : recipes.filter((recipe) => {
        if (activeTab === "all") return true;
        if (activeTab === "public") return recipe.visibility === "public";
        if (activeTab === "private") return recipe.visibility === "private";
        return true;
      });

  const publicCount = recipes.filter(r => r.visibility === "public").length;
  const privateCount = recipes.filter(r => r.visibility === "private").length;

  return (
    <main className="px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <Link href="/settings" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>

      {/* Profile Info */}
      <div className="flex items-center gap-4 mb-6">
        {/* Avatar */}
        <div className="w-20 h-20 bg-linear-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center overflow-hidden">
          {profile.profileImage ? (
            <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : session?.user?.image ? (
            <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl text-white font-bold">
              {session?.user?.name?.charAt(0) || "?"}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex-1 flex justify-around">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{recipes.length}</p>
            <p className="text-sm text-gray-500">Recipes</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500">Following</p>
          </div>
        </div>
      </div>

      {/* Name & Bio */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{profile.name || session?.user?.name || "User"}</h2>
        <p className="text-gray-600">{session?.user?.email}</p>
        <p className="text-gray-500 mt-2 italic">{profile.bio || "No bio yet"}</p>
      </div>

      {/* Edit Profile Button */}
      <Link
        href="/profile/edit"
        className="block w-full py-2 text-center border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-6"
      >
        Edit Profile
      </Link>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button 
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === "all" 
              ? "text-primary-500 border-b-2 border-primary-500" 
              : "text-gray-500"
          }`}
        >
          All ({recipes.length})
        </button>
        <button 
          onClick={() => setActiveTab("public")}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === "public" 
              ? "text-primary-500 border-b-2 border-primary-500" 
              : "text-gray-500"
          }`}
        >
          Public ({publicCount})
        </button>
        <button 
          onClick={() => setActiveTab("private")}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === "private" 
              ? "text-primary-500 border-b-2 border-primary-500" 
              : "text-gray-500"
          }`}
        >
          Private ({privateCount})
        </button>
        <button 
          onClick={() => setActiveTab("made")}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === "made" 
              ? "text-primary-500 border-b-2 border-primary-500" 
              : "text-gray-500"
          }`}
        >
          Made ({madeRecipes.length})
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredRecipes.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📝</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes yet</h3>
          <p className="text-gray-500 mb-6">Start building your recipe collection</p>
          <Link href="/recipe/add" className="btn-primary inline-block">
            Add Your First Recipe
          </Link>
        </div>
      ) : (
        /* Recipe Grid */
        <div className="grid grid-cols-3 gap-1">
          {filteredRecipes.map((recipe) => (
            <Link key={recipe.id} href={`/recipe/${recipe.id}`} className="aspect-square bg-gray-200 relative overflow-hidden">
              {recipe.image ? (
                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl">
                  🍳
                </div>
              )}
              {/* Private indicator */}
              {recipe.visibility === "private" && (
                <div className="absolute top-1 right-1 bg-gray-800/70 rounded-full p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
