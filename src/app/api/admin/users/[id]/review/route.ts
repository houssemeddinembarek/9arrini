import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth";
import User from "@/models/User";
import Notification from "@/models/Notification";

// Admin approves or rejects a teacher's verification. On rejection a message
// explaining what's missing is required and delivered to the teacher.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const action = body.action as "approve" | "reject";
    const message = (body.message as string | undefined)?.trim() || "";

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }
    if (action === "reject" && !message) {
      return NextResponse.json(
        { success: false, error: "Un message expliquant ce qui manque est requis pour un refus." },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    if (user.role !== "teacher") {
      return NextResponse.json({ success: false, error: "Only teachers can be reviewed" }, { status: 400 });
    }

    if (action === "approve") {
      user.isApproved = true;
      user.isVerified = true;
      user.verificationStatus = "approved";
      user.rejectionReason = "";
      await user.save();

      await Notification.create({
        user: user._id,
        title: "Profil approuvé 🎉",
        message: "Félicitations ! Votre profil enseignant a été approuvé. Vous avez désormais accès à votre tableau de bord.",
        type: "success",
        link: "/teacher",
      });
    } else {
      user.isApproved = false;
      user.verificationStatus = "rejected";
      user.rejectionReason = message;
      await user.save();

      await Notification.create({
        user: user._id,
        title: "Profil à compléter",
        message,
        type: "warning",
        link: "/profile",
      });
    }

    const safe = await User.findById(id).select("-password").lean();
    return NextResponse.json({ success: true, data: { user: safe } });
  } catch (error) {
    console.error("Admin review error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
