import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/collections - Get user's collections
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const result = await db.execute({
      sql: `SELECT c.*, 
            (SELECT COUNT(*) FROM favorites f WHERE f.user_id = c.user_id AND f.collection = c.name) as recipe_count
            FROM collections c
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC`,
      args: [session.user.id],
    });

    return NextResponse.json({ collections: result.rows });
  } catch (error) {
    console.error("Failed to get collections:", error);
    return NextResponse.json({ error: "Failed to get collections" }, { status: 500 });
  }
}

// POST /api/collections - Create a new collection
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, is_public = true } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Collection name required" }, { status: 400 });
    }

    const db = getDb();
    const id = `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.execute({
      sql: `INSERT INTO collections (id, user_id, name, is_public, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))`,
      args: [id, session.user.id, name.trim(), is_public ? 1 : 0],
    });

    return NextResponse.json({ 
      success: true, 
      collection: { id, name: name.trim(), is_public, recipe_count: 0 } 
    });
  } catch (error) {
    console.error("Failed to create collection:", error);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}

// PUT /api/collections - Update a collection's privacy
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, name, is_public } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Collection ID required" }, { status: 400 });
    }

    const db = getDb();

    // Build update query based on provided fields
    const updates: string[] = [];
    const args: (string | number)[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      args.push(name);
    }
    if (is_public !== undefined) {
      updates.push("is_public = ?");
      args.push(is_public ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    args.push(id, session.user.id);

    await db.execute({
      sql: `UPDATE collections SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`,
      args,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update collection:", error);
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}

// DELETE /api/collections - Delete a collection
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Collection ID required" }, { status: 400 });
    }

    const db = getDb();

    // Get collection name first
    const collResult = await db.execute({
      sql: `SELECT name FROM collections WHERE id = ? AND user_id = ?`,
      args: [id, session.user.id],
    });

    if (collResult.rows.length === 0) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const collectionName = collResult.rows[0].name;

    // Move recipes to default "Favorites" collection
    await db.execute({
      sql: `UPDATE favorites SET collection = 'Favorites' WHERE user_id = ? AND collection = ?`,
      args: [session.user.id, collectionName],
    });

    // Delete collection
    await db.execute({
      sql: `DELETE FROM collections WHERE id = ? AND user_id = ?`,
      args: [id, session.user.id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete collection:", error);
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
  }
}
