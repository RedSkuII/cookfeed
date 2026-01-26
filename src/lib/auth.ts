import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/lib/db";

// Helper to create or update user in database
async function upsertUser(user: { id: string; email: string; name?: string | null; image?: string | null }) {
  try {
    const db = getDb();
    
    // Check if user exists
    const existingUser = await db.execute({
      sql: "SELECT id FROM users WHERE id = ? OR email = ?",
      args: [user.id, user.email],
    });
    
    if (existingUser.rows.length > 0) {
      // Update existing user
      const existingId = existingUser.rows[0].id as string;
      await db.execute({
        sql: "UPDATE users SET name = ?, profile_image = ?, updated_at = datetime('now') WHERE id = ?",
        args: [user.name || null, user.image || null, existingId],
      });
      return existingId;
    } else {
      // Create new user
      await db.execute({
        sql: "INSERT INTO users (id, email, name, profile_image) VALUES (?, ?, ?, ?)",
        args: [user.id, user.email, user.name || null, user.image || null],
      });
      
      // Also create default preferences for the user
      await db.execute({
        sql: "INSERT OR IGNORE INTO user_preferences (user_id) VALUES (?)",
        args: [user.id],
      });
      
      return user.id;
    }
  } catch (error) {
    console.error("Failed to upsert user:", error);
    return user.id; // Return the ID even if DB fails, so auth continues
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (credentials?.email && credentials?.password) {
          // Look up user in database
          try {
            const db = getDb();
            const result = await db.execute({
              sql: "SELECT id, email, name FROM users WHERE email = ?",
              args: [credentials.email as string],
            });
            
            if (result.rows.length > 0) {
              const user = result.rows[0];
              // Note: In production, you should verify password hash here
              return {
                id: user.id as string,
                email: user.email as string,
                name: user.name as string | null,
              };
            }
          } catch (error) {
            console.error("Database lookup failed:", error);
          }
          return null;
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/signup",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.provider === "google" && user) {
        // Create or update user in database when signing in with Google
        const dbUserId = await upsertUser({
          id: user.id || `google_${Date.now()}`,
          email: user.email || "",
          name: user.name,
          image: user.image,
        });
        token.id = dbUserId;
        token.provider = "google";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
