import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ClassSession from "@/models/ClassSession";
import ClassEnrollment from "@/models/ClassEnrollment";
import { isAdmin } from "@/lib/roles";
import { getFreeSeanceStatuses } from "@/lib/free-seances";

// Free-séance balance for every student on a roster, keyed by student id, so
// the teacher/admin views can show who is on their free grant.
async function rosterFreeSeances(enrollments: { student?: unknown }[]) {
  const ids = enrollments
    .map((e) => String((e.student as { _id?: unknown })?._id ?? e.student ?? ""))
    .filter(Boolean);
  return getFreeSeanceStatuses(ids);
}

// Class details. Admin and the assigned teacher also get the roster
// (teacher only sees confirmed students); a student gets their own status.
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const cls = await ClassSession.findById(id)
      .populate("teacher", "name avatar email")
      .lean<{ _id: unknown; teacher: { _id: unknown } } & Record<string, unknown> | null>();
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    const admin = isAdmin(session.role);
    const isOwnerTeacher = String(cls.teacher?._id ?? cls.teacher) === session.userId;

    if (admin) {
      const enrollments = await ClassEnrollment.find({ classSession: id })
        .populate("student", "name email avatar")
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({
        success: true,
        data: { class: cls, enrollments, freeSeances: await rosterFreeSeances(enrollments) },
      });
    }

    if (isOwnerTeacher) {
      // The teacher sees pending requests (to accept/decline) and confirmed students.
      const enrollments = await ClassEnrollment.find({
        classSession: id,
        status: { $in: ["pending", "confirmed"] },
      })
        .populate("student", "name email avatar")
        .sort({ status: 1, createdAt: -1 })
        .lean();
      return NextResponse.json({
        success: true,
        data: { class: cls, enrollments, freeSeances: await rosterFreeSeances(enrollments) },
      });
    }

    // Student view: just their own enrollment status.
    const mine = await ClassEnrollment.findOne({ classSession: id, student: session.userId })
      .select("status")
      .lean<{ status: string } | null>();
    return NextResponse.json({ success: true, data: { class: cls, myStatus: mine?.status ?? null } });
  } catch (error) {
    console.error("Class GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(session.role)) return NextResponse.json({ error: "Admins only" }, { status: 403 });

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const allowed = ["title", "subject", "level", "description", "teacher", "startTime", "endTime", "price", "status"] as const;
    const update: Record<string, unknown> = {};
    for (const f of allowed) if (body[f] !== undefined) update[f] = body[f];
    if (body.date !== undefined) update.date = new Date(body.date);

    const cls = await ClassSession.findByIdAndUpdate(id, update, { new: true }).populate("teacher", "name avatar");
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: { class: cls } });
  } catch (error) {
    console.error("Class PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(session.role)) return NextResponse.json({ error: "Admins only" }, { status: 403 });

    await connectDB();
    const { id } = await params;

    const cls = await ClassSession.findByIdAndDelete(id);
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
    await ClassEnrollment.deleteMany({ classSession: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Class DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
