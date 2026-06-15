import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { notifyUsers } from "@/lib/notifications";
import ClassSession from "@/models/ClassSession";
import ClassEnrollment from "@/models/ClassEnrollment";
import User from "@/models/User";

// A student requests to join a class. The enrollment stays "pending" until an
// admin confirms payment. Admins are notified of the new request.
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "student") {
      return NextResponse.json({ error: "Only students can join classes" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;

    const cls = await ClassSession.findById(id).lean<{ _id: unknown; title: string; status: string } | null>();
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
    if (cls.status !== "open") {
      return NextResponse.json({ error: "This class is not open for enrollment" }, { status: 409 });
    }

    const existing = await ClassEnrollment.findOne({ classSession: id, student: session.userId }).lean();
    if (existing) {
      return NextResponse.json({ error: "You have already requested to join this class" }, { status: 409 });
    }

    await ClassEnrollment.create({ classSession: id, student: session.userId, status: "pending" });

    // Notify admins that a payment confirmation is awaited.
    const admins = await User.find({ role: "admin" }).select("_id").lean<{ _id: unknown }[]>();
    await notifyUsers(
      admins.map((a) => String(a._id)),
      {
        title: "New class join request",
        message: `${session.name} requested to join "${cls.title}". Confirm once payment is received.`,
        type: "info",
        link: "/admin/classes",
      }
    );

    return NextResponse.json({ success: true, message: "Request sent. You'll be enrolled once payment is confirmed." }, { status: 201 });
  } catch (error) {
    console.error("Class join error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
