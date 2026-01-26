import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/db/debug - Debug database contents
export async function GET() {
  try {
    const db = getDb();
    
    // Get all tables
    const tables = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    
    // Get counts from each table
    const counts: Record<string, number> = {};
    for (const row of tables.rows) {
      const tableName = row.name as string;
      if (!tableName.startsWith('_') && !tableName.startsWith('sqlite')) {
        try {
          const result = await db.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
          counts[tableName] = Number(result.rows[0]?.count || 0);
        } catch {
          counts[tableName] = -1; // Error getting count
        }
      }
    }
    
    // Get sample recipes
    const recipes = await db.execute("SELECT id, title, user_id, created_at FROM recipes LIMIT 10");
    
    // Get sample users
    const users = await db.execute("SELECT id, email, name, created_at FROM users LIMIT 10");
    
    return NextResponse.json({
      success: true,
      tables: tables.rows.map(r => r.name),
      counts,
      sampleRecipes: recipes.rows,
      sampleUsers: users.rows,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
