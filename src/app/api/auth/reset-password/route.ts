import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Code à 6 chiffres requis"),
  password: z.string().min(6, "6 caractères minimum"),
});

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, code, password } = parsed.data;

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+resetPasswordToken +resetPasswordExpiry +password"
    );

    if (
      !user ||
      !user.resetPasswordToken ||
      !user.resetPasswordExpiry ||
      user.resetPasswordExpiry.getTime() < Date.now() ||
      user.resetPasswordToken !== hashCode(code)
    ) {
      return NextResponse.json(
        { success: false, error: "Code invalide ou expiré" },
        { status: 400 }
      );
    }

    // The pre-save hook hashes the new password.
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: "Mot de passe réinitialisé. Tu peux te connecter." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
