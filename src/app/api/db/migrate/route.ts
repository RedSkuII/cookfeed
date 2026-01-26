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
