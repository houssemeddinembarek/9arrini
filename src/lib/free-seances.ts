import mongoose from "mongoose";
import PlatformSettings, { SETTINGS_KEY } from "@/models/PlatformSettings";
import ClassEnrollment from "@/models/ClassEnrollment";
import User from "@/models/User";

export interface FreeSeanceStatus {
  allowance: number;
  used: number;
  remaining: number;
}

// Enrolments that hold on to a free séance. A rejected or cancelled request
// gives the séance back.
const HOLDING_STATUSES = ["pending", "confirmed"] as const;

// The number of free séances a student registering right now would receive.
export async function getFreeSeanceSetting(): Promise<number> {
  const doc = await PlatformSettings.findOne({ key: SETTINGS_KEY })
    .select("freeSeancesForNewStudents")
    .lean<{ freeSeancesForNewStudents?: number } | null>();
  return Math.max(0, doc?.freeSeancesForNewStudents ?? 0);
}

// How many free séances this student was granted. Students who registered
// before the allowance existed fall back to the current platform setting.
export async function getStudentAllowance(studentId: string): Promise<number> {
  const student = await User.findById(studentId)
    .select("studentProfile.freeSeancesAllowance")
    .lean<{ studentProfile?: { freeSeancesAllowance?: number } } | null>();
  const stamped = student?.studentProfile?.freeSeancesAllowance;
  if (typeof stamped === "number") return Math.max(0, stamped);
  return getFreeSeanceSetting();
}

// Allowance, how much of it is spoken for, and what is left.
export async function getFreeSeanceStatus(studentId: string): Promise<FreeSeanceStatus> {
  const [allowance, used] = await Promise.all([
    getStudentAllowance(studentId),
    ClassEnrollment.countDocuments({
      student: studentId,
      isFree: true,
      status: { $in: HOLDING_STATUSES },
    }),
  ]);
  return { allowance, used, remaining: Math.max(0, allowance - used) };
}

// Same figures for several students at once — used by the rosters so a teacher
// or admin can see each student's remaining free séances without N queries.
export async function getFreeSeanceStatuses(
  studentIds: string[]
): Promise<Record<string, FreeSeanceStatus>> {
  const ids = [...new Set(studentIds.map(String))].filter((id) => mongoose.isValidObjectId(id));
  if (ids.length === 0) return {};
  // The aggregation pipeline gets no schema casting, so hand it real ObjectIds.
  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

  const [students, fallback, counts] = await Promise.all([
    User.find({ _id: { $in: ids } })
      .select("studentProfile.freeSeancesAllowance")
      .lean<{ _id: unknown; studentProfile?: { freeSeancesAllowance?: number } }[]>(),
    getFreeSeanceSetting(),
    ClassEnrollment.aggregate<{ _id: unknown; n: number }>([
      { $match: { student: { $in: objectIds }, isFree: true, status: { $in: HOLDING_STATUSES } } },
      { $group: { _id: "$student", n: { $sum: 1 } } },
    ]),
  ]);

  const usedBy = new Map(counts.map((c) => [String(c._id), c.n]));
  const out: Record<string, FreeSeanceStatus> = {};
  for (const s of students) {
    const stamped = s.studentProfile?.freeSeancesAllowance;
    const allowance = Math.max(0, typeof stamped === "number" ? stamped : fallback);
    const used = usedBy.get(String(s._id)) ?? 0;
    out[String(s._id)] = { allowance, used, remaining: Math.max(0, allowance - used) };
  }
  return out;
}
