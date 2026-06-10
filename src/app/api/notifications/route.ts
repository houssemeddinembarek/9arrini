import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";

// List the current user's notifications (most recent first).
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const items = await Notification.find({ user: session.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unread = items.filter((n) => !n.isRead).length;

    return NextResponse.json({ success: true, data: { items, unread } });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// Mark all of the current user's notifications as read.
export async function PATCH() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    await Notification.updateMany({ user: session.userId, isRead: false }, { isRead: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
