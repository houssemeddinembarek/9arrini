import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { notifyUsers } from "@/lib/notifications";
import TutoringRequest from "@/models/TutoringRequest";
import { isAdmin } from "@/lib/roles";
import "@/models/User";

// Teacher accepts or rejects a student's reservation request, then notifies the
// student. Accepting unlocks the teacher's meetings for that student.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher" && !isAdmin(session.role)) {
      return NextResponse.json({ error: "Teachers only" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const { action } = await request.json();
    if (action !== "accept" && action !== "reject") {
      return NextResponse.json({ error: "action must be 'accept' or 'reject'" }, { status: 400 });
    }

    const reqDoc = await TutoringRequest.findById(id).populate<{ teacher: unknown }>("teacher", "name");
    if (!reqDoc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (String((reqDoc.teacher as { _id?: unknown })?._id ?? reqDoc.teacher) !== session.userId && !isAdmin(session.role)) {
      return NextResponse.json({ error: "Not your request" }, { status: 403 });
    }

    reqDoc.status = action === "accept" ? "accepted" : "rejected";
    reqDoc.respondedAt = new Date();
    await reqDoc.save();

    const teacherName = (reqDoc.teacher as { name?: string })?.name || "Le professeur";
    await notifyUsers([String(reqDoc.student)], {
      title: action === "accept" ? "Réservation acceptée 🎉" : "Réservation refusée",
      message:
        action === "accept"
          ? `${teacherName} a accepté ta demande. Tu peux voir et rejoindre ses réunions.`
          : `${teacherName} n'a pas pu accepter ta demande pour le moment.`,
      type: action === "accept" ? "success" : "warning",
      link: "/dashboard/tutoring",
    });

    return NextResponse.json({ success: true, data: { status: reqDoc.status } });
  } catch (error) {
    console.error("Tutoring request PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
