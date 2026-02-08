import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

// POST - Add a comment to a recipe
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: recipeId } = await params;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    const db = getDb();

    // Check if recipe owner allows comments
    const recipeResult = await db.execute({
      sql: `SELECT r.user_id, p.allow_comments 
            FROM recipes r 
            LEFT JOIN user_preferences p ON r.user_id = p.user_id 
            WHERE r.id = ?`,
      args: [recipeId],
    });

    if (recipeResult.rows.length === 0) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Default to allowing comments if no preference set
    const allowComments = recipeResult.rows[0].allow_comments !== 0;
    if (!allowComments) {
      return NextResponse.json({ error: "Comments are disabled for this recipe" }, { status: 403 });
    }

    // Get user info for comment
    const userResult = await db.execute({
      sql: "SELECT id, name, profile_image FROM users WHERE id = ?",
      args: [session.user.id],
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
      args: [commentId, recipeId, session.user.id, content.trim()],
    });

    // Get the created comment
    const result = await db.execute({
      sql: `SELECT c.id, c.content, c.created_at, u.name as user_name, u.profile_image as user_image
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
        user_id: session.user.id,
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

// DELETE - Delete a comment (own comment or recipe owner can delete any)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: recipeId } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
    }

    const db = getDb();

    // Check if user owns the comment or owns the recipe
    const recipeResult = await db.execute({
      sql: "SELECT user_id FROM recipes WHERE id = ?",
      args: [recipeId],
    });
    const isRecipeOwner = recipeResult.rows.length > 0 && recipeResult.rows[0].user_id === session.user.id;

    if (isRecipeOwner) {
      // Recipe owner can delete any comment on their recipe
      await db.execute({
        sql: "DELETE FROM comments WHERE id = ? AND recipe_id = ?",
        args: [commentId, recipeId],
      });
    } else {
      // Otherwise only delete own comments
      await db.execute({
        sql: "DELETE FROM comments WHERE id = ? AND recipe_id = ? AND user_id = ?",
        args: [commentId, recipeId, session.user.id],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}

// PUT - Edit a comment (only own comments)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: recipeId } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");
    const { content } = await request.json();

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    const db = getDb();

    // Only allow editing own comments
    const result = await db.execute({
      sql: "UPDATE comments SET content = ? WHERE id = ? AND recipe_id = ? AND user_id = ?",
      args: [content.trim(), commentId, recipeId, session.user.id],
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Comment not found or not yours" }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to edit comment:", error);
    return NextResponse.json(
      { error: "Failed to edit comment" },
      { status: 500 }
    );
  }
}
