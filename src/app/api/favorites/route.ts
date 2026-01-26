import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/favorites - Get user's favorite recipes
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const result = await db.execute({
      sql: `SELECT r.*, f.collection, u.name as author, u.profile_image as author_image,
            (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as likes
            FROM favorites f
            JOIN recipes r ON f.recipe_id = r.id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC`,
      args: [session.user.id],
    });

    const favorites = result.rows.map((row) => ({
      ...row,
      tags: JSON.parse((row.tags as string) || "[]"),
    }));

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Failed to get favorites:", error);
    return NextResponse.json({ error: "Failed to get favorites" }, { status: 500 });
  }
}
