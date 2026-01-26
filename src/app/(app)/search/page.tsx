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

const popularTags = ["Italian", "Mexican", "Asian", "Vegan", "Dessert", "Quick", "Healthy", "Comfort Food"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [results, setResults] = useState<Recipe[]>([]);
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

  useEffect(() => {
    // Filter recipes based on query
    if (query.trim()) {
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
  }, [query, allRecipes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <main className="px-4 pt-4">
      {/* Search Header */}
      <div className="mb-6">
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
            placeholder="Search recipes, ingredients, tags..."
            className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </form>
      </div>

      {/* Recent Searches - only show if we have recipes */}
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

          {/* Popular Tags */}
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

      {/* Empty State when no recipes exist */}
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )}

      {/* Search Results */}
      {query && (
        <div className="space-y-4">
          <p className="text-gray-500">
            {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
          </p>
          
          {results.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes found</h3>
              <p className="text-gray-500">Try different keywords or browse by category</p>
            </div>
          ) : (
            /* Results List */
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
    </main>
  );
}
