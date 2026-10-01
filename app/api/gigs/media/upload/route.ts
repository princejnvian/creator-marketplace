import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_SIZE = 30 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");
    const gigId = String(formData.get("gigId") || "").trim();
    if (!(file instanceof File)) return NextResponse.json({ error: "Please select an image or video." }, { status: 400 });
    if (!gigId) return NextResponse.json({ error: "Gig ID is required." }, { status: 400 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Supported formats: JPG, PNG, WEBP, GIF, MP4, WEBM and MOV." }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "Gig media must be 30MB or smaller." }, { status: 400 });

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.account_type !== "freelancer") return NextResponse.json({ error: "Only freelancers can add gig media." }, { status: 403 });

    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-80);
    const path = `gigs/${user.id}/${gigId}/${Date.now()}-${safeName || "gig-media"}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage.from("portfolio-media").upload(path, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (uploadError) return NextResponse.json({ error: "Unable to upload this gig media." }, { status: 500 });

    const { data } = supabaseAdmin.storage.from("portfolio-media").getPublicUrl(path);
    return NextResponse.json({
      success: true,
      url: data.publicUrl,
      path,
      mediaType: file.type.startsWith("video/") ? "video" : "image",
      name: file.name,
    });
  } catch (error) {
    console.error("Gig media upload error:", error);
    return NextResponse.json({ error: "Something went wrong while uploading the gig media." }, { status: 500 });
  }
}
