import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const { data: checkout, error } = await supabaseAdmin.from("checkout_orders")
      .select("id, client_id, status, project_id, package_price, platform_fee, razorpay_order_id")
      .eq("id", id).maybeSingle();
    if (error || !checkout || checkout.client_id !== user.id) return NextResponse.json({ error: "Checkout not found." }, { status: 404 });

    let paymentCaptured = false;
    let recoveryPending = false;
    if ((!checkout.project_id || checkout.status !== "paid") && checkout.razorpay_order_id) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keyId || !keySecret) return NextResponse.json({ error: "Payment verification is not configured.", status: checkout.status, projectId: checkout.project_id || null }, { status: 503 });
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const expectedPaise = Math.round((Number(checkout.package_price) + Number(checkout.platform_fee)) * 100);
      const order = await razorpay.orders.fetch(String(checkout.razorpay_order_id));
      if (order.id !== checkout.razorpay_order_id || order.currency !== "INR" || Number(order.amount) !== expectedPaise) {
        return NextResponse.json({ error: "Razorpay order does not match this checkout.", status: checkout.status, projectId: checkout.project_id || null }, { status: 409 });
      }
      const paymentsResult = await razorpay.orders.fetchPayments(String(checkout.razorpay_order_id));
      const payments = Array.isArray((paymentsResult as any)?.items) ? (paymentsResult as any).items : [];
      const captured = payments.find((p: any) => p.order_id === checkout.razorpay_order_id && p.status === "captured" && p.currency === "INR" && Number(p.amount) === expectedPaise);
      paymentCaptured = Boolean(captured);
      if (captured) {
        const { data: projectId, error: finalizeError } = await supabaseAdmin.rpc("finalize_checkout_payment", {
          p_checkout_id: checkout.id,
            p_razorpay_order_id: String(checkout.razorpay_order_id),
            p_razorpay_payment_id: String(captured.id),
            p_expected_total: Number(checkout.package_price) + Number(checkout.platform_fee),
        });
        if (finalizeError || !projectId) {
          recoveryPending = true;
          console.error("Checkout status recovery finalization failed", { checkoutId: checkout.id, orderId: checkout.razorpay_order_id, paymentId: captured.id, code: (finalizeError as any)?.code, message: finalizeError?.message, details: (finalizeError as any)?.details, hint: (finalizeError as any)?.hint });
        }
      }
    }
    const { data: latest, error: latestError } = await supabaseAdmin.from("checkout_orders")
      .select("status, project_id").eq("id", id).maybeSingle();
    if (latestError || !latest) return NextResponse.json({ error: "Unable to refresh checkout status." }, { status: 500 });
    return NextResponse.json({ status: latest.status, projectId: latest.project_id || null, paymentCaptured, recoveryPending,
      message: latest.project_id && latest.status === "paid" ? "Payment verified and project is ready." : paymentCaptured ? "Payment is captured. Do not pay again; project recovery is still pending." : "No captured payment was found for this checkout." });
  } catch (error) {
    console.error("Checkout status/recovery error:", error);
    return NextResponse.json({ error: "Unable to verify payment status right now. Do not retry payment until the status is checked." }, { status: 503 });
  }
}
