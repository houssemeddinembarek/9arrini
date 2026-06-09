import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import {
  uploadToCloudinary,
  uploadImageToCloudinary,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Upload a verification document (diploma / proof of being a teacher).
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher") {
      return NextResponse.json({ success: false, error: "Teachers only" }, { status: 403 });
    }
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ success: false, error: "Cloudinary non configuré" }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ success: false, error: "Fichier requis" }, { status: 400 });

    const isPdf = file.type === "application/pdf";
    const isImage = IMAGE_TYPES.has(file.type);
    if (!isPdf && !isImage) {
      return NextResponse.json(
        { success: false, error: "Format non supporté. Acceptés: PDF, JPG, PNG, WebP." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: "Fichier trop volumineux (max 10 MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = isPdf
      ? await uploadToCloudinary(buffer, file.name, "skillora/verification")
      : await uploadImageToCloudinary(buffer, file.name, file.type, "skillora/verification");

    const doc = {
      name: file.name,
      url: upload.url,
      type: isPdf ? "pdf" : "image",
      uploadedAt: new Date(),
    };

    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.userId,
      { $push: { verificationDocuments: doc } },
      { new: true }
    ).select("-password");

    return NextResponse.json({ success: true, data: { document: doc, user } }, { status: 201 });
  } catch (error) {
    console.error("Document upload error:", error);
    const msg = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// Remove a previously uploaded document by its URL.
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const url = request.nextUrl.searchParams.get("url");
    if (!url) return NextResponse.json({ success: false, error: "Missing url" }, { status: 400 });

    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.userId,
      { $pull: { verificationDocuments: { url } } },
      { new: true }
    ).select("-password");

    return NextResponse.json({ success: true, data: { user } });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
