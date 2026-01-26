import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/user/recipes - Get current user's recipes
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    
    // Get user's recipes
    const recipesResult = await db.execute({
      sql: `SELECT r.*, 
            (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as likes,
            (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comments
            FROM recipes r
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC`,
      args: [session.user.id],
    });

    const recipes = recipesResult.rows.map((row) => ({
      ...row,
      tags: JSON.parse((row.tags as string) || "[]"),
    }));

    // Get "made" recipes
    const madeResult = await db.execute({
      sql: `SELECT r.*, u.name as author, u.profile_image as author_image,
            (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as likes
            FROM made_recipes m
            JOIN recipes r ON m.recipe_id = r.id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE m.user_id = ?
            ORDER BY m.created_at DESC`,
      args: [session.user.id],
    });

    const madeRecipes = madeResult.rows.map((row) => ({
      ...row,
      tags: JSON.parse((row.tags as string) || "[]"),
    }));

    return NextResponse.json({ recipes, madeRecipes });
  } catch (error) {
    console.error("Failed to get user recipes:", error);
    return NextResponse.json({ error: "Failed to get recipes" }, { status: 500 });
  }
}
