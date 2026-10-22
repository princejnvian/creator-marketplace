import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const form = await request.formData();
  const selfie = form.get("selfie");
  const aadhaar = form.get("aadhaar");
  if (!(selfie instanceof File) || !(aadhaar instanceof File)) return NextResponse.json({ error: "Upload both a selfie and Aadhaar image." }, { status: 400 });
  const valid = (f: File) => ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size > 0 && f.size <= 5 * 1024 * 1024;
  if (!valid(selfie) || !valid(aadhaar)) return NextResponse.json({ error: "Use JPG, PNG, or WebP images up to 5 MB each." }, { status: 400 });
  const safeExt = (f: File) => f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
  const selfiePath = `${user.id}/selfie-${Date.now()}.${safeExt(selfie)}`;
  const aadhaarPath = `${user.id}/aadhaar-${Date.now()}.${safeExt(aadhaar)}`;
  const upload = async (file: File, path: string) => supabaseAdmin.storage.from("freelancer-kyc-private").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  const a = await upload(selfie, selfiePath);
  if (a.error) return NextResponse.json({ error: "Selfie upload failed. Check the private KYC storage bucket and migration." }, { status: 500 });
  const b = await upload(aadhaar, aadhaarPath);
  if (b.error) {
    await supabaseAdmin.storage.from("freelancer-kyc-private").remove([selfiePath]);
    return NextResponse.json({ error: "Aadhaar upload failed. Please try again." }, { status: 500 });
  }
  const { data: existing } = await supabaseAdmin.from("creator_payout_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  const { error } = await supabaseAdmin.from("creator_payout_profiles").upsert({
    user_id: user.id, provider: "manual_review", selfie_path: selfiePath, aadhaar_path: aadhaarPath,
    manual_review_status: "pending_review", documents_submitted_at: new Date().toISOString(),
    kyc_status: "pending_review", updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });
  if (error) {
    await supabaseAdmin.storage.from("freelancer-kyc-private").remove([selfiePath, aadhaarPath]);
    console.error("KYC metadata save failed", error, { hadExisting: !!existing });
    return NextResponse.json({ error: "Files uploaded but their status could not be saved. Run the latest migration and retry." }, { status: 500 });
  }
  return NextResponse.json({ success: true, status: "pending_review" });
}
