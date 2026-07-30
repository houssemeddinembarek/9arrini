import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { notifyUsers } from "@/lib/notifications";
import User from "@/models/User";

// A parent redeems a child's share code to link to that student's account.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "parent") {
      return NextResponse.json({ error: "Parents only" }, { status: 403 });
    }

    const { code } = await request.json();
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) return NextResponse.json({ error: "Code requis" }, { status: 400 });

    await connectDB();
    const child = await User.findOne({ role: "student", linkCode: normalized }).select("name avatar");
    if (!child) return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 404 });

    const parent = await User.findById(session.userId).select("children name");
    if (!parent) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const already = parent.children.some((c) => String(c) === String(child._id));
    if (!already) {
      parent.children.push(child._id);
      await parent.save();
      // Let the child know a parent is now following their progress.
      await notifyUsers([String(child._id)], {
        title: "Un parent a rejoint votre compte",
        message: `${parent.name} suit désormais votre progression.`,
        type: "info",
        link: "/profile",
      });
    }

    return NextResponse.json({
      success: true,
      data: { child: { _id: child._id, name: child.name, avatar: child.avatar }, alreadyLinked: already },
    });
  } catch (error) {
    console.error("parent link error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
