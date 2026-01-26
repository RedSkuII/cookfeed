import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/recipes - Get all public recipes
export async function GET() {
  try {
    const db = getDb();
    const result = await db.execute({
      sql: `SELECT r.*, u.name as author, u.profile_image as author_image,
            (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as likes,
            (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comments
            FROM recipes r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.visibility = 'public'
            ORDER BY r.created_at DESC`,
      args: [],
    });

    const recipes = result.rows.map((row) => ({
      ...row,
      tags: JSON.parse((row.tags as string) || "[]"),
    }));

    return NextResponse.json({ recipes });
  } catch (error) {
    console.error("Failed to get recipes:", error);
    return NextResponse.json({ error: "Failed to get recipes" }, { status: 500 });
  }
}

// POST /api/recipes - Create a new recipe
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
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

    if (!title || !ingredients || !instructions) {
      return NextResponse.json(
        { error: "Title, ingredients, and instructions are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.execute({
      sql: `INSERT INTO recipes (
              id, user_id, title, description, image, cook_time, servings,
              difficulty, visibility, tags, ingredients, instructions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        session.user.id,
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
      ],
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to create recipe:", error);
    return NextResponse.json({ error: "Failed to create recipe" }, { status: 500 });
  }
}
