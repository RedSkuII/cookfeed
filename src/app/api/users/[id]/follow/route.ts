import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/users/[id]/follow - Follow a user
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

    // Don't allow following yourself
    if (session.user.id === id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Insert follow relationship, handle duplicate gracefully
    const existing = await db.execute({
      sql: `SELECT 1 FROM followers WHERE follower_id = ? AND followed_id = ?`,
      args: [session.user.id, id],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json({ success: true, message: "Already following" });
    }

    await db.execute({
      sql: `INSERT INTO followers (follower_id, followed_id) VALUES (?, ?)`,
      args: [session.user.id, id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to follow user:", error);
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 });
  }
}

// DELETE /api/users/[id]/follow - Unfollow a user
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

    // Don't allow unfollowing yourself
    if (session.user.id === id) {
      return NextResponse.json({ error: "Cannot unfollow yourself" }, { status: 400 });
    }

    await db.execute({
      sql: `DELETE FROM followers WHERE follower_id = ? AND followed_id = ?`,
      args: [session.user.id, id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unfollow user:", error);
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 });
  }
}
