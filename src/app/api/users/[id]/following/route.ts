import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/users/[id]/following - Get list of users this user follows
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const session = await auth();
    const isOwnProfile = session?.user?.id === id;

    // Check user exists
    const userResult = await db.execute({
      sql: `SELECT id, name FROM users WHERE id = ?`,
      args: [id],
    });
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check privacy preference
    if (!isOwnProfile) {
      const prefsResult = await db.execute({
        sql: `SELECT show_followers_list FROM user_preferences WHERE user_id = ?`,
        args: [id],
      });
      const showList = prefsResult.rows[0]?.show_followers_list ?? 0;
      if (!showList) {
        return NextResponse.json(
          { error: "Following list is private", private: true },
          { status: 403 }
        );
      }
    }

    // Fetch following (people this user follows)
    const result = await db.execute({
      sql: `SELECT
              u.id, u.name, u.email, u.profile_image,
              (SELECT COUNT(*) FROM recipes r WHERE r.user_id = u.id AND r.visibility = 'public') as recipe_count,
              (SELECT COUNT(*) FROM followers f2 WHERE f2.followed_id = u.id) as follower_count
            FROM followers f
            JOIN users u ON u.id = f.followed_id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC`,
      args: [id],
    });

    // For each user, check if the current viewer follows them
    const users = result.rows.map((row) => ({
      id: row.id as string,
      name: row.name,
      email: row.email,
      profile_image: row.profile_image,
      recipe_count: row.recipe_count,
      follower_count: row.follower_count,
      is_following: false as boolean,
    }));

    if (session?.user?.id) {
      const followingResult = await db.execute({
        sql: `SELECT followed_id FROM followers WHERE follower_id = ?`,
        args: [session.user.id],
      });
      const followingSet = new Set(
        followingResult.rows.map((r) => r.followed_id as string)
      );
      for (const user of users) {
        user.is_following = followingSet.has(user.id);
      }
    }

    return NextResponse.json({
      users,
      profileName: userResult.rows[0].name,
    });
  } catch (error) {
    console.error("Failed to get following:", error);
    return NextResponse.json(
      { error: "Failed to get following" },
      { status: 500 }
    );
  }
}
