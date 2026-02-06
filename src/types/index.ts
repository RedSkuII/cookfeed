// Database types - ready for Turso/SQLite
// These types mirror the database schema for type safety

export interface User {
  id: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipe {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  photoUrl: string | null;
  ingredients: string[]; // Stored as JSON in SQLite
  steps: string[]; // Stored as JSON in SQLite
  tags: string[]; // Stored as JSON in SQLite
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface Follower {
  followerId: string;
  followedId: string;
  createdAt: Date;
}

export interface Favorite {
  userId: string;
  recipeId: string;
  createdAt: Date;
}

export interface Like {
  userId: string;
  recipeId: string;
  createdAt: Date;
}

export interface Draft {
  id: string;
  userId: string;
  data: Partial<Recipe>; // Stored as JSON
  updatedAt: Date;
}

// API Response types
export interface RecipeWithAuthor extends Recipe {
  author: Pick<User, "id" | "displayName" | "username" | "avatarUrl">;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isFavorited?: boolean;
}

export interface UserProfile extends User {
  recipesCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

// Form types
export interface CreateRecipeInput {
  title: string;
  description?: string;
  photoUrl?: string;
  ingredients: string[];
  steps: string[];
  tags: string[];
  isPublic: boolean;
}

export interface UpdateRecipeInput extends Partial<CreateRecipeInput> {
  id: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  username: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RecipeEditor {
  id: string;
  recipe_id: string;
  user_id: string;
  can_edit: number;
  can_delete: number;
  can_manage_editors: number;
  added_by: string;
  created_at: string;
  updated_at: string;
  name?: string;
  profile_image?: string;
}

export interface EditorPermissions {
  can_edit: number;
  can_delete: number;
  can_manage_editors: number;
}
