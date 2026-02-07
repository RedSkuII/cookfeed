import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/users/search?q=<name> - Search users by display name
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    const db = getDb();
    const result = await db.execute({
      sql: `SELECT u.id, u.name, u.profile_image FROM users u
            LEFT JOIN user_preferences p ON u.id = p.user_id
            WHERE u.name LIKE ? AND u.id != ?
              AND (p.searchable IS NULL OR p.searchable = 1)
            LIMIT 10`,
      args: [`%${q.trim()}%`, session.user.id],
    });

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("Failed to search users:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
