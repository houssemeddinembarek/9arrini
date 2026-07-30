import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const runtime = "nodejs";

// Human-friendly, unguessable share code (no ambiguous chars like O/0/I/1).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeCode(len = 8): string {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// The student's own share code — a parent redeems it to link to this child.
// GET returns (and lazily generates) the code; POST rotates it.
export async function GET() {
  return handle(false);
}
export async function POST() {
  return handle(true);
}

async function handle(rotate: boolean) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "student") {
      return NextResponse.json({ error: "Students only" }, { status: 403 });
    }

    await connectDB();
    const student = await User.findById(session.userId).select("linkCode");
    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (rotate || !student.linkCode) {
      // Retry a few times on the (astronomically unlikely) unique-index clash.
      for (let i = 0; i < 5; i++) {
        const code = makeCode();
        const clash = await User.exists({ linkCode: code, _id: { $ne: student._id } });
        if (!clash) { student.linkCode = code; break; }
      }
      await student.save();
    }

    const linkedParents = await User.countDocuments({ role: "parent", children: student._id });
    return NextResponse.json({ success: true, data: { code: student.linkCode, linkedParents } });
  } catch (error) {
    console.error("link-code error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
