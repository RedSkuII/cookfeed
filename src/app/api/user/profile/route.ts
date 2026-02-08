import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const result = await db.execute({
      sql: `SELECT name, bio, profile_image, email FROM users WHERE id = ?`,
      args: [session.user.id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = result.rows[0];
    return NextResponse.json({
      name: user.name || "",
      bio: user.bio || "",
      profile_image: user.profile_image || null,
      email: user.email || "",
    });
  } catch (error) {
    console.error("Failed to get user profile:", error);
    return NextResponse.json(
      { error: "Failed to get user profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, bio, profile_image } = await request.json();
    const db = getDb();

    await db.execute({
      sql: `UPDATE users SET name = ?, bio = ?, profile_image = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [name || null, bio || null, profile_image || null, session.user.id],
    });

    return NextResponse.json({
      name: name || "",
      bio: bio || "",
      profile_image: profile_image || null,
    });
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
