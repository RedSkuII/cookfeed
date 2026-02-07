"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

type Recipe = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  visibility: string;
  tags: string[];
  likes?: number;
  comments?: number;
};

type UserProfile = {
  id: string;
  name?: string;
  bio?: string;
  profile_image?: string;
  email?: string;
  created_at?: string;
};

type ProfileData = {
  user: UserProfile;
  stats?: {
    recipes: number;
    followers: number | null;
    following: number | null;
  };
  recipes?: Recipe[];
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  isPrivate?: boolean;
};

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`/api/users/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (res.ok) {
          const profileData: ProfileData = await res.json();

          // Redirect to own profile page
          if (profileData.isOwnProfile) {
            router.replace("/profile");
            return;
          }

          setData(profileData);
          setFollowing(profileData.isFollowing || false);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [id, router]);

  async function handleFollowToggle() {
    if (followLoading) return;
    setFollowLoading(true);

    try {
      const method = following ? "DELETE" : "POST";
      const res = await fetch(`/api/users/${id}/follow`, { method });

      if (res.ok) {
        setFollowing(!following);
        // Update local stats
        if (data?.stats) {
          const currentFollowers = data.stats.followers ?? 0;
          setData({
            ...data,
            stats: {
              ...data.stats,
              followers: following
                ? Math.max(0, currentFollowers - 1)
                : currentFollowers + 1,
            },
          });
        }
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setFollowLoading(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <main className="px-4 pt-4 pb-20">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </main>
    );
  }

  // Not found
  if (notFound || !data) {
    return (
      <main className="px-4 pt-4 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/search"
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            User not found
          </h3>
          <p className="text-gray-500 mb-6">
            This account may have been removed or doesn&apos;t exist.
          </p>
          <Link href="/search" className="btn-primary inline-block">
            Back to Search
          </Link>
        </div>
      </main>
    );
  }

  const { user, stats, recipes, isPrivate } = data;

  // Private profile
  if (isPrivate) {
    return (
      <main className="px-4 pt-4 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/search"
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>

        {/* Limited Profile Info */}
        <div className="flex flex-col items-center py-8">
          <div className="w-20 h-20 bg-linear-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center overflow-hidden mb-4">
            {user.profile_image ? (
              <img
                src={user.profile_image}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl text-white font-bold">
                {user.name?.charAt(0) || "?"}
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {user.name || "User"}
          </h2>
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            This profile is private
          </h3>
          <p className="text-gray-500">
            This user has chosen to keep their profile private.
          </p>
        </div>
      </main>
    );
  }

  // Full public profile
  return (
    <main className="px-4 pt-4 pb-20">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/search"
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      </div>

      {/* Profile Info */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-linear-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center overflow-hidden">
          {user.profile_image ? (
            <img
              src={user.profile_image}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl text-white font-bold">
              {user.name?.charAt(0) || "?"}
            </span>
          )}
        </div>
        <div className="flex-1 flex justify-around">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {stats?.recipes ?? 0}
            </p>
            <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
              Recipes
            </p>
          </div>
          <Link href={`/profile/${id}/followers`} className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {stats?.followers ?? "-"}
            </p>
            <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
              Followers
            </p>
          </Link>
          <Link href={`/profile/${id}/following`} className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {stats?.following ?? "-"}
            </p>
            <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
              Following
            </p>
          </Link>
        </div>
      </div>

      {/* Name & Bio */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {user.name || "User"}
        </h2>
        {user.email && <p className="text-gray-600">{user.email}</p>}
        <p className="text-gray-600 mt-2">{user.bio || "No bio yet"}</p>
      </div>

      {/* Follow / Unfollow Button */}
      <button
        onClick={handleFollowToggle}
        disabled={followLoading}
        className={`block w-full py-2 text-center rounded-xl font-medium transition-colors mb-6 ${
          following
            ? "bg-primary-500 text-white hover:bg-primary-600"
            : "border-2 border-primary-500 text-primary-500 hover:bg-primary-50"
        } ${followLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {followLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
          </span>
        ) : following ? (
          "Following"
        ) : (
          "Follow"
        )}
      </button>

      {/* Recipes Section */}
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-900">Recipes</h3>
      </div>

      {/* Recipe Grid */}
      {!recipes || recipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📝</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No public recipes
          </h3>
          <p className="text-gray-500">
            This user hasn&apos;t shared any public recipes yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipe/${recipe.id}`}
              className="aspect-square bg-gray-200 relative overflow-hidden"
            >
              {recipe.image ? (
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl">
                  🍳
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
