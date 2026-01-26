"use server";

import { signIn, signOut } from "@/lib/auth";

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/feed" });
}

export async function signInWithCredentials(email: string, password: string) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/feed",
    });
    return { success: true };
  } catch (error) {
    // NextAuth throws NEXT_REDIRECT for successful redirects
    // Check if it's actually an auth error
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error; // Re-throw redirect
    }
    return { error: "Invalid email or password" };
  }
}

export async function signOutUser() {
  await signOut({ redirectTo: "/" });
}
