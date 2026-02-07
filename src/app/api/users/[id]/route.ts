import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/users/[id] - Get a user's public profile
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const session = await auth();
    const isOwnProfile = session?.user?.id === id;

    // Get user basic info
    const userResult = await db.execute({
      sql: `SELECT id, name, bio, profile_image, email, created_at FROM users WHERE id = ?`,
      args: [id],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Get user's privacy preferences
    const prefsResult = await db.execute({
      sql: `SELECT * FROM user_preferences WHERE user_id = ?`,
      args: [id],
    });

    // Default preferences if none set
    const prefs = prefsResult.rows[0] || {
      profile_public: 1,
      show_activity: 0,
      show_followers: 1,
      show_favorites: 0,
      show_email: 0,
      allow_comments: 1,
      show_followers_list: 0,
      last_active: null,
    };

    // If profile is private and not own profile, return limited info
    if (!prefs.profile_public && !isOwnProfile) {
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          profile_image: user.profile_image,
        },
        isPrivate: true,
      });
    }

    // Build public profile response
    const profile: Record<string, unknown> = {
      id: user.id,
      name: user.name,
      bio: user.bio,
      profile_image: user.profile_image,
      created_at: user.created_at,
    };

    // Show email only if setting is enabled
    if (prefs.show_email || isOwnProfile) {
      profile.email = user.email;
    }

    // Show activity status only if setting is enabled
    if (prefs.show_activity || isOwnProfile) {
      profile.last_active = prefs.last_active;
    }

    // Get follower/following counts
    let followers = 0;
    let following = 0;
    
    if (prefs.show_followers || isOwnProfile) {
      const followersResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM followers WHERE followed_id = ?`,
        args: [id],
      });
      followers = Number(followersResult.rows[0]?.count) || 0;

      const followingResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM followers WHERE follower_id = ?`,
        args: [id],
      });
      following = Number(followingResult.rows[0]?.count) || 0;
    }

    // Get public recipes count
    const recipesResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM recipes WHERE user_id = ? AND visibility = 'public'`,
      args: [id],
    });
    const recipeCount = Number(recipesResult.rows[0]?.count) || 0;

    // Get public recipes
    const publicRecipesResult = await db.execute({
      sql: `SELECT r.*, 
            (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as likes,
            (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comments
            FROM recipes r
            WHERE r.user_id = ? AND r.visibility = 'public'
            ORDER BY r.created_at DESC
            LIMIT 20`,
      args: [id],
    });

    const recipes = publicRecipesResult.rows.map((row) => ({
      ...row,
      tags: JSON.parse((row.tags as string) || "[]"),
    }));

    // Get favorites only if setting is enabled
    let favorites: unknown[] = [];
    if (prefs.show_favorites || isOwnProfile) {
      const favoritesResult = await db.execute({
        sql: `SELECT r.id, r.title, r.image, f.collection, c.is_public as collection_public
              FROM favorites f
              JOIN recipes r ON f.recipe_id = r.id
              LEFT JOIN collections c ON f.collection = c.name AND c.user_id = f.user_id
              WHERE f.user_id = ? AND (c.is_public = 1 OR c.is_public IS NULL OR ? = 1)
              ORDER BY f.created_at DESC
              LIMIT 20`,
        args: [id, isOwnProfile ? 1 : 0],
      });
      favorites = favoritesResult.rows;
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (session?.user?.id && session.user.id !== id) {
      const followResult = await db.execute({
        sql: `SELECT 1 FROM followers WHERE follower_id = ? AND followed_id = ?`,
        args: [session.user.id, id],
      });
      isFollowing = followResult.rows.length > 0;
    }

    return NextResponse.json({
      user: profile,
      stats: {
        recipes: recipeCount,
        followers: prefs.show_followers || isOwnProfile ? followers : null,
        following: prefs.show_followers || isOwnProfile ? following : null,
      },
      recipes,
      favorites: prefs.show_favorites || isOwnProfile ? favorites : null,
      isFollowing,
      isOwnProfile,
      settings: isOwnProfile ? {
        profile_public: Boolean(prefs.profile_public),
        show_activity: Boolean(prefs.show_activity),
        show_followers: Boolean(prefs.show_followers),
        show_favorites: Boolean(prefs.show_favorites),
        show_email: Boolean(prefs.show_email),
        allow_comments: Boolean(prefs.allow_comments),
        show_followers_list: Boolean(prefs.show_followers_list),
      } : null,
    });
  } catch (error) {
    console.error("Failed to get user profile:", error);
    return NextResponse.json({ error: "Failed to get profile" }, { status: 500 });
  }
}
