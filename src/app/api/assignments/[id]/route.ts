import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Assignment from "@/models/Assignment";
import Submission from "@/models/Submission";
import "@/models/Content";
import "@/models/User";

// Assignment detail. The owning teacher gets the full roster of submissions;
// a student gets only their own.
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const assignment = await Assignment.findById(id)
      .populate("content", "title contentType pdfUrl body")
      .populate("teacher", "name avatar")
      .lean<{ teacher: { _id: unknown } } & Record<string, unknown> | null>();
    if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isOwner = String(assignment.teacher?._id ?? assignment.teacher) === session.userId;

    if (isOwner || session.role === "admin") {
      const submissions = await Submission.find({ assignment: id })
        .populate("student", "name email avatar")
        .sort({ status: 1, updatedAt: -1 })
        .lean();
      return NextResponse.json({ success: true, data: { assignment, submissions } });
    }

    const mine = await Submission.findOne({ assignment: id, student: session.userId }).lean();
    if (!mine) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ success: true, data: { assignment, submission: mine } });
  } catch (error) {
    console.error("Assignment GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const assignment = await Assignment.findOne({ _id: id, teacher: session.userId });
    if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await Assignment.findByIdAndDelete(id);
    await Submission.deleteMany({ assignment: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Assignment DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
