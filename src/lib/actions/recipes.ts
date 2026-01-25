'use server';

import { getDb } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image?: string;
  cook_time?: string;
  servings?: string;
  difficulty?: string;
  visibility: string;
  tags: string[];
  ingredients: string;
  instructions: string;
  author?: string;
  likes: number;
  created_at: string;
  updated_at: string;
}

// Get all public recipes for the feed
export async function getPublicRecipes() {
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
  
  return result.rows.map(row => ({
    ...row,
    tags: JSON.parse(row.tags as string || '[]'),
  }));
}

// Get a single recipe by ID
export async function getRecipeById(id: string) {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT r.*, u.name as author, u.profile_image as author_image,
          (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as likes,
          (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comment_count
          FROM recipes r
          LEFT JOIN users u ON r.user_id = u.id
          WHERE r.id = ?`,
    args: [id],
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    ...row,
    tags: JSON.parse(row.tags as string || '[]'),
  };
}

// Get recipes by user
export async function getUserRecipes(userId: string, visibility?: string) {
  const db = getDb();
  let sql = `SELECT r.*, 
             (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as likes,
             (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comments
             FROM recipes r WHERE r.user_id = ?`;
  const args: (string | undefined)[] = [userId];
  
  if (visibility) {
    sql += ` AND r.visibility = ?`;
    args.push(visibility);
  }
  
  sql += ` ORDER BY r.created_at DESC`;
  
  const result = await db.execute({ sql, args });
  
  return result.rows.map(row => ({
    ...row,
    tags: JSON.parse(row.tags as string || '[]'),
  }));
}

// Create a new recipe
export async function createRecipe(data: {
  title: string;
  description?: string;
  image?: string;
  cook_time?: string;
  servings?: string;
  difficulty?: string;
  visibility?: string;
  tags?: string[];
  ingredients: string;
  instructions: string;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }
  
  const db = getDb();
  
  // Get or create user
  const userResult = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [session.user.email],
  });
  
  let userId: string;
  if (userResult.rows.length === 0) {
    userId = crypto.randomUUID();
    await db.execute({
      sql: 'INSERT INTO users (id, email, name, profile_image) VALUES (?, ?, ?, ?)',
      args: [userId, session.user.email, session.user.name || 'User', session.user.image || null],
    });
  } else {
    userId = userResult.rows[0].id as string;
  }
  
  const id = Date.now().toString();
  
  await db.execute({
    sql: `INSERT INTO recipes (id, user_id, title, description, image, cook_time, servings, difficulty, visibility, tags, ingredients, instructions, author)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      userId,
      data.title,
      data.description || null,
      data.image || null,
      data.cook_time || null,
      data.servings || null,
      data.difficulty || null,
      data.visibility || 'public',
      JSON.stringify(data.tags || []),
      data.ingredients,
      data.instructions,
      session.user.name || 'User',
    ],
  });
  
  revalidatePath('/feed');
  revalidatePath('/profile');
  
  return { id };
}

// Update a recipe
export async function updateRecipe(id: string, data: {
  title?: string;
  description?: string;
  image?: string;
  cook_time?: string;
  servings?: string;
  difficulty?: string;
  visibility?: string;
  tags?: string[];
  ingredients?: string;
  instructions?: string;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }
  
  const db = getDb();
  
  // Verify ownership
  const recipe = await db.execute({
    sql: 'SELECT r.* FROM recipes r JOIN users u ON r.user_id = u.id WHERE r.id = ? AND u.email = ?',
    args: [id, session.user.email],
  });
  
  if (recipe.rows.length === 0) {
    throw new Error('Recipe not found or not authorized');
  }
  
  const updates: string[] = [];
  const args: (string | null)[] = [];
  
  if (data.title !== undefined) { updates.push('title = ?'); args.push(data.title); }
  if (data.description !== undefined) { updates.push('description = ?'); args.push(data.description); }
  if (data.image !== undefined) { updates.push('image = ?'); args.push(data.image); }
  if (data.cook_time !== undefined) { updates.push('cook_time = ?'); args.push(data.cook_time); }
  if (data.servings !== undefined) { updates.push('servings = ?'); args.push(data.servings); }
  if (data.difficulty !== undefined) { updates.push('difficulty = ?'); args.push(data.difficulty); }
  if (data.visibility !== undefined) { updates.push('visibility = ?'); args.push(data.visibility); }
  if (data.tags !== undefined) { updates.push('tags = ?'); args.push(JSON.stringify(data.tags)); }
  if (data.ingredients !== undefined) { updates.push('ingredients = ?'); args.push(data.ingredients); }
  if (data.instructions !== undefined) { updates.push('instructions = ?'); args.push(data.instructions); }
  
  updates.push("updated_at = datetime('now')");
  args.push(id);
  
  await db.execute({
    sql: `UPDATE recipes SET ${updates.join(', ')} WHERE id = ?`,
    args,
  });
  
  revalidatePath('/feed');
  revalidatePath(`/recipe/${id}`);
  revalidatePath('/profile');
  
  return { success: true };
}

// Delete a recipe
export async function deleteRecipe(id: string) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }
  
  const db = getDb();
  
  // Verify ownership
  const recipe = await db.execute({
    sql: 'SELECT r.* FROM recipes r JOIN users u ON r.user_id = u.id WHERE r.id = ? AND u.email = ?',
    args: [id, session.user.email],
  });
  
  if (recipe.rows.length === 0) {
    throw new Error('Recipe not found or not authorized');
  }
  
  await db.execute({
    sql: 'DELETE FROM recipes WHERE id = ?',
    args: [id],
  });
  
  revalidatePath('/feed');
  revalidatePath('/profile');
  
  return { success: true };
}

// Search recipes
export async function searchRecipes(query: string) {
  const db = getDb();
  const searchTerm = `%${query}%`;
  
  const result = await db.execute({
    sql: `SELECT r.*, u.name as author, u.profile_image as author_image,
          (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as likes
          FROM recipes r
          LEFT JOIN users u ON r.user_id = u.id
          WHERE r.visibility = 'public'
          AND (r.title LIKE ? OR r.description LIKE ? OR r.tags LIKE ? OR r.ingredients LIKE ?)
          ORDER BY r.created_at DESC`,
    args: [searchTerm, searchTerm, searchTerm, searchTerm],
  });
  
  return result.rows.map(row => ({
    ...row,
    tags: JSON.parse(row.tags as string || '[]'),
  }));
}
