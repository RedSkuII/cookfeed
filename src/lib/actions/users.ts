'use server';

import { getDb } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { InValue } from '@libsql/client';
import { revalidatePath } from 'next/cache';

// Get user profile
export async function getUserProfile() {
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }
  
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [session.user.email],
  });
  
  if (result.rows.length === 0) {
    // Create user if doesn't exist
    const id = crypto.randomUUID();
    await db.execute({
      sql: 'INSERT INTO users (id, email, name, profile_image) VALUES (?, ?, ?, ?)',
      args: [id, session.user.email, session.user.name || 'User', session.user.image || null],
    });
    return {
      id,
      email: session.user.email,
      name: session.user.name || 'User',
      bio: null,
      profile_image: session.user.image || null,
    };
  }
  
  return result.rows[0];
}

// Update user profile
export async function updateUserProfile(data: {
  name?: string;
  bio?: string;
  profile_image?: string;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }
  
  const db = getDb();
  
  const updates: string[] = [];
  const args: InValue[] = [];
  
  if (data.name !== undefined) { updates.push('name = ?'); args.push(data.name); }
  if (data.bio !== undefined) { updates.push('bio = ?'); args.push(data.bio); }
  if (data.profile_image !== undefined) { updates.push('profile_image = ?'); args.push(data.profile_image); }
  
  updates.push("updated_at = datetime('now')");
  args.push(session.user.email);
  
  await db.execute({
    sql: `UPDATE users SET ${updates.join(', ')} WHERE email = ?`,
    args,
  });
  
  revalidatePath('/profile');
  revalidatePath('/profile/edit');
  
  return { success: true };
}

// Toggle like on a recipe
export async function toggleLike(recipeId: string) {
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
  
  // Check if already liked
  const existing = await db.execute({
    sql: 'SELECT * FROM likes WHERE user_id = ? AND recipe_id = ?',
    args: [userId, recipeId],
  });
  
  if (existing.rows.length > 0) {
    // Unlike
    await db.execute({
      sql: 'DELETE FROM likes WHERE user_id = ? AND recipe_id = ?',
      args: [userId, recipeId],
    });
    return { liked: false };
  } else {
    // Like
    await db.execute({
      sql: 'INSERT INTO likes (user_id, recipe_id) VALUES (?, ?)',
      args: [userId, recipeId],
    });
    return { liked: true };
  }
}

// Check if user liked a recipe
export async function isRecipeLiked(recipeId: string) {
  const session = await auth();
  if (!session?.user?.email) {
    return false;
  }
  
  const db = getDb();
  
  const result = await db.execute({
    sql: `SELECT l.* FROM likes l
          JOIN users u ON l.user_id = u.id
          WHERE u.email = ? AND l.recipe_id = ?`,
    args: [session.user.email, recipeId],
  });
  
  return result.rows.length > 0;
}

// Get user's liked recipe IDs
export async function getLikedRecipeIds() {
  const session = await auth();
  if (!session?.user?.email) {
    return [];
  }
  
  const db = getDb();
  
  const result = await db.execute({
    sql: `SELECT l.recipe_id FROM likes l
          JOIN users u ON l.user_id = u.id
          WHERE u.email = ?`,
    args: [session.user.email],
  });
  
  return result.rows.map(row => row.recipe_id as string);
}

// Toggle made status on a recipe
export async function toggleMadeRecipe(recipeId: string) {
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
  
  // Check if already marked as made
  const existing = await db.execute({
    sql: 'SELECT * FROM made_recipes WHERE user_id = ? AND recipe_id = ?',
    args: [userId, recipeId],
  });
  
  if (existing.rows.length > 0) {
    // Unmark
    await db.execute({
      sql: 'DELETE FROM made_recipes WHERE user_id = ? AND recipe_id = ?',
      args: [userId, recipeId],
    });
    return { made: false };
  } else {
    // Mark as made
    await db.execute({
      sql: 'INSERT INTO made_recipes (user_id, recipe_id) VALUES (?, ?)',
      args: [userId, recipeId],
    });
    return { made: true };
  }
}

// Get user's made recipe IDs
export async function getMadeRecipeIds() {
  const session = await auth();
  if (!session?.user?.email) {
    return [];
  }
  
  const db = getDb();
  
  const result = await db.execute({
    sql: `SELECT m.recipe_id FROM made_recipes m
          JOIN users u ON m.user_id = u.id
          WHERE u.email = ?`,
    args: [session.user.email],
  });
  
  return result.rows.map(row => row.recipe_id as string);
}
