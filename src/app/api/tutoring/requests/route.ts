import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { notifyUsers } from "@/lib/notifications";
import TutoringRequest from "@/models/TutoringRequest";
import User from "@/models/User";
import { isAdmin } from "@/lib/roles";

// List tutoring requests, shaped per role:
//  - teacher → incoming requests (with student info)
//  - student → their own requests (with teacher info)
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    if (session.role === "teacher" || isAdmin(session.role)) {
      const requests = await TutoringRequest.find({ teacher: session.userId })
        .populate("student", "name email avatar")
        .sort({ status: 1, createdAt: -1 })
        .lean();
      return NextResponse.json({ success: true, data: { requests } });
    }

    const requests = await TutoringRequest.find({ student: session.userId })
      .populate("teacher", "name avatar")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, data: { requests } });
  } catch (error) {
    console.error("Tutoring requests GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// A student reserves a teacher → creates a pending request and notifies the teacher.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "student") {
      return NextResponse.json({ error: "Only students can reserve a teacher" }, { status: 403 });
    }

    await connectDB();
    const { teacherId } = await request.json();
    if (!teacherId) return NextResponse.json({ error: "teacherId required" }, { status: 400 });

    const teacher = await User.findOne({ _id: teacherId, role: "teacher", isApproved: true })
      .select("_id")
      .lean<{ _id: unknown } | null>();
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    const existing = await TutoringRequest.findOne({ student: session.userId, teacher: teacherId });
    if (existing && existing.status !== "rejected") {
      return NextResponse.json(
        { success: true, data: { status: existing.status }, message: "Demande déjà envoyée" }
      );
    }

    let reqDoc;
    if (existing) {
      // Previously rejected — let the student try again.
      existing.status = "pending";
      existing.respondedAt = undefined;
      reqDoc = await existing.save();
    } else {
      reqDoc = await TutoringRequest.create({ student: session.userId, teacher: teacherId, status: "pending" });
    }

    await notifyUsers([String(teacherId)], {
      title: "Nouvelle demande de réservation",
      message: `${session.name} souhaite réserver des séances avec vous.`,
      type: "info",
      link: "/teacher/tutoring",
    });

    return NextResponse.json({ success: true, data: { status: reqDoc.status } }, { status: 201 });
  } catch (error) {
    console.error("Tutoring request POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
