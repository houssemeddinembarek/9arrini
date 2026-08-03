import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { generateUniqueLinkCode } from "@/lib/link-code";
import { sendMail } from "@/lib/mailer";
import { isAdmin } from "@/lib/roles";
import User from "@/models/User";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email("Adresse email invalide") });

// The administration emails a student's parent an invitation: a link to the
// parent sign-up page pre-filled with the child's code, redeemed at sign-up.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(session.role)) {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { email } = parsed.data;

    const { id } = await params;
    await connectDB();

    const student = await User.findById(id).select("name role linkCode");
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    if (student.role !== "student") {
      return NextResponse.json({ error: "This user is not a student" }, { status: 400 });
    }
    if (!student.linkCode) {
      student.linkCode = await generateUniqueLinkCode(student._id);
      await student.save();
    }

    const appName = process.env.NEXT_PUBLIC_APP_NAME || "Telmidhi";
    const base = process.env.NEXT_PUBLIC_APP_URL || "";
    const url = `${base}/register/parent?code=${student.linkCode}`;

    try {
      await sendMail({
        to: email,
        subject: `Suivez la progression de ${student.name} sur ${appName}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto">
            <h2>Invitation parent</h2>
            <p>L'établissement vous invite à suivre la progression scolaire de <strong>${student.name}</strong> sur ${appName}.</p>
            <p>Créez votre compte parent — le lien avec votre enfant est déjà pré-rempli :</p>
            <p><a href="${url}" style="display:inline-block;padding:10px 18px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none">Créer mon compte parent</a></p>
            <p style="color:#666;font-size:13px">Ou saisissez ce code après inscription : <strong style="letter-spacing:2px">${student.linkCode}</strong></p>
          </div>`,
      });
    } catch (e) {
      console.error("admin invite-parent mail error:", e);
      return NextResponse.json(
        { error: "L'email n'a pas pu être envoyé. Vérifiez la configuration SMTP." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin invite-parent error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
