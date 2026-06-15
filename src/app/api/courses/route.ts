import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from "@/lib/auth";
import Course from "@/models/Course";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const createCourseSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  shortDescription: z.string().max(200).optional(),
  category: z.string(),
  classe: z.string().optional(),
  trimestre: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  price: z.number().min(0).default(0),
  isFree: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  language: z.string().default("English"),
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");
    const classe = searchParams.get("classe");
    const trimestre = searchParams.get("trimestre");
    const level = searchParams.get("level");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";

    const query: Record<string, unknown> = { status: "published" };
    if (category && category !== "all") query.category = category;
    if (classe && classe !== "all") query.classe = classe;
    if (trimestre && trimestre !== "all") query.trimestre = trimestre;
    if (level && level !== "all") query.level = level;
    if (search) query.$text = { $search: search };

    const sortOptions: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      popular: { enrollmentCount: -1 },
      rating: { rating: -1 },
      price_low: { price: 1 },
      price_high: { price: -1 },
    };

    const skip = (page - 1) * limit;
    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(limit)
        .populate("teacher", "name avatar")
        .lean(),
      Course.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        courses,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get courses error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !["teacher", "admin"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const parsed = createCourseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const slug = slugify(parsed.data.title);
    const existing = await Course.findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const course = await Course.create({
      ...parsed.data,
      slug: finalSlug,
      teacher: session.userId,
    });

    return NextResponse.json({ success: true, data: { course } }, { status: 201 });
  } catch (error) {
    console.error("Create course error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
