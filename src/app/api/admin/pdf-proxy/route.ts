import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";

// Streams a Cloudinary-hosted PDF back through our own origin with proper
// inline PDF headers so it renders natively in the admin dashboard viewer
// (raw Cloudinary delivery often forces a download instead of inline display).
export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // SSRF guard: only proxy Cloudinary delivery URLs.
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (target.protocol !== "https:" || target.hostname !== "res.cloudinary.com") {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
  }

  const upstream = await fetch(target.toString());
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=300",
    },
  });
}
