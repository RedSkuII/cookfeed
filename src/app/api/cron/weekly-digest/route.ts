import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendWeeklyDigest } from "@/lib/email";

// This endpoint is called by Vercel Cron
// Configure in vercel.json to run weekly

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron (in production)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();

    // Get all users who have opted into weekly digest
    // For now, we'll check localStorage preference via a user_preferences table
    // Since localStorage is client-side, we need a server-side flag
    const usersResult = await db.execute(`
      SELECT id, email, name FROM users 
      WHERE email IS NOT NULL
    `);

    // Get users who have email preferences enabled
    const prefsResult = await db.execute(`
      SELECT user_id FROM user_preferences 
      WHERE weekly_digest = 1
    `);

    const subscribedUserIds = new Set(
      prefsResult.rows.map((r) => r.user_id as string)
    );

    // Get trending recipes from the past week (most liked)
    const recipesResult = await db.execute(`
      SELECT r.id, r.title, r.description, r.image, r.likes, u.name as author
      FROM recipes r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.visibility = 'public'
      AND r.created_at >= datetime('now', '-7 days')
      ORDER BY r.likes DESC
      LIMIT 5
    `);

    const trendingRecipes = recipesResult.rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string,
      image: row.image as string,
      author: row.author as string,
      likes: row.likes as number,
    }));

    // If no recent recipes, get all-time top recipes
    if (trendingRecipes.length === 0) {
      const allTimeResult = await db.execute(`
        SELECT r.id, r.title, r.description, r.image, r.likes, u.name as author
        FROM recipes r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.visibility = 'public'
        ORDER BY r.likes DESC
        LIMIT 5
      `);

      trendingRecipes.push(
        ...allTimeResult.rows.map((row) => ({
          id: row.id as string,
          title: row.title as string,
          description: row.description as string,
          image: row.image as string,
          author: row.author as string,
          likes: row.likes as number,
        }))
      );
    }

    // Send emails to subscribed users
    let sent = 0;
    let failed = 0;

    for (const user of usersResult.rows) {
      // Only send to users who have opted in
      if (!subscribedUserIds.has(user.id as string)) {
        continue;
      }

      const result = await sendWeeklyDigest(
        user.email as string,
        user.name as string,
        trendingRecipes
      );

      if (result.success) {
        sent++;
      } else {
        failed++;
        console.error(`Failed to send to ${user.email}:`, result.error);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      message: `Weekly digest sent`,
      stats: {
        totalUsers: usersResult.rows.length,
        subscribedUsers: subscribedUserIds.size,
        emailsSent: sent,
        emailsFailed: failed,
        recipesIncluded: trendingRecipes.length,
      },
    });
  } catch (error) {
    console.error("Weekly digest cron error:", error);
    return NextResponse.json(
      { error: "Failed to send weekly digest" },
      { status: 500 }
    );
  }
}
