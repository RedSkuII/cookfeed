'use server';

import { getDb } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Default collections that all users have
const DEFAULT_COLLECTIONS = ['Favorites', 'To Try', 'Weeknight', 'Special Occasions'];

// Get user's favorites
export async function getFavorites() {
  const session = await auth();
  if (!session?.user?.email) {
    return [];
  }
  
  const db = getDb();
  
  const result = await db.execute({
    sql: `SELECT r.*, f.collection, u.name as author, u.profile_image as author_image,
          (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as likes
          FROM favorites f
          JOIN recipes r ON f.recipe_id = r.id
          JOIN users fu ON f.user_id = fu.id
          LEFT JOIN users u ON r.user_id = u.id
          WHERE fu.email = ?
          ORDER BY f.created_at DESC`,
    args: [session.user.email],
  });
  
  return result.rows.map(row => ({
    ...row,
    tags: JSON.parse(row.tags as string || '[]'),
  }));
}

// Toggle favorite on a recipe
export async function toggleFavorite(recipeId: string, collection: string = 'Favorites') {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }
  
  const db = getDb();
  
  // Get user ID
  const user = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [session.user.email],
  });
  
  if (user.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const userId = user.rows[0].id as string;
  
  // Check if already favorited
  const existing = await db.execute({
    sql: 'SELECT * FROM favorites WHERE user_id = ? AND recipe_id = ?',
    args: [userId, recipeId],
  });
  
  if (existing.rows.length > 0) {
    // Remove from favorites
    await db.execute({
      sql: 'DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?',
      args: [userId, recipeId],
    });
    revalidatePath('/favorites');
    return { saved: false };
  } else {
    // Add to favorites
    await db.execute({
      sql: 'INSERT INTO favorites (user_id, recipe_id, collection) VALUES (?, ?, ?)',
      args: [userId, recipeId, collection],
    });
    revalidatePath('/favorites');
    return { saved: true };
  }
}

// Save recipe to a specific collection
export async function saveToCollection(recipeId: string, collection: string) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }
  
  const db = getDb();
  
  // Get user ID
  const user = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [session.user.email],
  });
  
  if (user.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const userId = user.rows[0].id as string;
  
  // Upsert favorite with collection
  await db.execute({
    sql: `INSERT INTO favorites (user_id, recipe_id, collection) 
          VALUES (?, ?, ?)
          ON CONFLICT(user_id, recipe_id) 
          DO UPDATE SET collection = ?`,
    args: [userId, recipeId, collection, collection],
  });
  
  revalidatePath('/favorites');
  return { success: true };
}

// Check if recipe is favorited
export async function isRecipeFavorited(recipeId: string) {
  const session = await auth();
  if (!session?.user?.email) {
    return { saved: false, collection: null };
  }
  
  const db = getDb();
  
  const result = await db.execute({
    sql: `SELECT f.collection FROM favorites f
          JOIN users u ON f.user_id = u.id
          WHERE u.email = ? AND f.recipe_id = ?`,
    args: [session.user.email, recipeId],
  });
  
  if (result.rows.length === 0) {
    return { saved: false, collection: null };
  }
  
  return { saved: true, collection: result.rows[0].collection as string };
}

// Get user's collections (default + custom)
export async function getCollections() {
  const session = await auth();
  if (!session?.user?.email) {
    return DEFAULT_COLLECTIONS;
  }
  
  const db = getDb();
  
  const result = await db.execute({
    sql: `SELECT c.name FROM collections c
          JOIN users u ON c.user_id = u.id
          WHERE u.email = ?
          ORDER BY c.created_at`,
    args: [session.user.email],
  });
  
  const customCollections = result.rows.map(row => row.name as string);
  return [...DEFAULT_COLLECTIONS, ...customCollections];
}

// Create a new collection
export async function createCollection(name: string) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }
  
  // Don't allow creating default collections
  if (DEFAULT_COLLECTIONS.includes(name)) {
    throw new Error('Collection already exists');
  }
  
  const db = getDb();
  
  // Get user ID
  const user = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [session.user.email],
  });
  
  if (user.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const userId = user.rows[0].id as string;
  const id = crypto.randomUUID();
  
  await db.execute({
    sql: 'INSERT INTO collections (id, user_id, name) VALUES (?, ?, ?)',
    args: [id, userId, name],
  });
  
  revalidatePath('/favorites');
  return { success: true };
}

// Delete a custom collection
export async function deleteCollection(name: string) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }
  
  // Don't allow deleting default collections
  if (DEFAULT_COLLECTIONS.includes(name)) {
    throw new Error('Cannot delete default collection');
  }
  
  const db = getDb();
  
  // Delete the collection
  await db.execute({
    sql: `DELETE FROM collections c
          WHERE c.name = ? AND c.user_id IN (
            SELECT id FROM users WHERE email = ?
          )`,
    args: [name, session.user.email],
  });
  
  // Move recipes in this collection to Favorites
  await db.execute({
    sql: `UPDATE favorites SET collection = 'Favorites'
          WHERE collection = ? AND user_id IN (
            SELECT id FROM users WHERE email = ?
          )`,
    args: [name, session.user.email],
  });
  
  revalidatePath('/favorites');
  return { success: true };
}
