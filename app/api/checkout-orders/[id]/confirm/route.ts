import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const paymentId = String(body?.razorpay_payment_id || "");
    const orderId = String(body?.razorpay_order_id || "");
    const signature = String(body?.razorpay_signature || "");
    if (!paymentId || !orderId || !signature) return NextResponse.json({ error: "Missing Razorpay payment details." }, { status: 400 });

    const { data: checkout, error: checkoutError } = await supabaseAdmin
      .from("checkout_orders")
      .select("*")
      .eq("id", id)
      .eq("client_id", user.id)
      .maybeSingle();

    if (checkoutError || !checkout) return NextResponse.json({ error: "Checkout order not found." }, { status: 404 });
    if (checkout.status === "paid" && checkout.project_id) return NextResponse.json({ success: true, projectId: checkout.project_id });
    // A previous callback may have left this row in `processing` after the
    // payment was captured. Do not block recovery based on that stale status;
    // the database finalizer locks the checkout and is idempotent.
    if (!["created", "processing"].includes(String(checkout.status))) {
      return NextResponse.json({ error: "This checkout cannot be finalized from its current status." }, { status: 409 });
    }
    if (checkout.razorpay_order_id !== orderId) return NextResponse.json({ error: "Razorpay order does not match this checkout." }, { status: 400 });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ error: "Payment system is not configured." }, { status: 500 });

    const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.fetch(orderId);
    const payment = await razorpay.payments.fetch(paymentId);
    const expectedPaise = Math.round((Number(checkout.package_price) + Number(checkout.platform_fee)) * 100);

    if (order.id !== orderId || order.currency !== "INR" || Number(order.amount) !== expectedPaise) return NextResponse.json({ error: "Razorpay order details do not match this checkout." }, { status: 400 });
    if (payment.order_id !== orderId || payment.currency !== "INR" || Number(payment.amount) !== expectedPaise || payment.status !== "captured") return NextResponse.json({ error: "Payment has not been captured correctly." }, { status: 400 });

    const { data: projectId, error: finalizeError } = await supabaseAdmin.rpc("finalize_checkout_payment", {
      p_checkout_id: checkout.id,
      p_expected_total: Number(checkout.package_price) + Number(checkout.platform_fee),
      p_razorpay_order_id: orderId,
      p_razorpay_payment_id: paymentId,
    });

    if (finalizeError || !projectId) {
      console.error("Atomic checkout finalization failed:", {
        checkoutId: checkout.id,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        error: finalizeError?.message,
        code: (finalizeError as any)?.code,
        details: (finalizeError as any)?.details,
        hint: (finalizeError as any)?.hint,
      });
      return NextResponse.json({
        error: "Payment was captured, but project setup could not be finalized yet. Do not pay again. Contact support with the checkout ID.",
        paymentCaptured: true,
        retryable: true,
        checkoutId: checkout.id,
      }, { status: 202 });
    }

    return NextResponse.json({ success: true, projectId: String(projectId) });
  } catch (error) {
    console.error("Checkout confirmation error:", error);
    return NextResponse.json({ error: "Something went wrong while confirming payment." }, { status: 500 });
  }
}