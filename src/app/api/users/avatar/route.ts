import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { uploadImageToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ success: false, error: "Cloudinary non configuré" }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ success: false, error: "Image requise" }, { status: 400 });
    if (!ACCEPTED.has(file.type)) {
      return NextResponse.json(
        { success: false, error: "Format non supporté. Acceptés: JPG, PNG, WebP, GIF." },
        { status: 400 }
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ success: false, error: "Image trop volumineuse (max 5 MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await uploadImageToCloudinary(buffer, file.name, file.type);

    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.userId,
      { avatar: upload.url },
      { new: true }
    ).select("-password");

    return NextResponse.json({ success: true, data: { avatar: upload.url, user } });
  } catch (error) {
    console.error("Avatar upload error:", error);
    const msg = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
