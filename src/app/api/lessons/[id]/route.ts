import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Lesson from "@/models/Lesson";
import { deleteFromCloudinary } from "@/lib/cloudinary";

async function loadOwnedLesson(id: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const lesson = await Lesson.findById(id);
  if (!lesson) return null;
  if (lesson.teacher.toString() !== userId) return "forbidden" as const;
  return lesson;
}

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await ctx.params;
    const lesson = await loadOwnedLesson(id, session.userId);
    if (!lesson) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    if (lesson === "forbidden") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    return NextResponse.json({ success: true, data: { lesson } });
  } catch (error) {
    console.error("Lesson GET error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await ctx.params;
    const lesson = await loadOwnedLesson(id, session.userId);
    if (!lesson) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    if (lesson === "forbidden") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const allowed = ["title", "description", "subject", "level", "isPreview"] as const;
    for (const key of allowed) {
      if (body[key] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (lesson as any)[key] = body[key];
      }
    }
    await lesson.save();
    return NextResponse.json({ success: true, data: { lesson } });
  } catch (error) {
    console.error("Lesson PATCH error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await ctx.params;
    const lesson = await loadOwnedLesson(id, session.userId);
    if (!lesson) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    if (lesson === "forbidden") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const cloudinaryId = lesson.cloudinaryId;
    await lesson.deleteOne();
    if (cloudinaryId) {
      // Fire-and-forget; failure to delete from Cloudinary shouldn't fail the API.
      deleteFromCloudinary(cloudinaryId, "video").catch((e) => console.warn("Cloudinary cleanup failed:", e));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lesson DELETE error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
