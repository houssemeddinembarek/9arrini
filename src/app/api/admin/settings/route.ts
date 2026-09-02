import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import PlatformSettings, { SETTINGS_KEY } from "@/models/PlatformSettings";
import User from "@/models/User";
import { isAdmin } from "@/lib/roles";

// Platform settings. Readable by any signed-in user (the free-séance number is
// shown to students, teachers and parents); only admins can change it.
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const doc = await PlatformSettings.findOne({ key: SETTINGS_KEY })
      .select("freeSeancesForNewStudents updatedAt")
      .lean<{ freeSeancesForNewStudents?: number; updatedAt?: Date } | null>();

    return NextResponse.json({
      success: true,
      data: {
        settings: {
          freeSeancesForNewStudents: doc?.freeSeancesForNewStudents ?? 0,
          updatedAt: doc?.updatedAt ?? null,
        },
      },
    });
  } catch (error) {
    console.error("settings GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(session.role)) return NextResponse.json({ error: "Admins only" }, { status: 403 });

    await connectDB();
    const body = await request.json();
    const raw = Number(body.freeSeancesForNewStudents);
    if (!Number.isFinite(raw) || raw < 0 || raw > 100) {
      return NextResponse.json({ error: "Nombre de séances gratuites invalide (0 à 100)" }, { status: 400 });
    }
    const freeSeancesForNewStudents = Math.floor(raw);

    const doc = await PlatformSettings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { $set: { freeSeancesForNewStudents, updatedBy: session.userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean<{ freeSeancesForNewStudents: number; updatedAt?: Date }>();

    // The grant is normally stamped at sign-up, so this change only reaches
    // future students. When the admin explicitly asks, re-stamp everyone —
    // the only way to grant séances to students who registered earlier.
    let studentsUpdated = 0;
    if (body.applyToExisting === true) {
      const res = await User.updateMany(
        { role: "student" },
        { $set: { "studentProfile.freeSeancesAllowance": freeSeancesForNewStudents } }
      );
      studentsUpdated = res.modifiedCount ?? 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        settings: {
          freeSeancesForNewStudents: doc.freeSeancesForNewStudents,
          updatedAt: doc.updatedAt ?? null,
        },
        studentsUpdated,
      },
    });
  } catch (error) {
    console.error("settings PUT error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
