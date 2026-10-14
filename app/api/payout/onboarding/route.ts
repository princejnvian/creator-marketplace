import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

  // Do not collect PAN/Aadhaar/bank details in YOUTENT. Route onboarding must be hosted/approved
  // by Razorpay for this merchant. The URL is configured only after Razorpay enables Route.
  const onboardingUrl = process.env.RAZORPAY_ROUTE_ONBOARDING_URL;
  if (!onboardingUrl) {
    return NextResponse.json({
      error: "Razorpay Route onboarding is not configured for YOUTENT yet. Enable Route and obtain the approved onboarding flow/URL from Razorpay first. No documents or bank details have been collected.",
      code: "ROUTE_NOT_CONFIGURED",
    }, { status: 409 });
  }

  let parsed: URL;
  try { parsed = new URL(onboardingUrl); } catch {
    return NextResponse.json({ error: "The configured Razorpay onboarding URL is invalid." }, { status: 500 });
  }
  if (parsed.protocol !== "https:" || !/(^|\.)razorpay\.com$/i.test(parsed.hostname)) {
    return NextResponse.json({ error: "The onboarding URL must be an HTTPS Razorpay-hosted URL." }, { status: 500 });
  }

  const { error } = await supabaseAdmin.from("creator_payout_profiles").upsert({
    user_id: user.id,
    provider: "razorpay_route",
    kyc_status: "in_progress",
    onboarding_started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) {
    console.error("KYC onboarding status update failed", error);
    return NextResponse.json({ error: "Could not save onboarding status. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ onboardingUrl: parsed.toString() });
}
