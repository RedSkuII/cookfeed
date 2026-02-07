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
      sql: `SELECT * FROM user_preferences WHERE user_id = ?`,
      args: [session.user.id],
    });

    if (result.rows.length === 0) {
      // Return default preferences
      return NextResponse.json({
        weekly_digest: true,
        push_enabled: true,
        notify_new_recipes: true,
        notify_likes: true,
        notify_comments: true,
        notify_followers: true,
        profile_public: true,
        show_activity: false,
        allow_comments: true,
        show_favorites: false,
        show_followers: true,
        show_followers_list: false,
        show_email: false,
        searchable: true,
      });
    }

    const prefs = result.rows[0];
    return NextResponse.json({
      weekly_digest: Boolean(prefs.weekly_digest),
      push_enabled: Boolean(prefs.push_enabled),
      notify_new_recipes: Boolean(prefs.notify_new_recipes),
      notify_likes: Boolean(prefs.notify_likes),
      notify_comments: Boolean(prefs.notify_comments),
      notify_followers: Boolean(prefs.notify_followers),
      profile_public: Boolean(prefs.profile_public),
      show_activity: Boolean(prefs.show_activity),
      allow_comments: Boolean(prefs.allow_comments),
      show_favorites: Boolean(prefs.show_favorites),
      show_followers: Boolean(prefs.show_followers),
      show_followers_list: Boolean(prefs.show_followers_list),
      show_email: Boolean(prefs.show_email),
      searchable: prefs.searchable !== undefined ? Boolean(prefs.searchable) : true,
    });
  } catch (error) {
    console.error("Failed to get preferences:", error);
    return NextResponse.json(
      { error: "Failed to get preferences" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const preferences = await request.json();
    const db = getDb();

    // Upsert preferences
    await db.execute({
      sql: `
        INSERT INTO user_preferences (
          user_id, weekly_digest, push_enabled, notify_new_recipes,
          notify_likes, notify_comments, notify_followers,
          profile_public, show_activity, allow_comments,
          show_favorites, show_followers, show_followers_list, show_email, searchable,
          last_active, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          weekly_digest = excluded.weekly_digest,
          push_enabled = excluded.push_enabled,
          notify_new_recipes = excluded.notify_new_recipes,
          notify_likes = excluded.notify_likes,
          notify_comments = excluded.notify_comments,
          notify_followers = excluded.notify_followers,
          profile_public = excluded.profile_public,
          show_activity = excluded.show_activity,
          allow_comments = excluded.allow_comments,
          show_favorites = excluded.show_favorites,
          show_followers = excluded.show_followers,
          show_followers_list = excluded.show_followers_list,
          show_email = excluded.show_email,
          searchable = excluded.searchable,
          last_active = datetime('now'),
          updated_at = datetime('now')
      `,
      args: [
        session.user.id,
        preferences.weekly_digest ? 1 : 0,
        preferences.push_enabled ? 1 : 0,
        preferences.notify_new_recipes ? 1 : 0,
        preferences.notify_likes ? 1 : 0,
        preferences.notify_comments ? 1 : 0,
        preferences.notify_followers ? 1 : 0,
        preferences.profile_public ? 1 : 0,
        preferences.show_activity ? 1 : 0,
        preferences.allow_comments ? 1 : 0,
        preferences.show_favorites ? 1 : 0,
        preferences.show_followers ? 1 : 0,
        preferences.show_followers_list ? 1 : 0,
        preferences.show_email ? 1 : 0,
        preferences.searchable !== undefined ? (preferences.searchable ? 1 : 0) : 1,
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
