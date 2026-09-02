import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ClassSession from "@/models/ClassSession";
import ClassEnrollment from "@/models/ClassEnrollment";
import User from "@/models/User";
import { isAdmin } from "@/lib/roles";
import { getFreeSeanceStatus } from "@/lib/free-seances";

// List classes, shaped per role:
//  - admin   → every class with pending/confirmed counts
//  - teacher → their assigned classes with confirmed counts
//  - student → open upcoming classes with their own enrollment status
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    if (isAdmin(session.role)) {
      const classes = await ClassSession.find()
        .populate("teacher", "name avatar")
        .sort({ date: -1 })
        .lean();
      const counts = await ClassEnrollment.aggregate([
        { $group: { _id: { cls: "$classSession", status: "$status" }, n: { $sum: 1 } } },
      ]);
      const byClass: Record<string, { pending: number; confirmed: number }> = {};
      for (const c of counts) {
        const key = String(c._id.cls);
        byClass[key] ??= { pending: 0, confirmed: 0 };
        if (c._id.status === "pending") byClass[key].pending = c.n;
        if (c._id.status === "confirmed") byClass[key].confirmed = c.n;
      }
      const withCounts = classes.map((c) => ({
        ...c,
        pendingCount: byClass[String(c._id)]?.pending ?? 0,
        confirmedCount: byClass[String(c._id)]?.confirmed ?? 0,
      }));
      return NextResponse.json({ success: true, data: { classes: withCounts } });
    }

    if (session.role === "teacher") {
      const classes = await ClassSession.find({ teacher: session.userId })
        .sort({ date: 1 })
        .lean();
      const ids = classes.map((c) => c._id);
      const counts = await ClassEnrollment.aggregate([
        { $match: { classSession: { $in: ids }, status: { $in: ["pending", "confirmed"] } } },
        { $group: { _id: { cls: "$classSession", status: "$status" }, n: { $sum: 1 } } },
      ]);
      const byClass: Record<string, { pending: number; confirmed: number }> = {};
      for (const c of counts) {
        const key = String(c._id.cls);
        byClass[key] ??= { pending: 0, confirmed: 0 };
        if (c._id.status === "pending") byClass[key].pending = c.n;
        if (c._id.status === "confirmed") byClass[key].confirmed = c.n;
      }
      const withCounts = classes.map((c) => ({
        ...c,
        pendingCount: byClass[String(c._id)]?.pending ?? 0,
        confirmedCount: byClass[String(c._id)]?.confirmed ?? 0,
      }));
      return NextResponse.json({ success: true, data: { classes: withCounts } });
    }

    // Student: browse open, upcoming classes and tag with my enrollment status.
    const classes = await ClassSession.find({
      status: "open",
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    })
      .populate("teacher", "name avatar")
      .sort({ date: 1 })
      .lean();

    const myEnrollments = await ClassEnrollment.find({ student: session.userId })
      .select("classSession status isFree")
      .lean<{ classSession: unknown; status: string; isFree?: boolean }[]>();
    const statusBy: Record<string, string> = {};
    const freeBy: Record<string, boolean> = {};
    for (const e of myEnrollments) {
      statusBy[String(e.classSession)] = e.status;
      freeBy[String(e.classSession)] = !!e.isFree;
    }

    const withStatus = classes.map((c) => ({
      ...c,
      myStatus: statusBy[String(c._id)] ?? null,
      myEnrollmentIsFree: freeBy[String(c._id)] ?? false,
    }));
    // The student's free-séance balance, so the page can say what joining costs.
    const freeSeances = await getFreeSeanceStatus(session.userId);
    return NextResponse.json({ success: true, data: { classes: withStatus, freeSeances } });
  } catch (error) {
    console.error("Classes GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Admin creates a class and assigns a teacher.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(session.role)) {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { title, subject, level, description, teacher, date, startTime, endTime, price } = body;

    if (!title || !subject || !level || !teacher || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Title, subject, level, teacher, date and time are required" },
        { status: 400 }
      );
    }

    const prof = await User.findOne({ _id: teacher, role: "teacher" }).select("_id name").lean<{ _id: unknown; name: string } | null>();
    if (!prof) {
      return NextResponse.json({ error: "Selected teacher not found" }, { status: 404 });
    }

    const created = await ClassSession.create({
      title,
      subject,
      level,
      description: description || "",
      teacher,
      date: new Date(date),
      startTime,
      endTime,
      price: Number(price) || 0,
      channelName: `class_${randomUUID().replace(/-/g, "")}`,
      status: "open",
      createdBy: session.userId,
    });

    const populated = await created.populate("teacher", "name avatar");
    return NextResponse.json({ success: true, data: { class: populated } }, { status: 201 });
  } catch (error) {
    console.error("Classes POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
