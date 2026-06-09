import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

// Teacher submits their completed profile for admin review.
export async function POST() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (session.role !== "teacher") {
      return NextResponse.json({ success: false, error: "Teachers only" }, { status: 403 });
    }

    await connectDB();
    const user = await User.findById(session.userId).select("-password");
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    if (user.isApproved && user.verificationStatus === "approved") {
      return NextResponse.json({ success: false, error: "Votre compte est déjà approuvé." }, { status: 400 });
    }

    // Require a profile photo and at least one proof document.
    if (!user.avatar) {
      return NextResponse.json({ success: false, error: "Ajoutez une photo de profil avant de soumettre." }, { status: 400 });
    }
    if (!user.verificationDocuments || user.verificationDocuments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Ajoutez au moins un document justificatif avant de soumettre." },
        { status: 400 }
      );
    }

    user.verificationStatus = "pending";
    user.rejectionReason = "";
    await user.save();

    // Notify all admins that a teacher is awaiting review.
    const admins = await User.find({ role: "admin" }).select("_id").lean();
    if (admins.length > 0) {
      await Notification.insertMany(
        admins.map((a) => ({
          user: a._id,
          title: "Nouvelle demande de vérification",
          message: `${user.name} a soumis son profil enseignant pour approbation.`,
          type: "info",
          link: "/admin/users",
        }))
      );
    }

    return NextResponse.json({ success: true, data: { verificationStatus: user.verificationStatus } });
  } catch (error) {
    console.error("Verification submit error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
