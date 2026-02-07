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
    <main className="px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CookFeed</h1>
          <p className="text-sm text-gray-600">Discover delicious recipes</p>
        </div>
        <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </div>

      {/* Tags Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {filterTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedTag === tag
                ? "bg-primary-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">🍳</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No recipes yet</h2>
          <p className="text-gray-600 mb-8 max-w-xs mx-auto">
            Be the first to share a delicious recipe with the community!
          </p>
          <Link href="/recipe/add" className="btn-primary inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Recipe
          </Link>
        </div>
      ) : (
        /* Recipe Feed */
        <div className="space-y-6">
          {filteredRecipes.map((recipe) => (
            <Link href={`/recipe/${recipe.id}`} key={recipe.id} className="card block">
              <div className="relative aspect-4/3 bg-gray-200 overflow-hidden">
                {recipe.image ? (
                  <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-6xl">
                    🍳
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center overflow-hidden">
                    {recipe.author_image ? (
                      <img src={recipe.author_image} alt={recipe.author} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-medium">{(recipe.author || "A").charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">{recipe.author || "Anonymous"}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{recipe.title}</h3>
                {recipe.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-3">
                  {(recipe.tags || []).map((tag) => (
                    <span key={tag} className="text-xs bg-primary-50 text-gray-700 px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-gray-600 text-sm">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {recipe.likes || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {recipe.comments || 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
