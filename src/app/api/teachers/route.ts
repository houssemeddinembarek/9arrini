import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Group from "@/models/Group";
import Course from "@/models/Course";

// Public list of approved teachers for the landing page / tutoring directory,
// with real counts (groups, students) and average course rating.
export async function GET() {
  try {
    await connectDB();

    const teachers = await User.find({ role: "teacher", isApproved: true })
      .select("name avatar bio teachingProfile createdAt")
      .sort({ createdAt: -1 })
      .limit(12)
      .lean<
        {
          _id: unknown;
          name: string;
          avatar?: string;
          bio?: string;
          teachingProfile?: {
            headline?: string;
            subjects?: string[];
            levels?: string[];
            experienceYears?: number;
            hourlyRate?: number;
            availability?: { day: string }[];
          };
        }[]
      >();

    const ids = teachers.map((t) => t._id);

    const [groupAgg, courseAgg] = await Promise.all([
      Group.aggregate([
        { $match: { teacher: { $in: ids } } },
        { $group: { _id: "$teacher", groups: { $sum: 1 }, students: { $sum: { $size: { $ifNull: ["$students", []] } } } } },
      ]),
      Course.aggregate([
        { $match: { teacher: { $in: ids }, status: "published" } },
        { $group: { _id: "$teacher", rating: { $avg: "$rating" }, courses: { $sum: 1 } } },
      ]),
    ]);

    const groupBy = new Map(groupAgg.map((g) => [String(g._id), g]));
    const courseBy = new Map(courseAgg.map((c) => [String(c._id), c]));

    const data = teachers.map((t) => {
      const g = groupBy.get(String(t._id));
      const c = courseBy.get(String(t._id));
      const tp = t.teachingProfile || {};
      return {
        _id: String(t._id),
        name: t.name,
        avatar: t.avatar || "",
        specialty: tp.subjects?.[0] || "",
        subjects: tp.subjects || [],
        level: tp.levels?.slice(0, 2).join(", ") || "",
        bio: tp.headline || t.bio || "",
        rating: c?.rating ? Math.round(c.rating * 10) / 10 : 0,
        students: g?.students || 0,
        groups: g?.groups || 0,
        price: tp.hourlyRate || 0,
        experienceYears: tp.experienceYears || 0,
        availableDays: (tp.availability || []).map((a) => a.day).filter(Boolean),
      };
    });

    // Most active teachers first (by students, then groups).
    data.sort((a, b) => b.students - a.students || b.groups - a.groups);

    return NextResponse.json({ success: true, data: { teachers: data } });
  } catch (error) {
    console.error("Teachers GET error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
