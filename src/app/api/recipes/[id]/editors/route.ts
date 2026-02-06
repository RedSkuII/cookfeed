import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// Helper: check if user is owner or has can_manage_editors permission
async function canManageEditors(
  db: ReturnType<typeof getDb>,
  recipeId: string,
  userId: string
): Promise<{ allowed: boolean; isOwner: boolean; recipeOwnerId: string | null }> {
  const recipe = await db.execute({
    sql: `SELECT user_id FROM recipes WHERE id = ?`,
    args: [recipeId],
  });

  if (recipe.rows.length === 0) {
    return { allowed: false, isOwner: false, recipeOwnerId: null };
  }

  const recipeOwnerId = recipe.rows[0].user_id as string;
  const isOwner = recipeOwnerId === userId;

  if (isOwner) {
    return { allowed: true, isOwner: true, recipeOwnerId };
  }

  const editorCheck = await db.execute({
    sql: `SELECT can_manage_editors FROM recipe_editors
          WHERE recipe_id = ? AND user_id = ?`,
    args: [recipeId, userId],
  });

  const allowed =
    editorCheck.rows.length > 0 &&
    Number(editorCheck.rows[0].can_manage_editors) === 1;

  return { allowed, isOwner: false, recipeOwnerId };
}

// GET /api/recipes/[id]/editors - List all editors for a recipe
export async function GET(
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

    const { allowed, isOwner, recipeOwnerId } = await canManageEditors(
      db,
      id,
      session.user.id
    );

    if (!recipeOwnerId) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const editors = await db.execute({
      sql: `SELECT re.*, u.name, u.profile_image
            FROM recipe_editors re
            JOIN users u ON re.user_id = u.id
            WHERE re.recipe_id = ?
            ORDER BY re.created_at ASC`,
      args: [id],
    });

    return NextResponse.json({ editors: editors.rows, isOwner });
  } catch (error) {
    console.error("Failed to get editors:", error);
    return NextResponse.json(
      { error: "Failed to get editors" },
      { status: 500 }
    );
  }
}

// POST /api/recipes/[id]/editors - Add an editor
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
    const body = await request.json();
    const { user_id, can_edit, can_delete, can_manage_editors: canManage } = body;
    const db = getDb();

    const { allowed, recipeOwnerId } = await canManageEditors(
      db,
      id,
      session.user.id
    );

    if (!recipeOwnerId) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user_id === recipeOwnerId) {
      return NextResponse.json(
        { error: "Cannot add recipe owner as editor" },
        { status: 400 }
      );
    }

    const editorId = `editor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.execute({
      sql: `INSERT OR REPLACE INTO recipe_editors
            (id, recipe_id, user_id, can_edit, can_delete, can_manage_editors, added_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        editorId,
        id,
        user_id,
        can_edit ? 1 : 0,
        can_delete ? 1 : 0,
        canManage ? 1 : 0,
        session.user.id,
      ],
    });

    return NextResponse.json({ success: true, id: editorId });
  } catch (error) {
    console.error("Failed to add editor:", error);
    return NextResponse.json(
      { error: "Failed to add editor" },
      { status: 500 }
    );
  }
}

// PUT /api/recipes/[id]/editors - Update an editor's permissions
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
    const { user_id, can_edit, can_delete, can_manage_editors: canManage } = body;
    const db = getDb();

    const { allowed, recipeOwnerId } = await canManageEditors(
      db,
      id,
      session.user.id
    );

    if (!recipeOwnerId) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.execute({
      sql: `UPDATE recipe_editors
            SET can_edit = ?, can_delete = ?, can_manage_editors = ?,
                updated_at = datetime('now')
            WHERE recipe_id = ? AND user_id = ?`,
      args: [can_edit ? 1 : 0, can_delete ? 1 : 0, canManage ? 1 : 0, id, user_id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update editor:", error);
    return NextResponse.json(
      { error: "Failed to update editor" },
      { status: 500 }
    );
  }
}

// DELETE /api/recipes/[id]/editors - Remove an editor
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
    const { searchParams } = new URL(request.url);
    const editorUserId = searchParams.get("user_id");
    const db = getDb();

    if (!editorUserId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const { allowed, recipeOwnerId } = await canManageEditors(
      db,
      id,
      session.user.id
    );

    if (!recipeOwnerId) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Allow: owner/manager, or an editor removing themselves
    const isSelfRemoval = editorUserId === session.user.id;
    if (!allowed && !isSelfRemoval) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.execute({
      sql: `DELETE FROM recipe_editors WHERE recipe_id = ? AND user_id = ?`,
      args: [id, editorUserId],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove editor:", error);
    return NextResponse.json(
      { error: "Failed to remove editor" },
      { status: 500 }
    );
  }
}
