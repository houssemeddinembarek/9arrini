import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ClassSession from "@/models/ClassSession";
import ClassEnrollment from "@/models/ClassEnrollment";

export const runtime = "nodejs";

const TOKEN_TTL_SECONDS = 60 * 60;

// Issue an Agora token for a class room. Allowed for the assigned teacher
// or a student whose enrollment is confirmed.
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

    const cls = await ClassSession.findById(id)
      .select("teacher channelName status")
      .lean<{ teacher: unknown; channelName: string; status: string } | null>();
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
    if (cls.status === "cancelled") {
      return NextResponse.json({ error: "This class was cancelled" }, { status: 409 });
    }

    const isTeacher = String(cls.teacher) === session.userId;
    let allowed = isTeacher;
    if (!allowed) {
      const enr = await ClassEnrollment.findOne({
        classSession: id,
        student: session.userId,
        status: "confirmed",
      }).select("_id").lean();
      allowed = !!enr;
    }
    if (!allowed) {
      return NextResponse.json({ error: "You are not enrolled in this class" }, { status: 403 });
    }

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      cls.channelName,
      0,
      RtcRole.PUBLISHER,
      TOKEN_TTL_SECONDS,
      TOKEN_TTL_SECONDS
    );

    return NextResponse.json({
      success: true,
      data: { appId, channel: cls.channelName, token, uid: 0 },
    });
  } catch (error) {
    console.error("Class token error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
