"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type Recipe = {
  id: string;
  title: string;
  image?: string;
  author: { name: string };
  tags: string[];
  collection?: string;
};

const DEFAULT_COLLECTIONS = ["All Saved", "Favorites", "To Try", "Weeknight", "Special Occasions"];

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [collections, setCollections] = useState<string[]>(DEFAULT_COLLECTIONS);
  const [selectedCollection, setSelectedCollection] = useState("All Saved");
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  useEffect(() => {
    // Load favorites from localStorage and sync with main recipes to get latest images
    const storedFavorites = JSON.parse(localStorage.getItem("cookfeed_favorites") || "[]");
    const allRecipes = JSON.parse(localStorage.getItem("cookfeed_recipes") || "[]");
    const storedCollections = JSON.parse(localStorage.getItem("cookfeed_collections") || "null");
    
    if (storedCollections) {
      setCollections(storedCollections);
    } else {
      localStorage.setItem("cookfeed_collections", JSON.stringify(DEFAULT_COLLECTIONS));
    }
    
    // Update favorites with latest data from main recipes (especially images)
    const syncedFavorites = storedFavorites.map((fav: Recipe) => {
      const fullRecipe = allRecipes.find((r: Recipe) => r.id === fav.id);
      if (fullRecipe) {
        return {
          ...fav,
          image: fullRecipe.image,
          title: fullRecipe.title,
        };
      }
      return fav;
    });
    
    localStorage.setItem("cookfeed_favorites", JSON.stringify(syncedFavorites));
    setFavorites(syncedFavorites);
  }, []);

  const removeFavorite = (id: string) => {
    const updatedFavorites = favorites.filter((f) => f.id !== id);
    setFavorites(updatedFavorites);
    localStorage.setItem("cookfeed_favorites", JSON.stringify(updatedFavorites));
  };

  const addCollection = () => {
    if (newCollectionName.trim() && !collections.includes(newCollectionName.trim())) {
      const updated = [...collections, newCollectionName.trim()];
      setCollections(updated);
      localStorage.setItem("cookfeed_collections", JSON.stringify(updated));
      setNewCollectionName("");
      setShowNewCollection(false);
    }
  };

  const filteredFavorites = selectedCollection === "All Saved"
    ? favorites
    : favorites.filter((f) => f.collection === selectedCollection);

  return (
    <main className="px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Recipes</h1>
          <p className="text-sm text-gray-500">{favorites.length} recipes saved</p>
        </div>
        <button
          onClick={() => setShowNewCollection(true)}
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* New Collection Modal */}
      {showNewCollection && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowNewCollection(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 safe-area-bottom">
            <h3 className="text-lg font-bold text-gray-900 mb-4">New Collection</h3>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name..."
              className="w-full px-4 py-3 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewCollection(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addCollection}
                disabled={!newCollectionName.trim()}
                className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-medium disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </>
      )}

      {/* Collections Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {collections.map((collection) => (
          <button
            key={collection}
            onClick={() => setSelectedCollection(collection)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCollection === collection
                ? "bg-primary-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {collection}
            {collection !== "All Saved" && (
              <span className="ml-1 opacity-70">
                ({favorites.filter((f) => f.collection === collection).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredFavorites.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📁</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedCollection === "All Saved" ? "No saved recipes yet" : `No recipes in "${selectedCollection}"`}
          </h3>
          <p className="text-gray-500 mb-6">
            {selectedCollection === "All Saved" 
              ? "Save recipes you love to find them here" 
              : "Save recipes to this collection from recipe pages"}
          </p>
          <Link href="/feed" className="btn-primary inline-block">
            Browse Recipes
          </Link>
        </div>
      ) : (
        /* Favorites List */
        <div className="space-y-3">
          {filteredFavorites.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipe/${recipe.id}`}
              className="flex gap-4 p-3 bg-white rounded-xl shadow-sm"
            >
              {/* Image */}
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                {recipe.image ? (
                  <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🍳</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="font-semibold text-gray-900">{recipe.title}</h3>
                <p className="text-sm text-gray-500">by {recipe.author.name}</p>
                {recipe.collection && (
                  <span className="text-xs text-primary-500 mt-1">📁 {recipe.collection}</span>
                )}
              </div>

              {/* Unfavorite button */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  removeFavorite(recipe.id);
                }}
                className="flex items-center justify-center w-10 h-10 text-red-500"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
