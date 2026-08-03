import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth";
import User from "@/models/User";
import { ROLES, canManageUser, isAdmin, isSuperAdmin } from "@/lib/roles";

// Admin-only management of a single user: approve/reject teachers,
// change role, verify, or remove a user.
//
// Rank rules: a superadmin may act on anyone (except themselves for delete);
// a plain admin may only act on non-admin accounts, and may never hand out the
// admin or superadmin role — that stays with superadmins (and the database).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const target = await User.findById(id).select("role").lean<{ role: string } | null>();
    if (!target) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    if (!canManageUser(session.role, target.role)) {
      return NextResponse.json(
        { success: false, error: "Only a super admin can manage administrator accounts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedFields = ["isApproved", "isVerified", "role"] as const;
    const update: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    if (update.role !== undefined) {
      if (!ROLES.includes(update.role as (typeof ROLES)[number])) {
        return NextResponse.json({ success: false, error: "Unknown role" }, { status: 400 });
      }
      // Granting admin rights is a superadmin-only action.
      if (isAdmin(update.role as string) && !isSuperAdmin(session.role)) {
        return NextResponse.json(
          { success: false, error: "Only a super admin can grant administrator rights" },
          { status: 403 }
        );
      }
      // The superadmin role is assigned from the database, not from the app.
      if (isSuperAdmin(update.role as string)) {
        return NextResponse.json(
          { success: false, error: "The super admin role is assigned from the database only" },
          { status: 403 }
        );
      }
      if (id === session.userId) {
        return NextResponse.json(
          { success: false, error: "You cannot change your own role" },
          { status: 400 }
        );
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true })
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { user } });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (id === session.userId) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    await connectDB();
    const target = await User.findById(id).select("role").lean<{ role: string } | null>();
    if (!target) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    // Admins can remove ordinary users; removing an admin (or a superadmin)
    // requires a superadmin.
    if (!canManageUser(session.role, target.role)) {
      return NextResponse.json(
        { success: false, error: "Only a super admin can remove administrator accounts" },
        { status: 403 }
      );
    }

    const deleted = await User.findByIdAndDelete(id).select("-password").lean();
    if (!deleted) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User removed" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
