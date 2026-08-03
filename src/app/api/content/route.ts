import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Content from "@/models/Content";
import { isAdmin } from "@/lib/roles";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const contentType = searchParams.get("contentType");
    const scope = searchParams.get("scope");

    // Admins can request all teachers' content with scope=all; everyone else
    // is scoped to the content they own.
    const filter: Record<string, unknown> = {};
    if (!(isAdmin(session.role) && scope === "all")) {
      filter.teacher = session.userId;
    }
    if (subject) filter.subject = subject;
    if (contentType) filter.contentType = contentType;

    const items = await Content.find(filter)
      .sort({ createdAt: -1 })
      .populate("teacher", "name email avatar")
      .lean();
    return NextResponse.json({ success: true, data: { items } });
  } catch (error) {
    console.error("Content GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher" && !isAdmin(session.role)) {
      return NextResponse.json({ error: "Teachers only" }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { title, subject, level, contentType, source, contentBody, pdfUrl, cloudinaryId } = body;

    if (!title || !subject || !level || !contentType || !source) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await Content.create({
      title,
      subject,
      level,
      contentType,
      source,
      body: contentBody || "",
      pdfUrl: pdfUrl || "",
      cloudinaryId: cloudinaryId || "",
      teacher: session.userId,
    });

    return NextResponse.json({ success: true, data: { item } }, { status: 201 });
  } catch (error) {
    console.error("Content POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
