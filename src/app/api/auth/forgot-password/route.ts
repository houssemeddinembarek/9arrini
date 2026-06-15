import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendMail, passwordResetEmail } from "@/lib/mailer";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

// Generic response so we never reveal whether an email is registered.
const GENERIC = {
  success: true,
  message: "Si un compte existe pour cet email, un code de vérification a été envoyé.",
};

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Email invalide" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() });

    // Only local accounts have a password to reset; social accounts sign in
    // through their provider. Either way we return the same generic message.
    if (user && user.provider === "local") {
      const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
      user.resetPasswordToken = hashCode(code);
      user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      const { subject, html } = passwordResetEmail(user.name, code);
      await sendMail({ to: user.email, subject, html });
    }

    return NextResponse.json(GENERIC);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
