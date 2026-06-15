import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { signToken } from "@/lib/jwt";
import User from "@/models/User";
import { z } from "zod";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["student", "teacher"]).default("student"),
    // Student schooling details.
    stage: z.string().optional(),
    year: z.string().optional(),
    section: z.string().optional(),
    governorate: z.string().optional(),
  })
  .refine(
    (d) => d.role !== "student" || (!!d.stage && !!d.year && !!d.governorate),
    { message: "Niveau, année et gouvernorat sont requis", path: ["stage"] }
  );

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, role, stage, year, section, governorate } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      isApproved: role === "student" ? true : false,
      studentProfile:
        role === "student"
          ? { stage, year, section: section || "", governorate }
          : undefined,
    });

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
        },
      },
      message: "Account created successfully",
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
    console.error("Register error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
