import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { data, error } = await supabaseAdmin.from("creator_payout_profiles")
    .select("account_holder_name,bank_account_number,bank_ifsc,upi_id,phone_number,selfie_path,aadhaar_path,manual_review_status,manual_review_note,documents_submitted_at,kyc_status")
    .eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load payout details." }, { status: 500 });
  return NextResponse.json({ details: data || null });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const accountHolderName = String(body.accountHolderName || "").trim().slice(0, 120);
  const bankAccountNumber = String(body.bankAccountNumber || "").replace(/\s/g, "").slice(0, 34);
  const bankIfsc = String(body.bankIfsc || "").trim().toUpperCase();
  const upiId = String(body.upiId || "").trim().slice(0, 120);
  const phoneNumber = String(body.phoneNumber || "").trim().slice(0, 20);
  if (!accountHolderName) return NextResponse.json({ error: "Enter the account holder name." }, { status: 400 });
  if (bankAccountNumber && !/^[0-9]{6,34}$/.test(bankAccountNumber)) return NextResponse.json({ error: "Enter a valid bank account number." }, { status: 400 });
  if (bankIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc)) return NextResponse.json({ error: "Enter a valid IFSC code." }, { status: 400 });
  if (!bankAccountNumber && !upiId) return NextResponse.json({ error: "Enter bank account details or a UPI ID." }, { status: 400 });
  const { error } = await supabaseAdmin.from("creator_payout_profiles").upsert({
    user_id: user.id, provider: "manual_review", account_holder_name: accountHolderName,
    bank_account_number: bankAccountNumber || null, bank_ifsc: bankIfsc || null,
    upi_id: upiId || null, phone_number: phoneNumber || null, updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });
  if (error) { console.error("Payout details save failed", error); return NextResponse.json({ error: "Could not save payout details. Run the latest Supabase migration first." }, { status: 500 }); }
  return NextResponse.json({ success: true });
}
