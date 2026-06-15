import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { notifyUsers } from "@/lib/notifications";
import ClassEnrollment from "@/models/ClassEnrollment";
// Registered for populate() of classSession.teacher / student.
import "@/models/ClassSession";
import "@/models/User";

// Admin confirms (payment received) or rejects a class enrollment.
// Confirming notifies both the student and the assigned teacher.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });

    await connectDB();
    const { id } = await params;
    const { action } = await request.json();
    if (action !== "confirm" && action !== "reject") {
      return NextResponse.json({ error: "action must be 'confirm' or 'reject'" }, { status: 400 });
    }

    const enrollment = await ClassEnrollment.findById(id)
      .populate<{ student: { _id: unknown; name: string } }>("student", "name")
      .populate<{ classSession: { _id: unknown; title: string; teacher: unknown } }>("classSession", "title teacher");
    if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    const cls = enrollment.classSession as unknown as { _id: unknown; title: string; teacher: unknown };
    const student = enrollment.student as unknown as { _id: unknown; name: string };

    if (action === "confirm") {
      enrollment.status = "confirmed";
      enrollment.paymentReceived = true;
      enrollment.confirmedAt = new Date();
      await enrollment.save();

      // Student: you're in.
      await notifyUsers([String(student._id)], {
        title: "Enrollment confirmed",
        message: `Payment received — you're enrolled in "${cls.title}".`,
        type: "success",
        link: "/dashboard/classes",
      });
      // Teacher: a new confirmed student (now visible to them).
      await notifyUsers([String(cls.teacher)], {
        title: "New student in your class",
        message: `${student.name} joined "${cls.title}".`,
        type: "info",
        link: "/teacher/classes",
      });
    } else {
      enrollment.status = "rejected";
      await enrollment.save();
      await notifyUsers([String(student._id)], {
        title: "Class request declined",
        message: `Your request to join "${cls.title}" was not approved.`,
        type: "warning",
        link: "/dashboard/classes",
      });
    }

    return NextResponse.json({ success: true, data: { status: enrollment.status } });
  } catch (error) {
    console.error("Class enrollment PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
