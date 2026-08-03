import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { generateUniqueLinkCode } from "@/lib/link-code";
import { isAdmin } from "@/lib/roles";
import User from "@/models/User";

export const runtime = "nodejs";

// A student's parent-link code. Only the administration can read it: the admin
// hands it to the parent, the student never sees it.
// GET reads (generating one on first access), POST rotates it — which
// invalidates the previous code without unlinking parents already attached.
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(params, false);
}
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(params, true);
}

async function handle(params: Promise<{ id: string }>, rotate: boolean) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(session.role)) {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const student = await User.findById(id).select("name email role linkCode");
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    if (student.role !== "student") {
      return NextResponse.json({ error: "This user is not a student" }, { status: 400 });
    }

    if (rotate || !student.linkCode) {
      student.linkCode = await generateUniqueLinkCode(student._id);
      await student.save();
    }

    const parents = await User.find({ role: "parent", children: student._id })
      .select("name email avatar")
      .lean();

    return NextResponse.json({
      success: true,
      data: { code: student.linkCode, parents },
    });
  } catch (error) {
    console.error("admin link-code error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
