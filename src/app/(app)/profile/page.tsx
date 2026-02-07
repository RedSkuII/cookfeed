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

type SharedRecipe = Recipe & {
  owner_name?: string;
  owner_image?: string;
  can_edit: number;
  can_delete: number;
  can_manage_editors: number;
};

const filterTags = [
  "All", "Quick", "Italian", "Dessert", "Vegan", "Mexican", "Asian",
  "Healthy", "Breakfast", "Lunch", "Dinner", "Keto", "Gluten-Free", "Comfort Food",
];

export default function ProfilePage() {
  const { data: session } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [madeRecipes, setMadeRecipes] = useState<Recipe[]>([]);
  const [sharedRecipes, setSharedRecipes] = useState<SharedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "mine" | "shared" | "made">("all");
  const [mineSubFilter, setMineSubFilter] = useState<"all" | "public" | "private">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [profile, setProfile] = useState<{ name?: string; bio?: string; profileImage?: string }>({});
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/user/recipes");
        if (res.ok) {
          const data = await res.json();
          setRecipes(data.recipes || []);
          setMadeRecipes(data.madeRecipes || []);
          setSharedRecipes(data.sharedRecipes || []);
        }
      } catch (error) {
        console.error("Failed to load recipes:", error);
      } finally {
        setLoading(false);
      }
    }

    const savedProfile = JSON.parse(localStorage.getItem("cookfeed_profile") || "{}");
    setProfile(savedProfile);

    async function loadFollowers() {
      if (session?.user?.id) {
        try {
          const profileRes = await fetch(`/api/users/${session.user.id}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setFollowerCount(profileData.stats?.followers ?? 0);
            setFollowingCount(profileData.stats?.following ?? 0);
            if (profileData.user?.name) {
              setProfile(prev => ({ ...prev, name: profileData.user.name, bio: profileData.user.bio || prev.bio }));
            }
          }
        } catch {
          // Fallback to local data
        }
      }
    }

    loadData();
    loadFollowers();
  }, [session?.user?.id]);

  // Generic filter helper: search by title + filter by tag
  function applyFilters<T extends Recipe>(list: T[]): T[] {
    let filtered = list;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => r.title.toLowerCase().includes(q));
    }
    if (selectedTag !== "All") {
      filtered = filtered.filter((r) =>
        r.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
      );
    }
    return filtered;
  }

  // Compute filtered lists for each tab
  const allFiltered = applyFilters([...recipes, ...sharedRecipes]);
  const mineFiltered = (() => {
    let list = applyFilters(recipes);
    if (mineSubFilter === "public") list = list.filter((r) => r.visibility === "public");
    if (mineSubFilter === "private") list = list.filter((r) => r.visibility === "private");
    return list;
  })();
  const sharedFiltered = applyFilters(sharedRecipes);
  const madeFiltered = applyFilters(madeRecipes);

  // Counts for tabs (after search + tag filter)
  const allCount = applyFilters([...recipes, ...sharedRecipes]).length;
  const mineCount = applyFilters(recipes).length;
  const sharedCount = applyFilters(sharedRecipes).length;
  const madeCount = applyFilters(madeRecipes).length;

  // Sub-filter counts for Mine tab
  const mineAllCount = applyFilters(recipes).length;
  const minePublicCount = applyFilters(recipes.filter((r) => r.visibility === "public")).length;
  const minePrivateCount = applyFilters(recipes.filter((r) => r.visibility === "private")).length;

  // Get the active filtered list
  const displayRecipes =
    activeTab === "all" ? allFiltered
    : activeTab === "mine" ? mineFiltered
    : activeTab === "made" ? madeFiltered
    : [];

  // Check if a recipe in the "all" grid is shared
  function isSharedRecipe(recipe: Recipe): recipe is SharedRecipe {
    return "owner_name" in recipe;
  }

  const handleShare = async () => {
    const url = window.location.origin + `/profile/${session?.user?.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${profile.name || session?.user?.name}'s CookFeed`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // cancelled
    }
  };

  return (
    <main className="px-4 pt-4 pb-20">
      {/* Top Nav */}
      <div className="flex justify-between items-center mb-6">
        <div className="w-10" />
        <span className="text-base font-extrabold text-gray-900">
          {profile.name || session?.user?.name || "Profile"}
        </span>
        <Link href="/settings" className="w-10 h-10 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </Link>
      </div>

      {/* Avatar + Name (Centered) */}
      <div className="text-center mb-5">
        <div className="w-20 h-20 rounded-full bg-linear-to-br from-primary-400 to-secondary-500 mx-auto mb-3 ring-4 ring-white shadow-md overflow-hidden flex items-center justify-center">
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
        <h2 className="text-lg font-black text-gray-900">{profile.name || session?.user?.name || "User"}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{profile.bio || session?.user?.email || "No bio yet"}</p>
      </div>

      {/* Stats Row (Centered) */}
      <div className="flex justify-center gap-10 mb-5">
        <div className="text-center">
          <p className="text-xl font-black text-gray-900">{recipes.length + sharedRecipes.length}</p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Recipes</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-gray-900">{followerCount}</p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Followers</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-gray-900">{followingCount}</p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Following</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Link
          href="/profile/edit"
          className="flex-1 bg-primary-500 text-white text-sm font-bold py-2.5 rounded-full text-center"
        >
          Edit Profile
        </Link>
        <button
          onClick={handleShare}
          className="flex-1 border-2 border-primary-500 text-primary-500 text-sm font-bold py-2.5 rounded-full"
        >
          Share
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search recipes..."
          className="w-full px-4 py-2.5 pl-10 bg-white rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
        />
        <svg
          className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" strokeWidth={2} />
          <path strokeLinecap="round" strokeWidth={2} d="m21 21-4.35-4.35" />
        </svg>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tag Pills Row */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
        {filterTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
              selectedTag === tag
                ? "bg-primary-500 text-white"
                : "bg-white text-gray-600 shadow-sm"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Main Tabs */}
      <div className="flex border-b-2 border-primary-100 mb-0">
        {([
          { key: "all" as const, label: "All", count: allCount },
          { key: "mine" as const, label: "Mine", count: mineCount },
          { key: "shared" as const, label: "Shared", count: sharedCount },
          { key: "made" as const, label: "Made", count: madeCount },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key !== "mine") setMineSubFilter("all");
            }}
            className={`flex-1 py-2.5 text-center text-sm border-b-2 -mb-[2px] transition-colors ${
              activeTab === tab.key
                ? "text-primary-500 border-primary-500 font-bold"
                : "text-gray-400 border-transparent font-semibold"
            }`}
          >
            {tab.label}
            <span className={`ml-1 text-xs ${
              activeTab === tab.key ? "text-primary-400" : "text-gray-400"
            }`}>
              ({tab.count})
            </span>
          </button>
        ))}
      </div>

      {/* Mine Sub-Filter Pills */}
      {activeTab === "mine" && (
        <div className="flex gap-2 px-1 py-2">
          {([
            { key: "all" as const, label: "All", count: mineAllCount },
            { key: "public" as const, label: "Public", count: minePublicCount },
            { key: "private" as const, label: "Private", count: minePrivateCount },
          ]).map((sub) => (
            <button
              key={sub.key}
              onClick={() => setMineSubFilter(sub.key)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                mineSubFilter === sub.key
                  ? "bg-primary-500 text-white"
                  : "bg-white text-gray-600 shadow-sm"
              }`}
            >
              {sub.label} ({sub.count})
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : activeTab === "shared" ? (
        /* Shared Tab - List View */
        sharedFiltered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || selectedTag !== "All" ? `No results` : "No shared recipes"}
            </h3>
            <p className="text-gray-500">
              {searchQuery || selectedTag !== "All"
                ? `No shared recipes match your filters`
                : "Recipes others share with you will appear here"}
            </p>
          </div>
        ) : (
          <div className="py-3 space-y-2">
            {sharedFiltered.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipe/${recipe.id}`}
                className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm"
              >
                <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {recipe.image ? (
                    <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🍳</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{recipe.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Shared by {recipe.owner_name || "Unknown"}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {Number(recipe.can_edit) === 1 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-blue-100 text-blue-600">
                        Edit
                      </span>
                    )}
                    {Number(recipe.can_delete) === 1 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-red-100 text-red-600">
                        Delete
                      </span>
                    )}
                    {Number(recipe.can_manage_editors) === 1 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-yellow-100 text-yellow-700">
                        Manage
                      </span>
                    )}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )
      ) : displayRecipes.length === 0 ? (
        /* Empty State for Grid Tabs */
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">
              {activeTab === "made" ? "👨‍🍳" : "📝"}
            </span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || selectedTag !== "All"
              ? "No results"
              : activeTab === "made"
              ? "No recipes made yet"
              : "No recipes yet"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || selectedTag !== "All"
              ? `No recipes match your filters`
              : activeTab === "made"
              ? "Mark recipes as made when you cook them"
              : "Start building your recipe collection"}
          </p>
          {!searchQuery && selectedTag === "All" && (
            activeTab === "made" ? (
              <Link href="/feed" className="bg-primary-500 text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg inline-block">
                Browse Recipes
              </Link>
            ) : (
              <Link href="/recipe/add" className="bg-primary-500 text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg inline-block">
                Add Your First Recipe
              </Link>
            )
          )}
        </div>
      ) : (
        /* Recipe Grid */
        <div className="grid grid-cols-3 gap-1.5 mt-1">
          {displayRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipe/${recipe.id}`}
              className="aspect-square bg-gray-200 relative overflow-hidden rounded-xl"
            >
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
              {/* Shared badge (only in All tab for shared recipes) */}
              {activeTab === "all" && isSharedRecipe(recipe) && (
                <>
                  <div className="absolute top-1 left-1 bg-primary-500/85 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold">
                    SHARED
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white text-[10px] pt-4 pb-1 px-1.5">
                    by {recipe.owner_name || "Unknown"}
                  </div>
                </>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Results count when searching */}
      {(searchQuery || selectedTag !== "All") && !loading && (
        <div className="text-center py-3 text-xs text-gray-400">
          {activeTab === "shared" ? sharedFiltered.length : displayRecipes.length} result{(activeTab === "shared" ? sharedFiltered.length : displayRecipes.length) !== 1 ? "s" : ""}
          {searchQuery ? ` for "${searchQuery}"` : ""}
          {selectedTag !== "All" ? ` in ${selectedTag}` : ""}
        </div>
      )}
    </main>
  );
}
