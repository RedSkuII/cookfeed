"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type Recipe = {
  id: string;
  title: string;
  image?: string;
  author: string;
  author_image?: string;
  tags: string[];
  collection?: string;
};

type Collection = {
  id: string;
  name: string;
  is_public: boolean;
  recipe_count: number;
};

const DEFAULT_COLLECTIONS = ["All Saved", "Favorites"];

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("All Saved");
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [showCollectionSettings, setShowCollectionSettings] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionPublic, setNewCollectionPublic] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Load favorites
        const favRes = await fetch("/api/favorites");
        if (favRes.ok) {
          const favData = await favRes.json();
          setFavorites(favData.favorites || []);
        }

        // Load collections from API
        const colRes = await fetch("/api/collections");
        if (colRes.ok) {
          const colData = await colRes.json();
          setCollections(colData.collections || []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const removeFavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/recipes/${id}/favorite`, { method: "DELETE" });
      if (res.ok) {
        setFavorites(favorites.filter((f) => f.id !== id));
      }
    } catch (error) {
      console.error("Failed to remove favorite:", error);
    }
  };

  const addCollection = async () => {
    if (!newCollectionName.trim()) return;
    
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newCollectionName.trim(), 
          is_public: newCollectionPublic 
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setCollections([...collections, data.collection]);
        setNewCollectionName("");
        setNewCollectionPublic(true);
        setShowNewCollection(false);
      }
    } catch (error) {
      console.error("Failed to create collection:", error);
    }
  };

  const toggleCollectionPrivacy = async (collection: Collection) => {
    try {
      const res = await fetch("/api/collections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: collection.id, 
          is_public: !collection.is_public 
        }),
      });
      
      if (res.ok) {
        setCollections(collections.map(c => 
          c.id === collection.id ? { ...c, is_public: !c.is_public } : c
        ));
      }
    } catch (error) {
      console.error("Failed to update collection:", error);
    }
  };

  const deleteCollection = async (collection: Collection) => {
    if (!confirm(`Delete "${collection.name}"? Recipes will be moved to Favorites.`)) return;
    
    try {
      const res = await fetch(`/api/collections?id=${collection.id}`, { method: "DELETE" });
      if (res.ok) {
        setCollections(collections.filter(c => c.id !== collection.id));
        if (selectedCollection === collection.name) {
          setSelectedCollection("All Saved");
        }
      }
    } catch (error) {
      console.error("Failed to delete collection:", error);
    }
  };

  // Get all collection names for display
  const allCollectionNames = ["All Saved", "Favorites", ...collections.filter(c => c.name !== "Favorites").map(c => c.name)];

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
            
            {/* Privacy toggle */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">Public Collection</p>
                <p className="text-sm text-gray-500">Others can see this collection</p>
              </div>
              <button
                onClick={() => setNewCollectionPublic(!newCollectionPublic)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  newCollectionPublic ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    newCollectionPublic ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            
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

      {/* Collection Settings Modal */}
      {showCollectionSettings && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCollectionSettings(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 safe-area-bottom max-h-[70vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Manage Collections</h3>
            
            <div className="space-y-3">
              {collections.map((collection) => (
                <div key={collection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{collection.name}</p>
                    <p className="text-sm text-gray-500">
                      {collection.recipe_count || 0} recipes • {collection.is_public ? "Public" : "Private"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCollectionPrivacy(collection)}
                      className={`relative w-10 h-6 rounded-full transition-colors ${
                        collection.is_public ? "bg-orange-500" : "bg-gray-300"
                      }`}
                      title={collection.is_public ? "Make private" : "Make public"}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          collection.is_public ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    {collection.name !== "Favorites" && (
                      <button
                        onClick={() => deleteCollection(collection)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setShowCollectionSettings(false)}
              className="w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
            >
              Done
            </button>
          </div>
        </>
      )}

      {/* Collections Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {allCollectionNames.map((collectionName) => {
          const collection = collections.find(c => c.name === collectionName);
          const isPrivate = collection && !collection.is_public;
          return (
            <button
              key={collectionName}
              onClick={() => setSelectedCollection(collectionName)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                selectedCollection === collectionName
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isPrivate && <span>🔒</span>}
              {collectionName}
              {collectionName !== "All Saved" && (
                <span className="ml-1 opacity-70">
                  ({favorites.filter((f) => f.collection === collectionName).length})
                </span>
              )}
            </button>
          );
        })}
        
        {/* Settings button */}
        <button
          onClick={() => setShowCollectionSettings(true)}
          className="px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Empty State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredFavorites.length === 0 ? (
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
                <p className="text-sm text-gray-500">by {recipe.author}</p>
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
