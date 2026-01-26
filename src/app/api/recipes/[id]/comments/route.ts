import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

// POST - Add a comment to a recipe
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: recipeId } = await params;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    const db = getDb();

    // Get user
    const userResult = await db.execute({
      sql: "SELECT id, name, image FROM users WHERE email = ?",
      args: [session.user.email],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert comment
    await db.execute({
      sql: `INSERT INTO comments (id, recipe_id, user_id, content, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))`,
      args: [commentId, recipeId, user.id, content.trim()],
    });

    // Get the created comment
    const result = await db.execute({
      sql: `SELECT c.id, c.content, c.created_at, u.name as user_name, u.image as user_image
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?`,
      args: [commentId],
    });

    const comment = result.rows[0];

    return NextResponse.json({ 
      success: true, 
      comment: {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user_name: comment.user_name,
        user_image: comment.user_image,
      }
    });
  } catch (error) {
    console.error("Failed to add comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: recipeId } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
    }

    const db = getDb();

    // Get user
    const userResult = await db.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [session.user.email],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // Delete comment (only if user owns it)
    await db.execute({
      sql: "DELETE FROM comments WHERE id = ? AND recipe_id = ? AND user_id = ?",
      args: [commentId, recipeId, userId],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
