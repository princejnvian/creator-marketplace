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

      // IMPORTANT: direct YOUTENT gig checkouts must be finalized before the
      // legacy `payments` flow. Otherwise a matching legacy payment row can
      // route a successful checkout into hold_project_payment(), which is not
      // the atomic checkout/project/ledger finalizer and can leave a captured
      // payment without its project.
      const { data: directCheckout, error: directCheckoutError } = await supabase
        .from("checkout_orders")
        .select("id, status, project_id, package_price, platform_fee, razorpay_order_id")
        .eq("razorpay_order_id", razorpayOrderId)
        .maybeSingle();

      if (directCheckoutError) {
        console.error("Webhook direct checkout lookup error:", directCheckoutError);
        return NextResponse.json({ error: "Unable to look up checkout" }, { status: 500 });
      }

      if (directCheckout) {
        if (directCheckout.status === "paid" && directCheckout.project_id) {
          return NextResponse.json({ success: true, received: true, projectId: String(directCheckout.project_id) });
        }

        const expectedPaise = Math.round((Number(directCheckout.package_price) + Number(directCheckout.platform_fee)) * 100);
        if (
          directCheckout.razorpay_order_id !== razorpayOrderId ||
          Number(paymentEntity.amount) !== expectedPaise ||
          paymentEntity.currency !== "INR" ||
          paymentEntity.status !== "captured"
        ) {
          console.error("Webhook direct checkout amount/status mismatch", { checkoutId: directCheckout.id, razorpayOrderId });
          return NextResponse.json({ error: "Checkout payment amount/status mismatch" }, { status: 400 });
        }

        const { data: projectId, error: finalizeError } = await supabase.rpc("finalize_checkout_payment", {
          p_checkout_id: directCheckout.id,
          p_expected_total: Number(directCheckout.package_price) + Number(directCheckout.platform_fee),
          p_razorpay_order_id: razorpayOrderId,
          p_razorpay_payment_id: razorpayPaymentId,
        });

        if (finalizeError || !projectId) {
          console.error("Webhook direct checkout finalization failed:", {
            checkoutId: directCheckout.id,
            razorpayOrderId,
            razorpayPaymentId,
            code: (finalizeError as any)?.code,
            message: finalizeError?.message,
            details: (finalizeError as any)?.details,
            hint: (finalizeError as any)?.hint,
          });
          return NextResponse.json({ error: "Checkout finalization failed; retry webhook" }, { status: 500 });
        }

        return NextResponse.json({ success: true, received: true, projectId: String(projectId) });
      }

      /*
       * Find the legacy payment using the Razorpay order ID only when this
       * order does not belong to the direct gig checkout flow.
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
        // New gig checkout flow: the project/payment ledger is created only
        // after Razorpay confirms capture. This removes the old request
        // acceptance step from direct gig orders.
        const { data: checkout } = await supabase
          .from("checkout_orders")
          .select("*")
          .eq("razorpay_order_id", razorpayOrderId)
          .maybeSingle();

        if (checkout) {
          const expectedPaise = Math.round((Number(checkout.package_price) + Number(checkout.platform_fee)) * 100);
          if (Number(paymentEntity.amount) !== expectedPaise || paymentEntity.currency !== "INR" || paymentEntity.status !== "captured") {
            return NextResponse.json({ error: "Checkout payment amount/status mismatch" }, { status: 400 });
          }

          // The same DB transaction is used by the browser callback and webhook.
          // It locks the checkout row and returns the existing project on retries.
          const { data: projectId, error: finalizeError } = await supabase.rpc("finalize_checkout_payment", {
            p_checkout_id: checkout.id,
            p_expected_total: Number(checkout.package_price) + Number(checkout.platform_fee),
            p_razorpay_order_id: razorpayOrderId,
            p_razorpay_payment_id: razorpayPaymentId,
          });

          if (finalizeError || !projectId) {
            console.error("Webhook atomic checkout finalization failed:", finalizeError);
            return NextResponse.json({ error: "Checkout finalization failed; retry webhook" }, { status: 500 });
          }
          return NextResponse.json({ success: true, received: true, projectId: String(projectId) });
        }

        console.log("No YOUTENT payment or checkout found for Razorpay order:", razorpayOrderId);
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
              escrow_status: "pending",
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

        const { error: holdError } = await supabase.rpc("hold_project_payment", { p_payment_id: payment.id });
        if (holdError) {
          console.error("Webhook escrow hold error:", holdError);
          return NextResponse.json({ error: "Unable to initialize escrow hold" }, { status: 500 });
        }

        await supabase
          .from("projects")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("id", payment.project_id)
          .in("status", ["pending_payment", "active"]);

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