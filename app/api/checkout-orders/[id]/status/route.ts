import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data: checkout, error } = await supabaseAdmin
    .from("checkout_orders")
    .select("id, client_id, status, project_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !checkout || checkout.client_id !== user.id) {
    return NextResponse.json({ error: "Checkout not found." }, { status: 404 });
  }

  return NextResponse.json({
    status: checkout.status,
    projectId: checkout.project_id || null,
  });
}
