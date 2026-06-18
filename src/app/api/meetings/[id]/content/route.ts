import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Meeting from "@/models/Meeting";
import Content from "@/models/Content";
import TutoringRequest from "@/models/TutoringRequest";

// Is this user allowed in the meeting? (owning teacher, invited student, or an
// accepted tutoring student of the teacher). Mirrors the meeting GET rules.
async function resolveAccess(meetingId: string, userId: string) {
  const meeting = await Meeting.findById(meetingId)
    .select("teacher students sharedContent")
    .lean<{ teacher: unknown; students: unknown[] } & Record<string, unknown> | null>();
  if (!meeting) return { meeting: null, isTeacher: false, allowed: false };

  const teacherId = String(meeting.teacher);
  const isTeacher = teacherId === userId;
  let allowed = isTeacher || (meeting.students || []).some((s) => String(s) === userId);
  if (!allowed) {
    const accepted = await TutoringRequest.findOne({
      student: userId,
      teacher: teacherId,
      status: "accepted",
    }).select("_id").lean();
    allowed = !!accepted;
  }
  return { meeting, isTeacher, allowed };
}

// The content the teacher is currently sharing in this meeting.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const { meeting, allowed } = await resolveAccess(id, session.userId);
    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const ids = ((meeting.sharedContent as unknown[]) || []).map(String);
    const items = await Content.find({ _id: { $in: ids } })
      .select("title subject level contentType source body pdfUrl")
      .lean();

    // Preserve the teacher's chosen order.
    items.sort((a, b) => ids.indexOf(String(a._id)) - ids.indexOf(String(b._id)));

    return NextResponse.json({ success: true, data: { items } });
  } catch (error) {
    console.error("Meeting content GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Replace the shared content list (teacher only). Accepts one or many ids.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const { meeting, isTeacher } = await resolveAccess(id, session.userId);
    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    if (!isTeacher) return NextResponse.json({ error: "Teachers only" }, { status: 403 });

    const body = await request.json();
    const requested: string[] = Array.isArray(body.contentIds) ? body.contentIds.map(String) : [];

    // Only the teacher's own content can be shared; keep the requested order.
    const owned = await Content.find({ _id: { $in: requested }, teacher: session.userId })
      .select("_id")
      .lean();
    const ownedSet = new Set(owned.map((c) => String(c._id)));
    const finalIds = requested.filter((cid) => ownedSet.has(cid));

    await Meeting.updateOne({ _id: id }, { $set: { sharedContent: finalIds } }, { strict: false });

    const items = await Content.find({ _id: { $in: finalIds } })
      .select("title subject level contentType source body pdfUrl")
      .lean();
    items.sort((a, b) => finalIds.indexOf(String(a._id)) - finalIds.indexOf(String(b._id)));

    return NextResponse.json({ success: true, data: { items } });
  } catch (error) {
    console.error("Meeting content PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
