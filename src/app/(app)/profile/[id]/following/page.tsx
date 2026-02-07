"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";

type UserItem = {
  id: string;
  name: string;
  email?: string;
  profile_image?: string;
  recipe_count?: number;
  follower_count?: number;
  is_following?: boolean;
};

export default function FollowingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/users/${id}/following`);
        if (res.status === 403) {
          const data = await res.json();
          if (data.private) {
            setIsPrivate(true);
            try {
              const profileRes = await fetch(`/api/users/${id}`);
              if (profileRes.ok) {
                const profileData = await profileRes.json();
                setProfileName(profileData.user?.name || "User");
              }
            } catch {}
          }
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
          setProfileName(data.profileName || "User");
          const following = new Set<string>();
          for (const u of data.users || []) {
            if (u.is_following) following.add(u.id);
          }
          setFollowingIds(following);
        }
      } catch (error) {
        console.error("Failed to load following:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleFollow = async (userId: string) => {
    if (!session?.user?.id) return;
    const isFollowing = followingIds.has(userId);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (res.ok) {
        setFollowingIds((prev) => {
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
    <main className="px-4 pt-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/profile/${id}`}
          className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center shrink-0"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-extrabold text-gray-900">
          {profileName ? `${profileName}'s Following` : "Following"}
        </h1>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Private */}
      {!loading && isPrivate && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Following List is Private</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            {profileName || "This user"} has chosen to keep their following list private.
          </p>
        </div>
      )}

      {/* Empty */}
      {!loading && !isPrivate && users.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Not following anyone yet</h3>
          <p className="text-sm text-gray-500">When this account follows people, they&apos;ll show up here.</p>
        </div>
      )}

      {/* User List */}
      {!loading && !isPrivate && users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => {
            const isFollowing = followingIds.has(user.id);
            const isSelf = session?.user?.id === user.id;
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
                {!isSelf && session?.user?.id && (
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
