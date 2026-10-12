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
    const { data: checkout, error } = await supabaseAdmin
      .from("checkout_orders")
      .select("id, client_id, status, project_id, razorpay_order_id, package_price, platform_fee")
      .eq("id", id)
      .maybeSingle();

    if (error || !checkout || checkout.client_id !== user.id) {
      return NextResponse.json({ error: "Checkout not found." }, { status: 404 });
    }

    if (checkout.status === "paid" && checkout.project_id) {
      return NextResponse.json({ status: "paid", projectId: checkout.project_id });
    }

    // Recovery path: if Razorpay captured the payment but the browser callback
    // failed, discover the captured payment from the order and safely finalize it.
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (
      checkout.razorpay_order_id &&
      ["created", "processing"].includes(String(checkout.status)) &&
      keyId &&
      keySecret
    ) {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const [order, paymentsResponse] = await Promise.all([
        razorpay.orders.fetch(checkout.razorpay_order_id),
        razorpay.orders.fetchPayments(checkout.razorpay_order_id),
      ]);

      const expectedPaise = Math.round(
        (Number(checkout.package_price) + Number(checkout.platform_fee)) * 100
      );
      const payments = (paymentsResponse as any)?.items ?? [];
      const captured = payments.find((payment: any) =>
        payment?.status === "captured" &&
        payment?.order_id === checkout.razorpay_order_id &&
        payment?.currency === "INR" &&
        Number(payment?.amount) === expectedPaise
      );

      if (
        order.id === checkout.razorpay_order_id &&
        order.currency === "INR" &&
        Number(order.amount) === expectedPaise &&
        captured?.id
      ) {
        const total = Number(checkout.package_price) + Number(checkout.platform_fee);
        const { data: projectId, error: finalizeError } = await supabaseAdmin.rpc(
          "finalize_checkout_payment",
          {
            p_checkout_id: checkout.id,
            p_razorpay_order_id: checkout.razorpay_order_id,
            p_razorpay_payment_id: String(captured.id),
            p_expected_total: total,
          }
        );

        if (finalizeError || !projectId) {
          console.error("Checkout status recovery finalization failed:", {
            checkoutId: checkout.id,
            razorpayOrderId: checkout.razorpay_order_id,
            razorpayPaymentId: captured.id,
            code: (finalizeError as any)?.code,
            message: finalizeError?.message,
            details: (finalizeError as any)?.details,
            hint: (finalizeError as any)?.hint,
          });
        } else {
          return NextResponse.json({ status: "paid", projectId: String(projectId), recovered: true });
        }
      }
    }

    // Re-read in case a webhook or callback finalized while this request ran.
    const { data: latest } = await supabaseAdmin
      .from("checkout_orders")
      .select("status, project_id")
      .eq("id", id)
      .maybeSingle();

    return NextResponse.json({
      status: latest?.status || checkout.status,
      projectId: latest?.project_id || checkout.project_id || null,
    });
  } catch (error) {
    console.error("Checkout status/recovery error:", error);
    return NextResponse.json({ error: "Unable to verify checkout status right now." }, { status: 500 });
  }
}
