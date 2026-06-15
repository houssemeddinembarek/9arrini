import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Meeting from "@/models/Meeting";

// Token minting needs Node crypto, not the Edge runtime.
export const runtime = "nodejs";

const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

// Issue a short-lived Agora RTC token so a participant can join the meeting's channel.
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    if (!appId || !appCertificate) {
      return NextResponse.json(
        { error: "Video calling is not configured. Set AGORA_APP_CERTIFICATE and NEXT_PUBLIC_AGORA_APP_ID." },
        { status: 503 }
      );
    }

    await connectDB();
    const { id } = await params;

    const meeting = await Meeting.findById(id)
      .select("teacher students channelName status")
      .lean<{ teacher: unknown; students: unknown[]; channelName: string; status: string } | null>();

    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    if (meeting.status === "cancelled") {
      return NextResponse.json({ error: "This meeting was cancelled" }, { status: 409 });
    }

    const isTeacher = String(meeting.teacher) === session.userId;
    const isStudent = (meeting.students || []).some((s) => String(s) === session.userId);
    if (!isTeacher && !isStudent) {
      return NextResponse.json({ error: "You are not a participant of this meeting" }, { status: 403 });
    }

    // uid 0 lets Agora assign one on join; a token built for uid 0 is valid for any uid.
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      meeting.channelName,
      0,
      RtcRole.PUBLISHER,
      TOKEN_TTL_SECONDS,
      TOKEN_TTL_SECONDS
    );

    return NextResponse.json({
      success: true,
      data: { appId, channel: meeting.channelName, token, uid: 0 },
    });
  } catch (error) {
    console.error("Meeting token error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
