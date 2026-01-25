"use server";

import { signIn, signOut } from "@/lib/auth";

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/feed" });
}

export async function signInWithCredentials(formData: FormData) {
  await signIn("credentials", {
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: "/feed",
  });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/" });
}
