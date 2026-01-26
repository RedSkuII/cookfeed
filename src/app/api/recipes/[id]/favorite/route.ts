import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/recipes/[id]/favorite - Add to favorites
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
    const body = await request.json().catch(() => ({}));
    const collection = body.collection || "Favorites";
    const db = getDb();

    // Check if already favorited
    const existing = await db.execute({
      sql: `SELECT 1 FROM favorites WHERE user_id = ? AND recipe_id = ?`,
      args: [session.user.id, id],
    });

    if (existing.rows.length > 0) {
      // Update collection
      await db.execute({
        sql: `UPDATE favorites SET collection = ? WHERE user_id = ? AND recipe_id = ?`,
        args: [collection, session.user.id, id],
      });
    } else {
      await db.execute({
        sql: `INSERT INTO favorites (user_id, recipe_id, collection) VALUES (?, ?, ?)`,
        args: [session.user.id, id, collection],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to favorite recipe:", error);
    return NextResponse.json({ error: "Failed to favorite recipe" }, { status: 500 });
  }
}

// DELETE /api/recipes/[id]/favorite - Remove from favorites
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
      sql: `DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?`,
      args: [session.user.id, id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove favorite:", error);
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }
}
