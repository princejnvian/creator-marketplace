import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const MAX_SIZE = 30 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const body = await request.json();
    const gigId = String(body.gigId || "").trim();
    const packageId = String(body.packageId || "").trim();
    const fileName = String(body.fileName || "sample").slice(-160);
    const contentType = String(body.contentType || "");
    const size = Number(body.size || 0);
    if (!gigId || !packageId) return NextResponse.json({ error: "Gig and package are required." }, { status: 400 });
    if (!ALLOWED.has(contentType)) return NextResponse.json({ error: "Supported formats: JPG, PNG, WEBP, GIF, MP4, WEBM and MOV." }, { status: 400 });
    if (!Number.isFinite(size) || size <= 0 || size > MAX_SIZE) return NextResponse.json({ error: "Gig media must be between 1 byte and 30MB." }, { status: 400 });

    const { data: profile, error } = await supabaseAdmin.from("profiles").select("account_type,gigs").eq("id", user.id).maybeSingle();
    if (error) throw error;
    if (profile?.account_type !== "freelancer") return NextResponse.json({ error: "Only freelancers can add gig media." }, { status: 403 });
    const gigs = Array.isArray(profile.gigs) ? profile.gigs : [];
    const gig = gigs.find((item: any) => item?.id === gigId);
    if (!gig) return NextResponse.json({ error: "Gig not found. Refresh your profile and try again." }, { status: 404 });
    const pkg = Array.isArray(gig.packages) ? gig.packages.find((item: any) => item?.id === packageId) : null;
    if (!pkg) return NextResponse.json({ error: "Package not found. Refresh your profile and try again." }, { status: 404 });
    if (Array.isArray(pkg.media) && pkg.media.length >= 6) return NextResponse.json({ error: "You can add up to 6 photos/videos to each package." }, { status: 400 });

    const safeName = fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-80) || "sample";
    const path = `gigs/${user.id}/${gigId}/${packageId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const { data, error: signError } = await supabaseAdmin.storage.from("portfolio-media").createSignedUploadUrl(path, { upsert: false });
    if (signError || !data?.token) {
      console.error("Signed gig upload creation failed:", signError);
      return NextResponse.json({ error: "Could not create upload permission. Check that the portfolio-media bucket exists and is writable." }, { status: 500 });
    }
    return NextResponse.json({ path, token: data.token });
  } catch (error) {
    console.error("Gig media signing error:", error);
    return NextResponse.json({ error: "Unable to prepare this upload." }, { status: 500 });
  }
}
