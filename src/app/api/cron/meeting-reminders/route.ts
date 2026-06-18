import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { sendMail, meetingReminderEmail } from "@/lib/mailer";
import Meeting from "@/models/Meeting";
import "@/models/User"; // register the User model so populate() works

export const runtime = "nodejs";
// Always run fresh — this is a scheduled side-effecting job, never cached.
export const dynamic = "force-dynamic";

// How long after a meeting's start we still bother sending (avoids emailing for
// meetings the cron missed by hours, e.g. after downtime).
const LATE_GRACE_MS = 15 * 60_000;

// Combine a meeting's calendar day with its "HH:MM" start into a single instant.
// Times are treated as UTC; add a timezone offset here if your users are local.
function meetingStart(date: Date, startTime: string): number {
  const [h, m] = startTime.split(":").map(Number);
  const d = new Date(date);
  d.setUTCHours(h || 0, m || 0, 0, 0);
  return d.getTime();
}

/**
 * Scheduled job: emails every participant of a meeting whose reminder window has
 * opened (e.g. 30 min before start) and hasn't been reminded yet. Idempotent via
 * `reminderSentAt`. Triggered by Vercel Cron or any external scheduler.
 *
 * Secured with CRON_SECRET: callers must send `Authorization: Bearer <secret>`.
 */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  await connectDB();
  const now = Date.now();

  // Candidates: upcoming/just-started, reminder on, not yet sent. The day filter
  // keeps the scan small; the precise window check happens in JS below.
  const dayAgo = new Date(now - 24 * 60 * 60_000);
  const dayAhead = new Date(now + 24 * 60 * 60_000);
  const candidates = await Meeting.find({
    status: "scheduled",
    "reminder.enabled": true,
    reminderSentAt: { $exists: false },
    date: { $gte: dayAgo, $lte: dayAhead },
  })
    .populate<{ students: { _id: unknown; name: string; email: string }[] }>("students", "name email")
    .populate<{ teacher: { _id: unknown; name: string; email: string } }>("teacher", "name email")
    .lean();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  let sent = 0;
  let processed = 0;

  for (const meeting of candidates) {
    const start = meetingStart(meeting.date as Date, meeting.startTime);
    const lead = (meeting.reminder?.minutesBefore || 0) * 60_000;

    // Inside the reminder window and not too far past the start.
    if (now < start - lead || now > start + LATE_GRACE_MS) continue;

    const recipients = [
      ...(meeting.students || []),
      ...(meeting.teacher ? [meeting.teacher] : []),
    ].filter((u): u is { _id: unknown; name: string; email: string } => !!u && !!u.email);

    const minutesBefore = Math.max(0, Math.round((start - now) / 60_000));
    const joinUrl = `${appUrl}/meetings/${meeting._id}`;

    await Promise.allSettled(
      recipients.map((u) => {
        const { subject, html } = meetingReminderEmail(u.name, {
          title: meeting.title,
          date: meeting.date as Date,
          startTime: meeting.startTime,
          minutesBefore,
          joinUrl,
          type: meeting.type,
          location: meeting.location,
        });
        return sendMail({ to: u.email, subject, html });
      }),
    );

    // Mark as sent regardless of individual failures, so we never spam on retry.
    await Meeting.updateOne({ _id: meeting._id }, { $set: { reminderSentAt: new Date() } });
    sent += recipients.length;
    processed += 1;
  }

  return NextResponse.json({ success: true, data: { meetings: processed, emails: sent } });
}

export async function GET(request: NextRequest) {
  try {
    return await handle(request);
  } catch (error) {
    console.error("Meeting reminders cron error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Allow POST too, for schedulers that prefer it.
export const POST = GET;
