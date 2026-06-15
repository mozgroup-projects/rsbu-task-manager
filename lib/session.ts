import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Returns the current session or redirects to /login. Use in server components. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}

/** Returns the current user id or null (no redirect). */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
