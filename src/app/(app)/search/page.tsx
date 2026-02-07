"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
  profile_image?: string;
};

const popularTags = ["Italian", "Mexican", "Asian", "Vegan", "Dessert", "Quick", "Healthy", "Comfort Food"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchTab, setSearchTab] = useState<"recipes" | "people">("recipes");
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [results, setResults] = useState<Recipe[]>([]);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
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

  return (
    <main className="px-4 pt-4">
      {/* Search Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Search</h1>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchTab === "recipes" ? "Search recipes, ingredients, tags..." : "Search people by name..."}
            className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </form>
      </div>

      {/* Tabs: Recipes | People */}
      <div className="flex border-b-2 border-gray-200 mb-4">
        <button
          onClick={() => setSearchTab("recipes")}
          className={`flex-1 py-2.5 text-center text-sm font-semibold border-b-2 -mb-[2px] transition-colors ${
            searchTab === "recipes"
              ? "text-primary-500 border-primary-500"
              : "text-gray-400 border-transparent"
          }`}
        >
          Recipes
        </button>
        <button
          onClick={() => setSearchTab("people")}
          className={`flex-1 py-2.5 text-center text-sm font-semibold border-b-2 -mb-[2px] transition-colors ${
            searchTab === "people"
              ? "text-primary-500 border-primary-500"
              : "text-gray-400 border-transparent"
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
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Recipes</h2>
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
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Browse by Category</h2>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
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
              <p className="text-gray-500 mb-6">Add some recipes first to search through them</p>
              <Link href="/recipe/add" className="btn-primary inline-block">
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
              <p className="text-gray-500">
                {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
              </p>

              {results.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes found</h3>
                  <p className="text-gray-500">Try different keywords or browse by category</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((recipe) => (
                    <Link
                      key={recipe.id}
                      href={`/recipe/${recipe.id}`}
                      className="flex gap-4 p-3 bg-white rounded-xl shadow-sm"
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                        {recipe.image ? (
                          <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">🍳</span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="font-semibold text-gray-900">{recipe.title}</h3>
                        <p className="text-sm text-gray-500">by {recipe.author}</p>
                        {recipe.tags?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {recipe.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                #{tag}
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
              <p className="text-gray-500">Search for other users by their name</p>
            </div>
          )}

          {query && query.trim().length < 2 && (
            <p className="text-sm text-gray-500 text-center py-8">Type at least 2 characters to search</p>
          )}

          {searchingUsers && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          )}

          {query && query.trim().length >= 2 && !searchingUsers && (
            <div className="space-y-4">
              <p className="text-gray-500">
                {userResults.length} result{userResults.length !== 1 ? "s" : ""} for &quot;{query}&quot;
              </p>

              {userResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-500">Try a different name or check the spelling</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm"
                    >
                      <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        {user.profile_image ? (
                          <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-semibold text-lg">
                            {user.name?.charAt(0) || "?"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
