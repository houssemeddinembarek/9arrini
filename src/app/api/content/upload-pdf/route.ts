import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Content from "@/models/Content";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { isAdmin } from "@/lib/roles";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher" && !isAdmin(session.role)) {
      return NextResponse.json({ error: "Teachers only" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const subject = formData.get("subject") as string;
    const level = formData.get("level") as string;
    const contentType = (formData.get("contentType") as string) || "resume";

    if (!file || !title || !subject || !level) {
      return NextResponse.json({ error: "Fichier et métadonnées requis" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Seuls les fichiers PDF sont acceptés" }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 50 MB)" }, { status: 400 });
    }

    let pdfUrl = "";
    let cloudinaryId = "";

    if (isCloudinaryConfigured()) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadToCloudinary(buffer, file.name);
      pdfUrl = result.url;
      cloudinaryId = result.publicId;
    }

    await connectDB();
    const item = await Content.create({
      title,
      subject,
      level,
      contentType: contentType as "resume" | "exercices" | "devoir_controle" | "devoir_synthese" | "fiche_revision",
      source: "uploaded",
      body: "",
      pdfUrl,
      cloudinaryId,
      teacher: session.userId,
    });

    return NextResponse.json({ success: true, data: { item, pdfUrl } }, { status: 201 });
  } catch (error) {
    console.error("Upload PDF error:", error);
    const msg = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
