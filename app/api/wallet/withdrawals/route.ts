import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { data, error } = await supabase.from("withdrawal_requests")
    .select("id,amount,currency,status,provider,manual_payment_reference,failure_reason,admin_note,created_at,updated_at,processed_at")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: "Could not load withdrawals." }, { status: 500 });
  return NextResponse.json({ withdrawals: data || [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount < 100 || Math.round(amount * 100) !== amount * 100) {
    return NextResponse.json({ error: "Minimum withdrawal is ₹100. Enter an amount with up to two decimal places." }, { status: 400 });
  }
  const key = crypto.randomUUID();
  const { data, error } = await supabaseAdmin.rpc("request_manual_withdrawal", {
    p_user_id: user.id,
    p_amount: amount,
    p_idempotency_key: key,
  });
  if (error) {
    console.error("Withdrawal request failed", error);
    return NextResponse.json({ error: error.message || "Withdrawal request could not be created." }, { status: 400 });
  }
  return NextResponse.json({ success: true, withdrawal: data });
}
