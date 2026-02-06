"use client";

import { useState, useEffect } from "react";

type Editor = {
  user_id: string;
  name: string;
  profile_image?: string;
  can_edit: number;
  can_delete: number;
  can_manage_editors: number;
};

type SearchResult = {
  id: string;
  name: string;
  profile_image?: string;
};

export default function ManageEditorsModal({
  recipeId,
  isOwner,
  onClose,
}: {
  recipeId: string;
  isOwner: boolean;
  onClose: () => void;
}) {
  const [editors, setEditors] = useState<Editor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadEditors();
  }, [recipeId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function loadEditors() {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/editors`);
      if (res.ok) {
        const data = await res.json();
        setEditors(data.editors || []);
      }
    } catch (error) {
      console.error("Failed to load editors:", error);
    } finally {
      setLoading(false);
    }
  }

  async function searchUsers(q: string) {
    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out users who are already editors
        const editorIds = new Set(editors.map((e) => e.user_id));
        setSearchResults(
          (data.users || []).filter((u: SearchResult) => !editorIds.has(u.id))
        );
      }
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setSearching(false);
    }
  }

  async function addEditor(userId: string) {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/editors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          can_edit: true,
          can_delete: false,
          can_manage_editors: false,
        }),
      });
      if (res.ok) {
        setSearchQuery("");
        setSearchResults([]);
        await loadEditors();
      }
    } catch (error) {
      console.error("Failed to add editor:", error);
    }
  }

  async function removeEditor(userId: string) {
    try {
      const res = await fetch(
        `/api/recipes/${recipeId}/editors?user_id=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setEditors(editors.filter((e) => e.user_id !== userId));
      }
    } catch (error) {
      console.error("Failed to remove editor:", error);
    }
  }

  async function updatePermission(
    userId: string,
    field: "can_edit" | "can_delete" | "can_manage_editors",
    value: boolean
  ) {
    const editor = editors.find((e) => e.user_id === userId);
    if (!editor) return;

    const updated = {
      can_edit: field === "can_edit" ? value : Number(editor.can_edit) === 1,
      can_delete: field === "can_delete" ? value : Number(editor.can_delete) === 1,
      can_manage_editors:
        field === "can_manage_editors"
          ? value
          : Number(editor.can_manage_editors) === 1,
    };

    try {
      const res = await fetch(`/api/recipes/${recipeId}/editors`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ...updated }),
      });
      if (res.ok) {
        setEditors(
          editors.map((e) =>
            e.user_id === userId
              ? {
                  ...e,
                  can_edit: updated.can_edit ? 1 : 0,
                  can_delete: updated.can_delete ? 1 : 0,
                  can_manage_editors: updated.can_manage_editors ? 1 : 0,
                }
              : e
          )
        );
      }
    } catch (error) {
      console.error("Failed to update permission:", error);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 safe-area-bottom max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Manage Editors</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* User Search */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name..."
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Search Results */}
          {searching && (
            <p className="text-sm text-gray-500 mt-2 px-1">Searching...</p>
          )}
          {searchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center overflow-hidden">
                      {user.profile_image ? (
                        <img
                          src={user.profile_image}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-semibold">
                          {user.name?.charAt(0) || "?"}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-gray-900">
                      {user.name}
                    </span>
                  </div>
                  <button
                    onClick={() => addEditor(user.id)}
                    className="px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
          {searchQuery.trim().length >= 2 &&
            !searching &&
            searchResults.length === 0 && (
              <p className="text-sm text-gray-500 mt-2 px-1">No users found</p>
            )}
        </div>

        {/* Current Editors List */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Current Editors ({editors.length})
          </h4>

          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading...</p>
          ) : editors.length === 0 ? (
            <div className="text-center py-6">
              <svg
                className="w-12 h-12 text-gray-300 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-gray-500">No editors yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Search for users above to add them
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {editors.map((editor) => (
                <div
                  key={editor.user_id}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center overflow-hidden">
                        {editor.profile_image ? (
                          <img
                            src={editor.profile_image}
                            alt={editor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold">
                            {editor.name?.charAt(0) || "?"}
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">
                        {editor.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeEditor(editor.user_id)}
                      className="text-red-500 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Permission Toggles */}
                  <div className="space-y-2 pl-13">
                    <PermissionToggle
                      label="Edit content"
                      enabled={Number(editor.can_edit) === 1}
                      onChange={(v) =>
                        updatePermission(editor.user_id, "can_edit", v)
                      }
                    />
                    <PermissionToggle
                      label="Delete recipe"
                      enabled={Number(editor.can_delete) === 1}
                      onChange={(v) =>
                        updatePermission(editor.user_id, "can_delete", v)
                      }
                    />
                    {isOwner && (
                      <PermissionToggle
                        label="Manage editors"
                        enabled={Number(editor.can_manage_editors) === 1}
                        onChange={(v) =>
                          updatePermission(
                            editor.user_id,
                            "can_manage_editors",
                            v
                          )
                        }
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
        >
          Done
        </button>
      </div>
    </>
  );
}

function PermissionToggle({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`w-11 h-6 rounded-full transition-colors ${
          enabled ? "bg-primary-500" : "bg-gray-300"
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
            enabled ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
