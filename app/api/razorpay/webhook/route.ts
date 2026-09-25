import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Razorpay webhook secret is missing");

      return NextResponse.json(
        { error: "Webhook is not configured" },
        { status: 500 }
      );
    }

    // Read raw body exactly as Razorpay sent it
    const rawBody = await request.text();

    const signature = request.headers.get(
      "x-razorpay-signature"
    );

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Razorpay signature" },
        { status: 400 }
      );
    }

    // Verify Razorpay webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid Razorpay webhook signature");

      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);

    console.log(
      "Razorpay webhook received:",
      event.event
    );

    const supabase = supabaseAdmin;

    /*
     * We are mainly interested in successful
     * captured payments.
     */
    if (event.event === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;

      if (!paymentEntity) {
        return NextResponse.json(
          { error: "Payment data missing" },
          { status: 400 }
        );
      }

      const razorpayPaymentId = paymentEntity.id;
      const razorpayOrderId = paymentEntity.order_id;

      if (!razorpayPaymentId || !razorpayOrderId) {
        return NextResponse.json(
          { error: "Payment information is incomplete" },
          { status: 400 }
        );
      }

      /*
       * Find the Crevo payment using the Razorpay order ID.
       */
      const { data: payment, error: paymentLookupError } =
        await supabase
          .from("payments")
          .select("id, project_id, status, freelancer_id, amount, project_amount")
          .eq(
            "gateway_order_id",
            razorpayOrderId
          )
          .maybeSingle();

      if (paymentLookupError) {
        console.error(
          "Webhook payment lookup error:",
          paymentLookupError
        );

        return NextResponse.json(
          { error: "Unable to find payment" },
          { status: 500 }
        );
      }

      /*
       * Payment may already be marked paid by the
       * normal Checkout verification route.
       */
      if (!payment) {
        console.log(
          "No Crevo payment found for Razorpay order:",
          razorpayOrderId
        );

        return NextResponse.json({
          success: true,
          message: "Webhook received; payment not found yet",
        });
      }

      if (payment.status !== "paid") {
        const { error: updateError } =
          await supabase
            .from("payments")
            .update({
              status: "paid",
              escrow_status: "funded",
              gateway_payment_id: razorpayPaymentId,
              paid_at: new Date().toISOString(),
            })
            .eq("id", payment.id);

        if (updateError) {
          console.error(
            "Webhook payment update error:",
            updateError
          );

          return NextResponse.json(
            { error: "Unable to update payment" },
            { status: 500 }
          );
        }

        await supabase.from("wallets").upsert({ user_id: payment.freelancer_id }, { onConflict: "user_id", ignoreDuplicates: true });
        const { data: wallet } = await supabase.from("wallets").select("pending_balance").eq("user_id", payment.freelancer_id).maybeSingle();
        await supabase.from("wallets").update({ pending_balance: Number(wallet?.pending_balance || 0) + Number(payment.project_amount ?? payment.amount ?? 0), updated_at: new Date().toISOString() }).eq("user_id", payment.freelancer_id);
        await supabase.from("wallet_transactions").insert({ user_id: payment.freelancer_id, project_id: payment.project_id, payment_id: payment.id, type: "hold", amount: Number(payment.project_amount ?? payment.amount ?? 0), description: "Project payment held until client accepts delivery" });

        console.log(
          "Payment marked as paid by webhook:",
          payment.id
        );
      }
    }

    /*
     * payment.failed
     */
    if (event.event === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;

      if (paymentEntity?.order_id) {
        console.log(
          "Razorpay payment failed for order:",
          paymentEntity.order_id
        );
      }
    }

    return NextResponse.json({
      success: true,
      received: true,
    });
  } catch (error) {
    console.error(
      "Razorpay webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}