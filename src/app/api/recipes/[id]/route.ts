import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/recipes/[id] - Get a single recipe
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const session = await auth();

    const result = await db.execute({
      sql: `SELECT r.*, u.name as author, u.profile_image as author_image,
            (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as likes,
            (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comment_count,
            p.allow_comments
            FROM recipes r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN user_preferences p ON r.user_id = p.user_id
            WHERE r.id = ?`,
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const row = result.rows[0];
    const recipe = {
      ...row,
      tags: JSON.parse((row.tags as string) || "[]"),
    };

    // Default to allowing comments if no preference set
    const allowComments = row.allow_comments !== 0;

    // Check if current user has liked this recipe
    let hasLiked = false;
    let hasMade = false;
    let isFavorited = false;

    if (session?.user?.id) {
      const likeResult = await db.execute({
        sql: `SELECT 1 FROM likes WHERE user_id = ? AND recipe_id = ?`,
        args: [session.user.id, id],
      });
      hasLiked = likeResult.rows.length > 0;

      const madeResult = await db.execute({
        sql: `SELECT 1 FROM made_recipes WHERE user_id = ? AND recipe_id = ?`,
        args: [session.user.id, id],
      });
      hasMade = madeResult.rows.length > 0;

      const favResult = await db.execute({
        sql: `SELECT 1 FROM favorites WHERE user_id = ? AND recipe_id = ?`,
        args: [session.user.id, id],
      });
      isFavorited = favResult.rows.length > 0;
    }

    // Check if current user has editor permissions
    let editorPermissions = null;
    if (session?.user?.id && row.user_id !== session.user.id) {
      const editorResult = await db.execute({
        sql: `SELECT can_edit, can_delete, can_manage_editors
              FROM recipe_editors
              WHERE recipe_id = ? AND user_id = ?`,
        args: [id, session.user.id],
      });
      if (editorResult.rows.length > 0) {
        editorPermissions = editorResult.rows[0];
      }
    }

    // Get comments
    const commentsResult = await db.execute({
      sql: `SELECT c.*, u.name as user_name, u.profile_image as user_image
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.recipe_id = ?
            ORDER BY c.created_at DESC`,
      args: [id],
    });

    return NextResponse.json({
      recipe,
      hasLiked,
      hasMade,
      isFavorited,
      allowComments,
      comments: commentsResult.rows,
      editorPermissions,
    });
  } catch (error) {
    console.error("Failed to get recipe:", error);
    return NextResponse.json({ error: "Failed to get recipe" }, { status: 500 });
  }
}

// DELETE /api/recipes/[id] - Delete a recipe
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

    // Check if user owns this recipe or has delete permission
    const result = await db.execute({
      sql: `SELECT user_id FROM recipes WHERE id = ?`,
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const isOwner = result.rows[0].user_id === session.user.id;

    if (!isOwner) {
      const editorResult = await db.execute({
        sql: `SELECT can_delete FROM recipe_editors
              WHERE recipe_id = ? AND user_id = ?`,
        args: [id, session.user.id],
      });

      if (editorResult.rows.length === 0 || Number(editorResult.rows[0].can_delete) !== 1) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    await db.execute({
      sql: `DELETE FROM recipes WHERE id = ?`,
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete recipe:", error);
    return NextResponse.json({ error: "Failed to delete recipe" }, { status: 500 });
  }
}

// PUT /api/recipes/[id] - Update a recipe
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    // Check if user owns this recipe or has edit permission
    const result = await db.execute({
      sql: `SELECT user_id FROM recipes WHERE id = ?`,
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const isOwner = result.rows[0].user_id === session.user.id;

    if (!isOwner) {
      const editorResult = await db.execute({
        sql: `SELECT can_edit FROM recipe_editors
              WHERE recipe_id = ? AND user_id = ?`,
        args: [id, session.user.id],
      });

      if (editorResult.rows.length === 0 || Number(editorResult.rows[0].can_edit) !== 1) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const {
      title,
      description,
      image,
      cook_time,
      servings,
      difficulty,
      visibility,
      tags,
      ingredients,
      instructions,
    } = body;

    await db.execute({
      sql: `UPDATE recipes SET
              title = ?, description = ?, image = ?, cook_time = ?,
              servings = ?, difficulty = ?, visibility = ?, tags = ?,
              ingredients = ?, instructions = ?, updated_at = datetime('now')
            WHERE id = ?`,
      args: [
        title,
        description || null,
        image || null,
        cook_time || null,
        servings || null,
        difficulty || null,
        visibility || "public",
        JSON.stringify(tags || []),
        typeof ingredients === "string" ? ingredients : JSON.stringify(ingredients),
        typeof instructions === "string" ? instructions : JSON.stringify(instructions),
        id,
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update recipe:", error);
    return NextResponse.json({ error: "Failed to update recipe" }, { status: 500 });
  }
}
