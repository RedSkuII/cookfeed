import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/db/migrate - Run database migrations
export async function GET() {
  try {
    const db = getDb();
    
    const migrations = [
      // Add show_email column to user_preferences
      `ALTER TABLE user_preferences ADD COLUMN show_email INTEGER DEFAULT 0`,
      // Add last_active column to user_preferences
      `ALTER TABLE user_preferences ADD COLUMN last_active TEXT DEFAULT (datetime('now'))`,
      // Add is_public column to collections
      `ALTER TABLE collections ADD COLUMN is_public INTEGER DEFAULT 1`,
      // Add password_hash column to users for email/password auth
      `ALTER TABLE users ADD COLUMN password_hash TEXT`,
      // Create recipe_editors table for collaborative editing
      `CREATE TABLE IF NOT EXISTS recipe_editors (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        can_edit INTEGER DEFAULT 1,
        can_delete INTEGER DEFAULT 0,
        can_manage_editors INTEGER DEFAULT 0,
        added_by TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(recipe_id, user_id)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_recipe_editors_recipe_id ON recipe_editors(recipe_id)`,
      `CREATE INDEX IF NOT EXISTS idx_recipe_editors_user_id ON recipe_editors(user_id)`,
      // Add searchable column to user_preferences
      `ALTER TABLE user_preferences ADD COLUMN searchable INTEGER DEFAULT 1`,
      // Add show_followers_list column to user_preferences (default OFF)
      `ALTER TABLE user_preferences ADD COLUMN show_followers_list INTEGER DEFAULT 0`,
      // Add color_theme column to user_preferences
      `ALTER TABLE user_preferences ADD COLUMN color_theme TEXT DEFAULT 'default'`,
    ];

    const results: { migration: string; status: string }[] = [];

    for (const migration of migrations) {
      try {
        await db.execute(migration);
        results.push({ migration: migration.substring(0, 60) + '...', status: 'success' });
      } catch (error) {
        // Column might already exist, that's ok
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('duplicate column') || errorMessage.includes('already exists')) {
          results.push({ migration: migration.substring(0, 60) + '...', status: 'skipped (already exists)' });
        } else {
          results.push({ migration: migration.substring(0, 60) + '...', status: `failed: ${errorMessage}` });
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
