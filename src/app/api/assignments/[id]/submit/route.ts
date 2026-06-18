import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { notifyUsers } from "@/lib/notifications";
import { uploadImageToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import Submission from "@/models/Submission";
import Assignment from "@/models/Assignment";

export const runtime = "nodejs";

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per image
const MAX_FILES = 8;

// A student uploads photos of their handwritten work for an assignment.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "student") {
      return NextResponse.json({ error: "Only students can submit work" }, { status: 403 });
    }
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: "Cloudinary non configuré" }, { status: 503 });
    }

    await connectDB();
    const { id } = await params;

    const submission = await Submission.findOne({ assignment: id, student: session.userId });
    if (!submission) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    const formData = await request.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "Ajoute au moins une image de ton travail" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Max ${MAX_FILES} images` }, { status: 400 });
    }

    const urls: string[] = [];
    for (const file of files) {
      if (!ACCEPTED.has(file.type)) {
        return NextResponse.json({ error: `Type non supporté (${file.type || "inconnu"})` }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "Image trop volumineuse (max 10 Mo)" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const { url } = await uploadImageToCloudinary(buffer, file.name, file.type, "telmidhi/assignments");
      urls.push(url);
    }

    submission.workImages = [...submission.workImages, ...urls];
    submission.status = "submitted";
    submission.submittedAt = new Date();
    await submission.save();

    const assignment = await Assignment.findById(id).select("title").lean<{ title: string } | null>();
    await notifyUsers([String(submission.teacher)], {
      title: "Travail rendu",
      message: `${session.name} a rendu "${assignment?.title ?? "un travail"}".`,
      type: "info",
      link: "/teacher/assignments",
    });

    return NextResponse.json({ success: true, data: { workImages: submission.workImages } });
  } catch (error) {
    console.error("Submit work error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
