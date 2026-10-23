import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { id } = await params;
    if (!id || id.length > 100) return NextResponse.json({ error: "Invalid gig ID." }, { status: 400 });

    const { data: profile, error: readError } = await supabaseAdmin
      .from("profiles")
      .select("id, account_type, gigs, service_packages")
      .eq("id", user.id)
      .maybeSingle();
    if (readError) throw readError;
    if (!profile || profile.account_type !== "freelancer") return NextResponse.json({ error: "Freelancer profile not found." }, { status: 404 });

    const gigs = Array.isArray(profile.gigs) ? profile.gigs : [];
    const target = gigs.find((gig: any) => String(gig?.id) === String(id));
    if (!target) return NextResponse.json({ error: "Gig not found or already deleted." }, { status: 404 });
    const remaining = gigs.filter((gig: any) => String(gig?.id) !== String(id));

    // Persist the deletion first. The gig is stored in profiles.gigs JSON, not a separate gigs table.
    const { error: updateError } = await supabaseAdmin.from("profiles").update({
      gigs: remaining,
      service_packages: remaining[0]?.packages || [],
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (updateError) throw updateError;

    // Best-effort cleanup for media objects that have a stored bucket path.
    const paths: string[] = [];
    const collect = (items: any[]) => items.forEach((media) => {
      if (typeof media?.path === "string" && media.path && !media.path.startsWith("http")) paths.push(media.path);
    });
    collect(Array.isArray(target.media) ? target.media : []);
    (Array.isArray(target.packages) ? target.packages : []).forEach((pkg: any) => collect(Array.isArray(pkg?.media) ? pkg.media : []));
    if (paths.length) {
      // Try the existing gig-media bucket; storage cleanup must not undo a successful DB delete.
      const cleanup = await supabaseAdmin.storage.from("gig-media").remove([...new Set(paths)]);
      if (cleanup.error) console.warn("Gig removed from database, but media cleanup failed:", cleanup.error.message);
    }

    return NextResponse.json({ success: true, deletedGigId: id, gigs: remaining });
  } catch (error) {
    console.error("Gig deletion error:", error);
    return NextResponse.json({ error: "Unable to delete this gig from the database." }, { status: 500 });
  }
}
