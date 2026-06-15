import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Lesson from "@/models/Lesson";
import { uploadVideoToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
const ACCEPTED_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
  "video/x-matroska", // .mkv
  "video/ogg",
]);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const type = searchParams.get("type");
    const courseId = searchParams.get("courseId");
    const scope = searchParams.get("scope");

    // Admins can request every teacher's lessons with scope=all; everyone else
    // is scoped to the lessons they own.
    const filter: Record<string, unknown> = {};
    if (!(session.role === "admin" && scope === "all")) {
      filter.teacher = session.userId;
    }
    if (subject) filter.subject = subject;
    if (type) filter.type = type;
    if (courseId === "none") filter.course = null;
    else if (courseId) filter.course = courseId;

    const items = await Lesson.find(filter)
      .sort({ createdAt: -1 })
      .populate("teacher", "name email avatar")
      .populate("course", "title slug")
      .lean();
    return NextResponse.json({ success: true, data: { items } });
  } catch (error) {
    console.error("Lessons GET error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher" && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Teachers only" }, { status: 403 });
    }
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ success: false, error: "Cloudinary non configuré" }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || "";
    const subject = (formData.get("subject") as string)?.trim() || "";
    const level = (formData.get("level") as string)?.trim() || "";
    const isPreview = formData.get("isPreview") === "true";

    if (!file || !title) {
      return NextResponse.json({ success: false, error: "Fichier vidéo et titre requis" }, { status: 400 });
    }
    if (!ACCEPTED_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: `Format non supporté (${file.type || "inconnu"}). Acceptés: MP4, WebM, MOV, MKV, OGG.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { success: false, error: `Fichier trop volumineux (max ${MAX_VIDEO_BYTES / 1024 / 1024} MB)` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await uploadVideoToCloudinary(buffer, file.name, file.type);

    await connectDB();
    const lesson = await Lesson.create({
      title,
      description,
      teacher: session.userId,
      course: null,
      type: "video",
      subject,
      level,
      videoUrl: upload.url,
      thumbnailUrl: upload.thumbnailUrl,
      cloudinaryId: upload.publicId,
      duration: Math.round(upload.duration),
      isPreview,
      order: 0,
    });

    return NextResponse.json({ success: true, data: { lesson } }, { status: 201 });
  } catch (error) {
    console.error("Lessons POST error:", error);
    const msg = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
