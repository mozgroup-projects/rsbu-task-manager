import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import type { Task } from "@prisma/client";

export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events";

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function oauthClient() {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${base}/api/google/callback`,
  );
}

/** Build the consent URL for connecting Google Calendar (offline access). */
export function getCalendarAuthUrl(state: string): string {
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GOOGLE_CALENDAR_SCOPE],
    state,
  });
}

/** Exchange an auth code for tokens and return the refresh token (if any). */
export async function exchangeCalendarCode(code: string) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  return tokens.refresh_token ?? null;
}

function calendarForUser(refreshToken: string) {
  const client = oauthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: "v3", auth: client });
}

/**
 * Create or update a Google Calendar event for a task with a deadline.
 * Returns the event id to persist on the task, or null if not applicable.
 */
export async function syncTaskToCalendar(
  task: Pick<
    Task,
    "id" | "title" | "description" | "dueAt" | "googleEventId"
  >,
  refreshToken: string | null,
): Promise<string | null> {
  if (!refreshToken || !task.dueAt || !isGoogleConfigured()) {
    return task.googleEventId ?? null;
  }
  try {
    const calendar = calendarForUser(refreshToken);
    const start = task.dueAt;
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const requestBody = {
      summary: task.title,
      description: task.description ?? "RSBU Task Manager",
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    };
    if (task.googleEventId) {
      await calendar.events.update({
        calendarId: "primary",
        eventId: task.googleEventId,
        requestBody,
      });
      return task.googleEventId;
    }
    const created = await calendar.events.insert({
      calendarId: "primary",
      requestBody,
    });
    return created.data.id ?? null;
  } catch (err) {
    console.error("Google Calendar sync failed:", err);
    return task.googleEventId ?? null;
  }
}

export async function deleteCalendarEvent(
  eventId: string,
  refreshToken: string | null,
) {
  if (!refreshToken || !isGoogleConfigured()) return;
  try {
    const calendar = calendarForUser(refreshToken);
    await calendar.events.delete({ calendarId: "primary", eventId });
  } catch (err) {
    console.error("Google Calendar delete failed:", err);
  }
}

/** Helper used by server actions to fetch a user's stored refresh token. */
export async function getUserRefreshToken(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleRefreshToken: true },
  });
  return u?.googleRefreshToken ?? null;
}
