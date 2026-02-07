// Database configuration - supports both local SQLite and Turso
// For local development: uses better-sqlite3
// For production (Vercel): uses @libsql/client for Turso

import { createClient } from "@libsql/client";

// For local development without Turso
const localDbUrl = "file:./local.db";

export function getDbClient() {
  // Read env vars at runtime (not at module load time)
  const tursoDbUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;
  const isDev = process.env.NODE_ENV === "development";

  // If we have Turso credentials, use them
  if (tursoDbUrl) {
    return createClient({
      url: tursoDbUrl,
      authToken: tursoAuthToken,
    });
  }

  // Local development mode without Turso
  if (isDev) {
    return createClient({
      url: localDbUrl,
    });
  }

  // Production mode requires Turso
  throw new Error("TURSO_DATABASE_URL is required in production");
}

// Database instance (lazy initialization)
let db: ReturnType<typeof getDbClient> | null = null;

export function getDb() {
  if (!db) {
    db = getDbClient();
  }
  return db;
}

// Database schema SQL - run this to initialize your database
export const schema = `
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    bio TEXT,
    profile_image TEXT,
    password_hash TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Recipes table
  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    cook_time TEXT,
    servings TEXT,
    difficulty TEXT,
    visibility TEXT DEFAULT 'public',
    tags TEXT DEFAULT '[]',
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    author TEXT,
    likes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Comments table
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_image TEXT,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Followers table (many-to-many)
  CREATE TABLE IF NOT EXISTS followers (
    follower_id TEXT NOT NULL,
    followed_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (follower_id, followed_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Favorites table (many-to-many with collections)
  CREATE TABLE IF NOT EXISTS favorites (
    user_id TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    collection TEXT DEFAULT 'Favorites',
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  -- Likes table (many-to-many)
  CREATE TABLE IF NOT EXISTS likes (
    user_id TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  -- Made recipes table (tracks recipes user has made)
  CREATE TABLE IF NOT EXISTS made_recipes (
    user_id TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  -- Collections table (custom user collections)
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_public INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
  );

  -- User preferences table (for email and notification settings)
  CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    weekly_digest INTEGER DEFAULT 1,
    push_enabled INTEGER DEFAULT 1,
    notify_new_recipes INTEGER DEFAULT 1,
    notify_likes INTEGER DEFAULT 1,
    notify_comments INTEGER DEFAULT 1,
    notify_followers INTEGER DEFAULT 1,
    profile_public INTEGER DEFAULT 1,
    show_activity INTEGER DEFAULT 0,
    allow_comments INTEGER DEFAULT 1,
    show_favorites INTEGER DEFAULT 0,
    show_followers INTEGER DEFAULT 1,
    show_email INTEGER DEFAULT 0,
    searchable INTEGER DEFAULT 1,
    last_active TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Recipe editors table (collaborative editing permissions)
  CREATE TABLE IF NOT EXISTS recipe_editors (
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
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
  CREATE INDEX IF NOT EXISTS idx_recipes_visibility ON recipes(visibility);
  CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
  CREATE INDEX IF NOT EXISTS idx_comments_recipe_id ON comments(recipe_id);
  CREATE INDEX IF NOT EXISTS idx_followers_followed_id ON followers(followed_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_likes_recipe_id ON likes(recipe_id);
  CREATE INDEX IF NOT EXISTS idx_made_recipes_user_id ON made_recipes(user_id);
  CREATE INDEX IF NOT EXISTS idx_recipe_editors_recipe_id ON recipe_editors(recipe_id);
  CREATE INDEX IF NOT EXISTS idx_recipe_editors_user_id ON recipe_editors(user_id);
`;

// Initialize database schema
export async function initializeDatabase() {
  const client = getDb();
  
  // Split schema into individual statements and execute
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await client.execute(statement);
  }

  console.log("Database schema initialized successfully");
}
