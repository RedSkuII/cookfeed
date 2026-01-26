import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/recipes/[id]/like - Like a recipe
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const db = getDb();

    // Check if already liked
    const existing = await db.execute({
      sql: `SELECT 1 FROM likes WHERE user_id = ? AND recipe_id = ?`,
      args: [session.user.id, id],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Already liked" }, { status: 400 });
    }

    await db.execute({
      sql: `INSERT INTO likes (user_id, recipe_id) VALUES (?, ?)`,
      args: [session.user.id, id],
    });

    // Get updated like count
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM likes WHERE recipe_id = ?`,
      args: [id],
    });

    return NextResponse.json({
      success: true,
      likes: countResult.rows[0].count,
    });
  } catch (error) {
    console.error("Failed to like recipe:", error);
    return NextResponse.json({ error: "Failed to like recipe" }, { status: 500 });
  }
}

// DELETE /api/recipes/[id]/like - Unlike a recipe
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const db = getDb();

    await db.execute({
      sql: `DELETE FROM likes WHERE user_id = ? AND recipe_id = ?`,
      args: [session.user.id, id],
    });

    // Get updated like count
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM likes WHERE recipe_id = ?`,
      args: [id],
    });

    return NextResponse.json({
      success: true,
      likes: countResult.rows[0].count,
    });
  } catch (error) {
    console.error("Failed to unlike recipe:", error);
    return NextResponse.json({ error: "Failed to unlike recipe" }, { status: 500 });
  }
}
