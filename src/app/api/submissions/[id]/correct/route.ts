import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { notifyUsers } from "@/lib/notifications";
import { uploadImageToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import Submission from "@/models/Submission";
import Assignment from "@/models/Assignment";

export const runtime = "nodejs";

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 10 * 1024 * 1024;

// Teacher sends the correction for a submission: optional correction images
// (photos of the corrected paper) and/or a text correction (often AI-assisted).
// Marks the submission corrected and notifies the student.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher" && session.role !== "admin") {
      return NextResponse.json({ error: "Teachers only" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;

    const submission = await Submission.findById(id);
    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (String(submission.teacher) !== session.userId && session.role !== "admin") {
      return NextResponse.json({ error: "Not your student" }, { status: 403 });
    }

    const formData = await request.formData();
    const aiCorrection = (formData.get("correction") as string)?.trim() || "";
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (!aiCorrection && files.length === 0) {
      return NextResponse.json({ error: "Ajoute une correction (texte ou image)" }, { status: 400 });
    }

    const urls: string[] = [];
    if (files.length) {
      if (!isCloudinaryConfigured()) {
        return NextResponse.json({ error: "Cloudinary non configuré" }, { status: 503 });
      }
      for (const file of files) {
        if (!ACCEPTED.has(file.type)) {
          return NextResponse.json({ error: `Type non supporté (${file.type || "inconnu"})` }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
          return NextResponse.json({ error: "Image trop volumineuse (max 10 Mo)" }, { status: 400 });
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const { url } = await uploadImageToCloudinary(buffer, file.name, file.type, "telmidhi/corrections");
        urls.push(url);
      }
    }

    if (urls.length) submission.correctionImages = [...submission.correctionImages, ...urls];
    if (aiCorrection) submission.aiCorrection = aiCorrection;
    submission.status = "corrected";
    submission.correctedAt = new Date();
    await submission.save();

    const assignment = await Assignment.findById(submission.assignment).select("title").lean<{ title: string } | null>();
    await notifyUsers([String(submission.student)], {
      title: "Correction disponible",
      message: `Ton travail "${assignment?.title ?? ""}" a été corrigé. Regarde tes erreurs.`,
      type: "success",
      link: "/dashboard/assignments",
    });

    return NextResponse.json({
      success: true,
      data: { status: submission.status, correctionImages: submission.correctionImages, aiCorrection: submission.aiCorrection },
    });
  } catch (error) {
    console.error("Correct submission error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
