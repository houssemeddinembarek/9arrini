import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { notifyUsers } from "@/lib/notifications";
import ClassSession from "@/models/ClassSession";
import ClassEnrollment from "@/models/ClassEnrollment";
import User from "@/models/User";
import { ADMIN_ROLE_QUERY } from "@/lib/roles";
import { getFreeSeanceStatus } from "@/lib/free-seances";

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

    const cls = await ClassSession.findById(id).lean<{ _id: unknown; title: string; status: string; teacher: unknown; price?: number } | null>();
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
    if (cls.status !== "open") {
      return NextResponse.json({ error: "This class is not open for enrollment" }, { status: 409 });
    }

    const existing = await ClassEnrollment.findOne({ classSession: id, student: session.userId }).lean();
    if (existing) {
      return NextResponse.json({ error: "You have already requested to join this class" }, { status: 409 });
    }

    // A free séance only makes sense when there is something to pay. Spending
    // one on a 0 DT class would burn the student's grant for nothing.
    const price = cls.price ?? 0;
    const free = price > 0 ? await getFreeSeanceStatus(session.userId) : null;
    const useFreeSeance = !!free && free.remaining > 0;

    if (useFreeSeance) {
      // Nothing is owed, so there is no payment to confirm: enrol straight away.
      await ClassEnrollment.create({
        classSession: id,
        student: session.userId,
        status: "confirmed",
        isFree: true,
        confirmedAt: new Date(),
      });

      const remaining = free!.remaining - 1;
      await notifyUsers([String(cls.teacher)], {
        title: "Nouvel élève (séance gratuite)",
        message: `${session.name} a rejoint "${cls.title}" avec une séance gratuite.`,
        type: "info",
        link: "/teacher/classes",
      });

      return NextResponse.json(
        {
          success: true,
          message: remaining > 0
            ? `Inscrit avec une séance gratuite. Il t'en reste ${remaining}.`
            : "Inscrit avec ta dernière séance gratuite. Les prochaines seront payantes.",
          data: { status: "confirmed", isFree: true, freeSeancesRemaining: remaining },
        },
        { status: 201 }
      );
    }

    await ClassEnrollment.create({ classSession: id, student: session.userId, status: "pending" });

    // Notify admins that a payment confirmation is awaited.
    const admins = await User.find(ADMIN_ROLE_QUERY).select("_id").lean<{ _id: unknown }[]>();
    await notifyUsers(
      admins.map((a) => String(a._id)),
      {
        title: "New class join request",
        message: `${session.name} requested to join "${cls.title}". Confirm once payment is received.`,
        type: "info",
        link: "/admin/classes",
      }
    );
    // The assigned teacher can accept the request themselves.
    await notifyUsers([String(cls.teacher)], {
      title: "New class join request",
      message: `${session.name} requested to join "${cls.title}".`,
      type: "info",
      link: "/teacher/classes",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Request sent. You'll be enrolled once payment is confirmed.",
        data: { status: "pending", isFree: false, freeSeancesRemaining: free?.remaining ?? 0 },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Class join error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
