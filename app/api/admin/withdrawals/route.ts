import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  const allowed = (process.env.ADMIN_EMAILS || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (!user.email || !allowed.includes(user.email.toLowerCase())) {
    return { error: NextResponse.json({ error: "Admin access is not enabled for this account." }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { data, error } = await supabaseAdmin
    .from("withdrawal_requests")
    .select("id,user_id,amount,currency,status,provider,provider_payout_id,idempotency_key,failure_reason,created_at,updated_at,processed_at,manual_payment_reference,admin_note")
    .order("created_at", { ascending: false }).limit(250);
  if (error) {
    console.error("Admin withdrawals read failed", error);
    return NextResponse.json({ error: "Could not load withdrawal requests. Apply the latest migration first." }, { status: 500 });
  }
  const ids = [...new Set((data || []).map((x) => x.user_id))];
  const { data: profiles } = ids.length ? await supabaseAdmin.from("profiles").select("*").in("id", ids) : { data: [] as any[] };
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
  return NextResponse.json({ withdrawals: (data || []).map((w) => ({ ...w, profile: profileMap.get(w.user_id) || null })) });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const id = String(body?.id || "");
  const action = String(body?.action || "");
  const reference = String(body?.reference || "").trim().slice(0, 180);
  const note = String(body?.note || "").trim().slice(0, 1000);
  if (!id || !["processing", "paid", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid withdrawal action." }, { status: 400 });
  }
  if (action === "paid" && reference.length < 4) {
    return NextResponse.json({ error: "Enter the bank UTR / transfer reference before marking paid." }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.rpc("admin_process_withdrawal", {
    p_withdrawal_id: id,
    p_action: action,
    p_admin_email: auth.user.email!,
    p_reference: reference || null,
    p_note: note || null,
  });
  if (error) {
    console.error("Admin withdrawal action failed", error);
    return NextResponse.json({ error: error.message || "Could not update withdrawal." }, { status: 400 });
  }
  return NextResponse.json({ success: true, result: data });
}
