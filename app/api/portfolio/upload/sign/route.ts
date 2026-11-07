import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_SIZE = 30 * 1024 * 1024;
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
    const fileName = String(body.fileName || "portfolio-file").slice(-160);
    const contentType = String(body.contentType || "");
    const size = Number(body.size || 0);

    if (!ALLOWED.has(contentType)) {
      return NextResponse.json({ error: "Supported formats: JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, MP3, WAV and OGG." }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_SIZE) {
      return NextResponse.json({ error: "Portfolio files must be between 1 byte and 30MB." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("account_type,portfolio")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (profile?.account_type !== "freelancer") {
      return NextResponse.json({ error: "Only freelancers can upload portfolio files." }, { status: 403 });
    }
    if (Array.isArray(profile.portfolio) && profile.portfolio.length >= 12) {
      return NextResponse.json({ error: "You can add up to 12 portfolio items." }, { status: 400 });
    }

    const safeName = fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-80) || "portfolio-file";
    const path = `portfolio/${user.id}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const { data, error: signError } = await supabaseAdmin.storage
      .from("portfolio-media")
      .createSignedUploadUrl(path, { upsert: false });

    if (signError || !data?.token) {
      console.error("Portfolio signed upload creation failed:", signError);
      return NextResponse.json({ error: "Could not create upload permission. Check that the portfolio-media bucket exists and is writable." }, { status: 500 });
    }

    return NextResponse.json({ path, token: data.token });
  } catch (error) {
    console.error("Portfolio upload signing error:", error);
    return NextResponse.json({ error: "Unable to prepare this portfolio upload." }, { status: 500 });
  }
}
