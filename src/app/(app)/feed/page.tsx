"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type Recipe = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  author: string;
  author_image?: string;
  likes: number;
  comments?: number;
  tags: string[];
  visibility: string;
  created_at: string;
};

const filterTags = ["All", "Vegan", "Quick", "Dessert", "Italian", "Mexican", "Asian", "Healthy", "Breakfast", "Lunch", "Dinner", "Snack", "Gluten-Free", "Dairy-Free", "Keto", "Comfort Food"];

export default function FeedPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedTag, setSelectedTag] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load recipes from database API
    async function loadRecipes() {
      try {
        const res = await fetch("/api/recipes");
        if (res.ok) {
          const data = await res.json();
          setRecipes(data.recipes || []);
        }
      } catch (error) {
        console.error("Failed to load recipes:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRecipes();
  }, []);

  // Filter recipes by tag
  const filteredRecipes = selectedTag === "All"
    ? recipes
    : recipes.filter(r => r.tags?.some(t => t.toLowerCase() === selectedTag.toLowerCase()));

  return (
    <main className="pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-4">
        <h1 className="text-xl font-extrabold text-gray-900">CookFeed</h1>
        <div className="flex items-center gap-3">
          <Link href="/search">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </Link>
          <button className="relative">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tags Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 px-4 scrollbar-hide">
        {filterTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
              selectedTag === tag
                ? "bg-primary-500 text-white"
                : "bg-white text-gray-600 shadow-sm"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">🍳</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">No recipes yet</h2>
          <p className="text-gray-600 mb-8 max-w-xs mx-auto">
            Be the first to share a delicious recipe with the community!
          </p>
          <Link href="/recipe/add" className="bg-primary-500 text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Recipe
          </Link>
        </div>
      ) : (
        /* Recipe Feed */
        <div className="space-y-4 px-4">
          {filteredRecipes.map((recipe) => (
            <Link href={`/recipe/${recipe.id}`} key={recipe.id} className="bg-white rounded-2xl shadow-md overflow-hidden block">
              <div className="relative h-44 bg-gray-200 overflow-hidden">
                {recipe.image ? (
                  <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-6xl">
                    🍳
                  </div>
                )}
              </div>
              <div className="p-4">
                {/* Author Row */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-linear-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center overflow-hidden">
                    {recipe.author_image ? (
                      <img src={recipe.author_image} alt={recipe.author} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">{(recipe.author || "A").charAt(0)}</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-900">{recipe.author || "Anonymous"}</p>
                </div>
                {/* Title & Description */}
                <h3 className="text-base font-extrabold text-gray-900 mb-1">{recipe.title}</h3>
                {recipe.description && (
                  <p className="text-xs text-gray-600 mb-3 leading-relaxed line-clamp-2">{recipe.description}</p>
                )}
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(recipe.tags || []).map((tag, i) => (
                    <span
                      key={tag}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        i % 2 === 0
                          ? "text-primary-500 bg-primary-50"
                          : "text-secondary-500 bg-secondary-50"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {/* Engagement Row */}
                <div className="flex items-center gap-5 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-600">{recipe.likes || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-600">{recipe.comments || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
