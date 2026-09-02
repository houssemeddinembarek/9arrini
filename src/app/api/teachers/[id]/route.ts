import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Group from "@/models/Group";
import Course from "@/models/Course";
import TutoringRequest from "@/models/TutoringRequest";

interface TeacherLean {
  _id: unknown;
  name: string;
  avatar?: string;
  bio?: string;
  createdAt?: Date;
  teachingProfile?: {
    institution?: string;
    headline?: string;
    subjects?: string[];
    levels?: string[];
    experienceYears?: number;
    hourlyRate?: number;
    availability?: { day: string; from?: string; to?: string }[];
  };
}

// Public profile of one teacher plus the groups students can ask to join.
// A signed-in student also gets their own request status for each group.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const teacher = await User.findOne({ _id: id, role: "teacher", isApproved: true })
      .select("name avatar bio teachingProfile createdAt")
      .lean<TeacherLean | null>();
    if (!teacher) {
      return NextResponse.json({ success: false, error: "Professeur introuvable" }, { status: 404 });
    }

    const [groups, courseAgg] = await Promise.all([
      Group.find({ teacher: id })
        .select("name description subject level color students createdAt")
        .sort({ level: 1, createdAt: -1 })
        .lean<{ _id: unknown; name: string; description?: string; subject?: string; level?: string; color?: string; students?: unknown[] }[]>(),
      Course.aggregate<{ _id: unknown; rating: number; courses: number }>([
        { $match: { teacher: teacher._id, status: "published" } },
        { $group: { _id: "$teacher", rating: { $avg: "$rating" }, courses: { $sum: 1 } } },
      ]),
    ]);

    // A student's own reservation state, so the page can show "déjà demandé".
    const session = await getServerSession();
    const myRequests: Record<string, string> = {};
    if (session?.role === "student") {
      const mine = await TutoringRequest.find({ student: session.userId, teacher: id })
        .select("group status")
        .lean<{ group?: unknown; status: string }[]>();
      for (const r of mine) {
        // Group-less legacy requests are keyed as "teacher".
        myRequests[r.group ? String(r.group) : "teacher"] = r.status;
      }
    }

    const tp = teacher.teachingProfile || {};
    const stats = courseAgg[0];

    return NextResponse.json({
      success: true,
      data: {
        teacher: {
          _id: String(teacher._id),
          name: teacher.name,
          avatar: teacher.avatar || "",
          headline: tp.headline || teacher.bio || "",
          institution: tp.institution || "",
          subjects: tp.subjects || [],
          levels: tp.levels || [],
          experienceYears: tp.experienceYears || 0,
          price: tp.hourlyRate || 0,
          availability: (tp.availability || []).filter((a) => a?.day),
          rating: stats?.rating ? Math.round(stats.rating * 10) / 10 : 0,
          courses: stats?.courses || 0,
          students: groups.reduce((n, g) => n + (g.students?.length || 0), 0),
        },
        groups: groups.map((g) => ({
          _id: String(g._id),
          name: g.name,
          description: g.description || "",
          subject: g.subject || "",
          level: g.level || "",
          color: g.color || "purple",
          studentCount: g.students?.length || 0,
          myStatus: myRequests[String(g._id)] || null,
        })),
        // Reservation made before groups existed, if any.
        teacherStatus: myRequests.teacher || null,
      },
    });
  } catch (error) {
    console.error("Teacher GET error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
