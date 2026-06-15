import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { adminAuth } from "@/lib/firebase-admin";
import { signToken } from "@/lib/jwt";
import User from "@/models/User";
import { z } from "zod";

const schema = z.object({ idToken: z.string().min(10, "Missing token") });

// Firebase sign_in_provider id → our internal provider name.
const PROVIDER_MAP: Record<string, "google" | "facebook"> = {
  "google.com": "google",
  "facebook.com": "facebook",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Verify the Firebase ID token — this is what makes the identity trustworthy.
    const decoded = await adminAuth.verifyIdToken(parsed.data.idToken);
    const email = decoded.email?.toLowerCase();
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Ce compte ne fournit pas d'adresse email." },
        { status: 400 }
      );
    }
    const provider = PROVIDER_MAP[decoded.firebase?.sign_in_provider || ""] || "local";

    await connectDB();
    let user = await User.findOne({ email });

    if (!user) {
      // First time: create a student account from the social profile.
      user = await User.create({
        name: decoded.name || email.split("@")[0],
        email,
        provider,
        providerId: decoded.uid,
        avatar: decoded.picture || "",
        role: "student",
        isApproved: true,
      });
    } else if (!user.providerId) {
      // Existing local account with the same email — link the social identity.
      user.providerId = decoded.uid;
      if (!user.avatar && decoded.picture) user.avatar = decoded.picture;
      await user.save();
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          xp: user.xp,
          level: user.level,
          isApproved: user.isApproved,
        },
      },
      message: "Logged in successfully",
    });

    response.cookies.set("skillora-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Social auth error:", error);
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 });
  }
}
