"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Recipe = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  author: string;
  author_image?: string;
  tags: string[];
  visibility: string;
};

type UserResult = {
  id: string;
  name: string;
  email?: string;
  profile_image?: string;
  recipe_count?: number;
  follower_count?: number;
};

const popularTags = ["Italian", "Mexican", "Asian", "Vegan", "Dessert", "Quick", "Healthy", "Comfort Food"];

export default function SearchPage() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [searchTab, setSearchTab] = useState<"recipes" | "people">("recipes");
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [results, setResults] = useState<Recipe[]>([]);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const res = await fetch("/api/recipes");
        if (res.ok) {
          const data = await res.json();
          setAllRecipes(data.recipes || []);
        }
      } catch (error) {
        console.error("Failed to load recipes:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRecipes();
  }, []);

  // Filter recipes client-side
  useEffect(() => {
    if (query.trim() && searchTab === "recipes") {
      const searchTerm = query.toLowerCase();
      const filtered = allRecipes.filter((recipe) => {
        return (
          recipe.title.toLowerCase().includes(searchTerm) ||
          recipe.description?.toLowerCase().includes(searchTerm) ||
          recipe.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))
        );
      });
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query, allRecipes, searchTab]);

  // Debounced user search via API
  useEffect(() => {
    if (searchTab !== "people" || query.trim().length < 2) {
      setUserResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setUserResults(data.users || []);
          // Build set of user IDs we're following
          const following = new Set<string>();
          for (const u of data.users || []) {
            if (u.is_following) following.add(u.id);
          }
          setFollowingIds(following);
        }
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleFollow = async (userId: string) => {
    if (!session?.user?.id) return;
    const isFollowing = followingIds.has(userId);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (res.ok) {
        setFollowingIds(prev => {
          const next = new Set(prev);
          if (isFollowing) next.delete(userId);
          else next.add(userId);
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  return (
    <main className="px-4 pt-4">
      {/* Search Header */}
      <div className="mb-4">
        <h1 className="text-xl font-extrabold text-gray-900 mb-4">Search</h1>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchTab === "recipes" ? "Search recipes, ingredients, tags..." : "Search people by name..."}
            className="w-full pl-10 pr-10 py-2.5 bg-white rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-sm text-gray-900 font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </form>
      </div>

      {/* Tabs: Recipes | People */}
      <div className="flex border-b-2 border-primary-100 mb-5">
        <button
          onClick={() => setSearchTab("recipes")}
          className={`flex-1 py-2.5 text-center text-sm border-b-2 -mb-[2px] transition-colors ${
            searchTab === "recipes"
              ? "text-primary-500 border-primary-500 font-bold"
              : "text-gray-400 border-transparent font-semibold"
          }`}
        >
          Recipes
        </button>
        <button
          onClick={() => setSearchTab("people")}
          className={`flex-1 py-2.5 text-center text-sm border-b-2 -mb-[2px] transition-colors ${
            searchTab === "people"
              ? "text-primary-500 border-primary-500 font-bold"
              : "text-gray-400 border-transparent font-semibold"
          }`}
        >
          People
        </button>
      </div>

      {/* ===== RECIPES TAB ===== */}
      {searchTab === "recipes" && (
        <>
          {/* Default content when no search */}
          {!query && allRecipes.length > 0 && (
            <>
              <div className="mb-6">
                <h2 className="text-base font-extrabold text-gray-900 mb-3">Your Recipes</h2>
                <div className="space-y-2">
                  {allRecipes.slice(0, 4).map((recipe) => (
                    <Link
                      key={recipe.id}
                      href={`/recipe/${recipe.id}`}
                      className="flex items-center gap-3 w-full py-2 text-left text-gray-600 hover:text-gray-900"
                    >
                      <span className="text-xl">🍳</span>
                      {recipe.title}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-base font-extrabold text-gray-900 mb-3">Browse by Category</h2>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="px-4 py-1.5 bg-white text-gray-600 rounded-full text-xs font-bold shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {!query && !loading && allRecipes.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📝</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes to search</h3>
              <p className="text-gray-600 mb-6">Add some recipes first to search through them</p>
              <Link href="/recipe/add" className="bg-primary-500 text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg inline-block">
                Add Your First Recipe
              </Link>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          )}

          {query && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
              </p>

              {results.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes found</h3>
                  <p className="text-gray-600">Try different keywords or browse by category</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((recipe) => (
                    <Link
                      key={recipe.id}
                      href={`/recipe/${recipe.id}`}
                      className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm"
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                        {recipe.image ? (
                          <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">🍳</span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="font-bold text-gray-900">{recipe.title}</h3>
                        <p className="text-xs text-gray-400">by {recipe.author}</p>
                        {recipe.tags?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {recipe.tags.slice(0, 3).map((tag, i) => (
                              <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                i % 2 === 0 ? "text-primary-500 bg-primary-50" : "text-secondary-500 bg-secondary-50"
                              }`}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ===== PEOPLE TAB ===== */}
      {searchTab === "people" && (
        <>
          {!query && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Find People</h3>
              <p className="text-gray-600">Search for other users by their name</p>
            </div>
          )}

          {query && query.trim().length < 2 && (
            <p className="text-sm text-gray-400 text-center py-8">Type at least 2 characters to search</p>
          )}

          {searchingUsers && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          )}

          {query && query.trim().length >= 2 && !searchingUsers && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                {userResults.length} people found
              </p>

              {userResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600">Try a different name or check the spelling</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userResults.map((user) => {
                    const isFollowing = followingIds.has(user.id);
                    return (
                      <div
                        key={user.id}
                        className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
                      >
                        <Link
                          href={`/profile/${user.id}`}
                          className="w-12 h-12 bg-linear-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                        >
                          {user.profile_image ? (
                            <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-lg">
                              {user.name?.charAt(0) || "?"}
                            </span>
                          )}
                        </Link>
                        <Link href={`/profile/${user.id}`} className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                          {user.email && (
                            <p className="text-xs text-gray-400 truncate">@{user.email.split("@")[0]}</p>
                          )}
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {user.recipe_count ?? 0} recipes &bull; {user.follower_count ?? 0} followers
                          </p>
                        </Link>
                        <button
                          onClick={() => handleFollow(user.id)}
                          className={`text-xs font-bold px-4 py-1.5 rounded-full shrink-0 ${
                            isFollowing
                              ? "bg-secondary-500 text-white"
                              : "bg-primary-500 text-white"
                          }`}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
