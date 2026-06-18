import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Meeting from "@/models/Meeting";
import { uploadVideoToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

// Recordings are produced in the teacher's browser, so allow a large body.
export const runtime = "nodejs";
export const maxDuration = 300;

// Save a meeting recording (teacher-only). The teacher's client uploads the
// captured video; we push it to Cloudinary and store the URL on the meeting so
// students can replay it afterwards.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const meeting = await Meeting.findById(id).select("teacher").lean<{ teacher: unknown } | null>();
    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    if (String(meeting.teacher) !== session.userId) {
      return NextResponse.json({ error: "Teachers only" }, { status: 403 });
    }

    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: "Le stockage vidéo n'est pas configuré." }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "Enregistrement trop volumineux (max 100 MB)" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadVideoToCloudinary(buffer, `meeting-${id}.webm`, file.type || "video/webm", "skillora/recordings");

    await Meeting.updateOne(
      { _id: id },
      {
        $set: {
          recordingUrl: result.url,
          recordingPublicId: result.publicId,
          recordingDuration: result.duration,
          recordedAt: new Date(),
        },
      },
      // strict:false so the write still persists if a hot-reloaded server is
      // running a cached schema that predates these fields.
      { strict: false },
    );

    return NextResponse.json({ success: true, data: { recordingUrl: result.url, duration: result.duration } });
  } catch (error) {
    console.error("Meeting recording POST error:", error);
    const msg = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
