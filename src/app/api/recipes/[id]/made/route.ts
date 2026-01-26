import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/recipes/[id]/made - Mark as made
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

    // Check if already marked as made
    const existing = await db.execute({
      sql: `SELECT 1 FROM made_recipes WHERE user_id = ? AND recipe_id = ?`,
      args: [session.user.id, id],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Already marked as made" }, { status: 400 });
    }

    await db.execute({
      sql: `INSERT INTO made_recipes (user_id, recipe_id) VALUES (?, ?)`,
      args: [session.user.id, id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark as made:", error);
    return NextResponse.json({ error: "Failed to mark as made" }, { status: 500 });
  }
}

// DELETE /api/recipes/[id]/made - Unmark as made
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
      sql: `DELETE FROM made_recipes WHERE user_id = ? AND recipe_id = ?`,
      args: [session.user.id, id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unmark as made:", error);
    return NextResponse.json({ error: "Failed to unmark as made" }, { status: 500 });
  }
}
