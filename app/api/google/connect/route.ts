import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { getCalendarAuthUrl, isGoogleConfigured } from "@/lib/google-calendar";

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
    );
  }
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/settings?google=unconfigured",
        process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      ),
    );
  }
  const url = getCalendarAuthUrl(userId);
  return NextResponse.redirect(url);
}
