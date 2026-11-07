import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4",
]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const body = await request.json();
    const path = String(body.path || "").trim();
    const fileName = String(body.fileName || "Portfolio work").slice(0, 160);
    const contentType = String(body.contentType || "");
    const expectedPrefix = `portfolio/${user.id}/`;

    if (!path.startsWith(expectedPrefix) || !ALLOWED.has(contentType)) {
      return NextResponse.json({ error: "Invalid portfolio upload details." }, { status: 400 });
    }

    const { data: { publicUrl } } = supabase.storage.from("portfolio-media").getPublicUrl(path);
    return NextResponse.json({
      success: true,
      url: publicUrl,
      path,
      mediaType: contentType.startsWith("video/") ? "video" : contentType.startsWith("audio/") ? "audio" : "image",
      name: fileName,
    });
  } catch (error) {
    console.error("Portfolio upload completion error:", error);
    return NextResponse.json({ error: "Unable to finish this portfolio upload." }, { status: 500 });
  }
}
