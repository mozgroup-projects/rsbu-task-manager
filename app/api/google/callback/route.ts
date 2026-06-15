import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { exchangeCalendarCode } from "@/lib/google-calendar";

const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.redirect(new URL("/login", base));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // State must match the user that started the flow.
  if (!code || state !== userId) {
    return NextResponse.redirect(new URL("/settings?google=error", base));
  }

  try {
    const refreshToken = await exchangeCalendarCode(code);
    if (!refreshToken) {
      // No refresh token returned (already granted before) — keep existing.
      return NextResponse.redirect(new URL("/settings?google=norefresh", base));
    }
    await prisma.user.update({
      where: { id: userId },
      data: { googleRefreshToken: refreshToken },
    });
    return NextResponse.redirect(new URL("/settings?google=connected", base));
  } catch (err) {
    console.error("Google callback error:", err);
    return NextResponse.redirect(new URL("/settings?google=error", base));
  }
}
