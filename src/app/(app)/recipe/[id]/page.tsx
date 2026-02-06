"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ManageEditorsModal from "@/components/ManageEditorsModal";

type Recipe = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image?: string;
  ingredients: string;
  instructions: string;
  tags: string[];
  visibility: string;
  likes: number;
  comment_count?: number;
  author: string;
  author_image?: string;
  created_at: string;
};

type Comment = {
  id: string;
  user_name: string;
  user_image?: string;
  content: string;
  created_at: string;
};

// Helper to parse ingredients/instructions which could be JSON array or newline-separated string
function parseList(data: string): string[] {
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // Not JSON, treat as newline-separated
  }
  return data.split("\n").filter(Boolean);
}

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [madeThis, setMadeThis] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showMadeToast, setShowMadeToast] = useState(false);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [collections, setCollections] = useState<string[]>([]);
  const [currentCollection, setCurrentCollection] = useState<string | null>(null);
  const [allowComments, setAllowComments] = useState(true);
  const [editorPermissions, setEditorPermissions] = useState<{
    can_edit: number;
    can_delete: number;
    can_manage_editors: number;
  } | null>(null);
  const [showManageEditors, setShowManageEditors] = useState(false);

  const isOwner = session?.user?.id === recipe?.user_id;
  const canEdit = isOwner || (editorPermissions && Number(editorPermissions.can_edit) === 1);
  const canDelete = isOwner || (editorPermissions && Number(editorPermissions.can_delete) === 1);
  const canManageEditors = isOwner || (editorPermissions && Number(editorPermissions.can_manage_editors) === 1);
  const showMenuButton = canEdit || canDelete || canManageEditors;

  useEffect(() => {
    // Load recipe from database
    async function loadRecipe() {
      try {
        const res = await fetch(`/api/recipes/${id}`);
        if (res.ok) {
          const data = await res.json();
          setRecipe(data.recipe);
          setLikeCount(Number(data.recipe?.likes) || 0);
          setIsLiked(data.hasLiked || false);
          setMadeThis(data.hasMade || false);
          setIsFavorited(data.isFavorited || false);
          setComments(data.comments || []);
          setAllowComments(data.allowComments !== false);
          setEditorPermissions(data.editorPermissions || null);
        }
      } catch (error) {
        console.error("Failed to load recipe:", error);
      } finally {
        setLoading(false);
      }
    }
    
    // Load collections from API
    async function loadCollections() {
      try {
        const res = await fetch("/api/collections");
        if (res.ok) {
          const data = await res.json();
          const collNames = ["Favorites", ...(data.collections || []).filter((c: {name: string}) => c.name !== "Favorites").map((c: {name: string}) => c.name)];
          setCollections(collNames);
        }
      } catch {
        setCollections(["Favorites"]);
      }
    }
    
    loadRecipe();
    loadCollections();
    loadRecipe();
  }, [id]);

  const toggleLike = async () => {
    if (!recipe) return;
    
    try {
      if (isLiked) {
        // Unlike
        await fetch(`/api/recipes/${id}/like`, { method: "DELETE" });
        setLikeCount(Math.max(0, likeCount - 1));
        setIsLiked(false);
      } else {
        // Like
        await fetch(`/api/recipes/${id}/like`, { method: "POST" });
        setLikeCount(likeCount + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handleShare = async () => {
    if (!recipe) return;
    
    const shareData = {
      title: recipe.title,
      text: `Check out this recipe: ${recipe.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      }
    } catch (err) {
      // User cancelled or error
      console.log("Share cancelled");
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;
    
    if (confirm("Are you sure you want to delete this recipe?")) {
      try {
        const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
        if (res.ok) {
          router.push("/feed");
        }
      } catch (error) {
        console.error("Failed to delete recipe:", error);
      }
    }
    setShowMenu(false);
  };

  const toggleFavorite = async () => {
    if (!recipe) return;
    
    if (isFavorited) {
      // Remove from favorites
      try {
        await fetch(`/api/recipes/${id}/favorite`, { method: "DELETE" });
        setIsFavorited(false);
        setCurrentCollection(null);
      } catch (error) {
        console.error("Failed to remove favorite:", error);
      }
    } else {
      // Show collection picker
      setShowCollectionPicker(true);
    }
  };

  const saveToCollection = async (collectionName: string) => {
    if (!recipe) return;
    
    try {
      await fetch(`/api/recipes/${id}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: collectionName }),
      });
      setIsFavorited(true);
      setCurrentCollection(collectionName);
      setShowCollectionPicker(false);
    } catch (error) {
      console.error("Failed to save to collection:", error);
    }
  };

  const handleMadeThis = async () => {
    if (!recipe) return;
    
    try {
      if (madeThis) {
        await fetch(`/api/recipes/${id}/made`, { method: "DELETE" });
        setMadeThis(false);
      } else {
        await fetch(`/api/recipes/${id}/made`, { method: "POST" });
        setMadeThis(true);
        setShowMadeToast(true);
        setTimeout(() => setShowMadeToast(false), 2000);
      }
    } catch (error) {
      console.error("Failed to toggle made:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !recipe) return;
    
    try {
      const res = await fetch(`/api/recipes/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setComments([...comments, data.comment]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen pb-20 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="min-h-screen pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <Link href="/feed" className="w-10 h-10 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>

        {/* Not Found State */}
        <div className="text-center py-20 px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔍</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Recipe not found</h2>
          <p className="text-gray-500 mb-8">
            This recipe doesn&apos;t exist or may have been removed.
          </p>
          <Link href="/feed" className="btn-primary inline-block">
            Back to Feed
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      {/* Manage Editors Modal */}
      {showManageEditors && (
        <ManageEditorsModal
          recipeId={id}
          isOwner={isOwner}
          onClose={() => setShowManageEditors(false)}
        />
      )}

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg">
          Link copied to clipboard!
        </div>
      )}

      {/* Made This Toast */}
      {showMadeToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <span>🎉</span> Nice! You made this recipe!
        </div>
      )}

      {/* Collection Picker Modal */}
      {showCollectionPicker && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCollectionPicker(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 safe-area-bottom max-h-[70vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Save to Collection</h3>
            <div className="space-y-2">
              {collections.map((collection) => (
                <button
                  key={collection}
                  onClick={() => saveToCollection(collection)}
                  className={`w-full p-4 rounded-xl text-left flex items-center gap-3 transition-colors ${
                    currentCollection === collection
                      ? "bg-primary-100 border-2 border-primary-500"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-xl">📁</span>
                  <span className="font-medium text-gray-900">{collection}</span>
                  {currentCollection === collection && (
                    <svg className="w-5 h-5 text-primary-500 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCollectionPicker(false)}
              className="w-full mt-4 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <Link href="/feed" className="w-10 h-10 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex gap-2 relative">
          <button
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          {showMenuButton && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </button>
          )}

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
                {canEdit && (
                  <Link
                    href={`/recipe/${id}/edit`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700"
                    onClick={() => setShowMenu(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Recipe
                  </Link>
                )}
                {canManageEditors && (
                  <button
                    onClick={() => { setShowManageEditors(true); setShowMenu(false); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 w-full"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Manage Editors
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-red-600 w-full"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Recipe
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recipe Image */}
      <div className="aspect-4/3 bg-gray-200 flex items-center justify-center overflow-hidden">
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-8xl">🍳</span>
        )}
      </div>

      {/* Recipe Content */}
      <div className="px-4 py-6">
        {/* Title & Author */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center overflow-hidden">
            {recipe.author_image ? (
              <img src={recipe.author_image} alt={recipe.author} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-semibold">{recipe.author?.charAt(0) || "?"}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{recipe.author}</p>
            <p className="text-sm text-gray-500">{new Date(recipe.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Description */}
        {recipe.description && (
          <p className="text-gray-700 mb-4">{recipe.description}</p>
        )}

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {recipe.tags.map((tag) => (
              <span key={tag} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 py-4 border-t border-b border-gray-200 mb-6">
          <button 
            onClick={toggleLike}
            className={`flex items-center gap-2 ${isLiked ? "text-red-500" : "text-gray-700"}`}
          >
            <svg className="w-6 h-6" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="font-medium">{likeCount}</span>
          </button>
          <button 
            onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 text-gray-700 hover:text-primary-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-medium">{comments.length}</span>
          </button>
          <button 
            onClick={toggleFavorite}
            className={`flex flex-col items-end ml-auto ${isFavorited ? "text-primary-500" : "text-gray-700"}`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="font-medium">{isFavorited ? "Saved" : "Save"}</span>
            </div>
            {currentCollection && (
              <span className="text-xs text-primary-400">📁 {currentCollection}</span>
            )}
          </button>
        </div>

        {/* Ingredients */}
        {recipe.ingredients && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ingredients</h2>
            <ul className="space-y-3">
              {parseList(recipe.ingredients).map((ingredient, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Steps */}
        {recipe.instructions && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Steps</h2>
            <ol className="space-y-4">
              {parseList(recipe.instructions).map((step, index) => (
                <li key={index} className="flex gap-4">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-semibold text-sm">{index + 1}</span>
                  </div>
                  <p className="text-gray-700 pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* "I Made This" Button */}
        <button 
          onClick={handleMadeThis}
          className={`w-full mb-6 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
            madeThis 
              ? "bg-green-500 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <span className="text-xl">{madeThis ? "✅" : "👨‍🍳"}</span>
          {madeThis ? "You Made This!" : "I Made This!"}
        </button>

        {/* Comments Section */}
        <div id="comments-section" className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Comments ({comments.length})</h2>
          
          {/* Add Comment - only show if comments are allowed */}
          {allowComments ? (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-primary-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-gray-100 rounded-xl text-center">
              <p className="text-gray-500">Comments are disabled for this recipe</p>
            </div>
          )}
          
          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{allowComments ? "No comments yet. Be the first to comment!" : "No comments"}</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{comment.user_name}</span>
                    <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
