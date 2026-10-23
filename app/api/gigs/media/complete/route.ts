import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"]);
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const body = await request.json();
    const gigId = String(body.gigId || "").trim();
    const packageId = String(body.packageId || "").trim();
    const path = String(body.path || "").trim();
    const fileName = String(body.fileName || "Sample media").slice(0, 160);
    const contentType = String(body.contentType || "");
    const expectedPrefix = `gigs/${user.id}/${gigId}/${packageId}/`;
    if (!gigId || !packageId || !path.startsWith(expectedPrefix) || !ALLOWED.has(contentType)) {
      return NextResponse.json({ error: "Invalid upload details." }, { status: 400 });
    }

    const { data: profile, error: readError } = await supabaseAdmin.from("profiles").select("account_type,gigs").eq("id", user.id).maybeSingle();
    if (readError) throw readError;
    if (profile?.account_type !== "freelancer") return NextResponse.json({ error: "Only freelancers can add gig media." }, { status: 403 });
    const gigs = Array.isArray(profile.gigs) ? profile.gigs.map((item: any) => ({ ...item })) : [];
    const gigIndex = gigs.findIndex((item: any) => item?.id === gigId);
    if (gigIndex < 0) return NextResponse.json({ error: "Gig not found. Refresh your profile and try again." }, { status: 404 });
    const gig = gigs[gigIndex];
    const packages = Array.isArray(gig.packages) ? gig.packages.map((item: any) => ({ ...item })) : [];
    const packageIndex = packages.findIndex((item: any) => item?.id === packageId);
    if (packageIndex < 0) return NextResponse.json({ error: "Package not found. Refresh your profile and try again." }, { status: 404 });
    const existingMedia = Array.isArray(packages[packageIndex].media) ? packages[packageIndex].media : [];
    if (existingMedia.length >= 6) return NextResponse.json({ error: "You can add up to 6 photos/videos to each package." }, { status: 400 });

    const { data: fileData, error: fileError } = await supabaseAdmin.storage.from("portfolio-media").download(path);
    if (fileError || !fileData) return NextResponse.json({ error: "File was not found in storage. Please upload it again." }, { status: 400 });
    const { data: publicData } = supabaseAdmin.storage.from("portfolio-media").getPublicUrl(path);
    const media = { id: crypto.randomUUID(), url: publicData.publicUrl, path, mediaType: contentType.startsWith("video/") ? "video" : "image", title: fileName };
    packages[packageIndex] = { ...packages[packageIndex], media: [...existingMedia, media] };
    gigs[gigIndex] = { ...gig, packages };
    const { error: updateError } = await supabaseAdmin.from("profiles").update({ gigs, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (updateError) {
      await supabaseAdmin.storage.from("portfolio-media").remove([path]);
      console.error("Gig media profile save error:", updateError);
      return NextResponse.json({ error: "File uploaded but could not be attached to the gig. Please retry." }, { status: 500 });
    }
    return NextResponse.json({ success: true, media, url: media.url, path, mediaType: media.mediaType });
  } catch (error) {
    console.error("Gig media completion error:", error);
    return NextResponse.json({ error: "Unable to save the uploaded media to this gig." }, { status: 500 });
  }
}
