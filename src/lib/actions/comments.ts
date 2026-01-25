'use server';

import { getDb } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export interface Comment {
  id: string;
  recipe_id: string;
  user_id: string;
  user_name: string;
  user_image?: string;
  content: string;
  created_at: string;
}

// Get comments for a recipe
export async function getComments(recipeId: string): Promise<Comment[]> {
  const db = getDb();
  
  const result = await db.execute({
    sql: `SELECT c.*, u.name as user_name, u.profile_image as user_image
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.recipe_id = ?
          ORDER BY c.created_at DESC`,
    args: [recipeId],
  });
  
  return result.rows as unknown as Comment[];
}

// Add a comment
export async function addComment(recipeId: string, content: string) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }
  
  const db = getDb();
  
  // Get user
  const user = await db.execute({
    sql: 'SELECT id, name, profile_image FROM users WHERE email = ?',
    args: [session.user.email],
  });
  
  if (user.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const userId = user.rows[0].id as string;
  const userName = user.rows[0].name as string;
  const userImage = user.rows[0].profile_image as string | null;
  
  const id = crypto.randomUUID();
  
  await db.execute({
    sql: `INSERT INTO comments (id, recipe_id, user_id, user_name, user_image, content)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, recipeId, userId, userName, userImage, content],
  });
  
  revalidatePath(`/recipe/${recipeId}`);
  
  return {
    id,
    recipe_id: recipeId,
    user_id: userId,
    user_name: userName,
    user_image: userImage,
    content,
    created_at: new Date().toISOString(),
  };
}

// Delete a comment
export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }
  
  const db = getDb();
  
  // Verify ownership
  const comment = await db.execute({
    sql: `SELECT c.recipe_id FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.id = ? AND u.email = ?`,
    args: [commentId, session.user.email],
  });
  
  if (comment.rows.length === 0) {
    throw new Error('Comment not found or not authorized');
  }
  
  const recipeId = comment.rows[0].recipe_id;
  
  await db.execute({
    sql: 'DELETE FROM comments WHERE id = ?',
    args: [commentId],
  });
  
  revalidatePath(`/recipe/${recipeId}`);
  
  return { success: true };
}

// Get comment count for a recipe
export async function getCommentCount(recipeId: string) {
  const db = getDb();
  
  const result = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM comments WHERE recipe_id = ?',
    args: [recipeId],
  });
  
  return result.rows[0].count as number;
}
