import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { notifyUsers } from "@/lib/notifications";
import TutoringRequest from "@/models/TutoringRequest";
import User from "@/models/User";
import Group from "@/models/Group";
import { ensureTutoringIndexes } from "@/lib/tutoring-indexes";
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
        .populate("group", "name subject level color")
        .sort({ status: 1, createdAt: -1 })
        .lean();
      return NextResponse.json({ success: true, data: { requests } });
    }

    const requests = await TutoringRequest.find({ student: session.userId })
      .populate("teacher", "name avatar")
      .populate("group", "name subject level color")
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
    const { teacherId, groupId } = await request.json();
    if (!teacherId) return NextResponse.json({ error: "teacherId required" }, { status: 400 });

    const teacher = await User.findOne({ _id: teacherId, role: "teacher", isApproved: true })
      .select("_id")
      .lean<{ _id: unknown } | null>();
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    // A student reserves a place in one of the teacher's groups. The group must
    // belong to that teacher, so a crafted id can't enrol them elsewhere.
    let group: { _id: Types.ObjectId; name: string } | null = null;
    if (groupId) {
      group = await Group.findOne({ _id: groupId, teacher: teacherId })
        .select("_id name")
        .lean<{ _id: Types.ObjectId; name: string } | null>();
      if (!group) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });
    }

    await ensureTutoringIndexes();

    // Reservations are per group; a request without one stays teacher-level.
    const existing = await TutoringRequest.findOne(
      group
        ? { student: session.userId, group: group._id }
        : { student: session.userId, teacher: teacherId, group: { $exists: false } }
    );
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
      reqDoc = await TutoringRequest.create({
        student: session.userId,
        teacher: teacherId,
        ...(group ? { group: group._id } : {}),
        status: "pending",
      });
    }

    await notifyUsers([String(teacherId)], {
      title: "Nouvelle demande de réservation",
      message: group
        ? `${session.name} souhaite rejoindre votre groupe "${group.name}".`
        : `${session.name} souhaite réserver des séances avec vous.`,
      type: "info",
      link: "/teacher/tutoring",
    });

    return NextResponse.json({ success: true, data: { status: reqDoc.status } }, { status: 201 });
  } catch (error) {
    console.error("Tutoring request POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
